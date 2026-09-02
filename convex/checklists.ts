import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    clerkId: v.optional(v.string()),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    veiculoPlaca: v.string(),
    
    data: v.string(),
    hora: v.string(),
    centroOperacao: v.string(),
    opec: v.optional(v.string()),
    kmInicial: v.number(),
    kmFinal: v.optional(v.number()),
    
    nivelOleo: v.string(),
    nivelAgua: v.string(),
    nivelCombustivel: v.string(),
    
    estepe: v.union(v.string(), v.boolean()),
    triangulo: v.union(v.string(), v.boolean()),
    chaveRoda: v.union(v.string(), v.boolean()),
    faroisLanternas: v.union(v.string(), v.boolean()),
    macaco: v.union(v.string(), v.boolean()),
    buzina: v.union(v.string(), v.boolean()),
    documentacao: v.union(v.string(), v.boolean()),
    cartaoAbastecimento: v.union(v.string(), v.boolean()),
    
    // Fotos de Saída
    fotoFrente: v.optional(v.id("_storage")),
    fotoLadoEsquerdo: v.optional(v.id("_storage")),
    fotoLadoDireito: v.optional(v.id("_storage")),
    fotoTras: v.optional(v.id("_storage")),
    fotoInterna: v.optional(v.id("_storage")),
    fotoCarroceria: v.optional(v.id("_storage")),

    // Fotos de Retorno (opcional na criação direta)
    fotoFimFrente: v.optional(v.id("_storage")),
    fotoFimLadoEsquerdo: v.optional(v.id("_storage")),
    fotoFimLadoDireito: v.optional(v.id("_storage")),
    fotoFimTras: v.optional(v.id("_storage")),
    fotoFimInterna: v.optional(v.id("_storage")),
    fotoFimCarroceria: v.optional(v.id("_storage")),
    observacoesFim: v.optional(v.string()),

    // Assinaturas do Técnico
    assinaturaTecnico: v.optional(v.string()),
    assinaturaFimTecnico: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Identifica ou cria o usuário
    let userId;
    if (args.clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId!))
        .first();

      if (user) {
        userId = user._id;
      } else {
        userId = await ctx.db.insert("users", {
          clerkId: args.clerkId,
          name: args.userName || "Técnico",
          email: args.userEmail || "",
          role: "TECNICO",
          centroOperacao: args.centroOperacao,
        });
      }
    } else {
      // Fallback para usuário genérico
      const fallbackUser = await ctx.db.query("users").first();
      if (fallbackUser) {
        userId = fallbackUser._id;
      } else {
        userId = await ctx.db.insert("users", {
          clerkId: "system-fallback",
          name: args.userName || "Técnico Padrão",
          email: "tecnico@eletromidia.com.br",
          role: "TECNICO",
        });
      }
    }

    // 2. Acha ou cria o veículo pela placa
    const placaClean = args.veiculoPlaca.trim().toUpperCase();
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_placa", (q) => q.eq("placa", placaClean))
      .first();

    let vehicleId = vehicle?._id;
    if (!vehicleId) {
      vehicleId = await ctx.db.insert("vehicles", {
        placa: placaClean,
        modelo: "Veículo Frota",
        status: "ATIVO",
      });
    }

    const isFinalized = args.kmFinal !== undefined && args.kmFinal !== null && args.kmFinal > 0;
    const status = isFinalized ? "FINALIZADO" : "EM_ANDAMENTO";

    // 3. Insere checklist
    const checklistId = await ctx.db.insert("checklists", {
      userId,
      vehicleId,
      data: args.data,
      hora: args.hora,
      horaFinal: isFinalized ? args.hora : undefined,
      status,
      centroOperacao: args.centroOperacao,
      opec: args.opec,
      kmInicial: args.kmInicial,
      kmFinal: args.kmFinal,
      nivelOleo: args.nivelOleo,
      nivelAgua: args.nivelAgua,
      nivelCombustivel: args.nivelCombustivel,
      estepe: args.estepe,
      triangulo: args.triangulo,
      chaveRoda: args.chaveRoda,
      faroisLanternas: args.faroisLanternas,
      macaco: args.macaco,
      buzina: args.buzina,
      documentacao: args.documentacao,
      cartaoAbastecimento: args.cartaoAbastecimento,
      fotoFrente: args.fotoFrente,
      fotoLadoEsquerdo: args.fotoLadoEsquerdo,
      fotoLadoDireito: args.fotoLadoDireito,
      fotoTras: args.fotoTras,
      fotoInterna: args.fotoInterna,
      fotoCarroceria: args.fotoCarroceria,
      fotoFimFrente: args.fotoFimFrente,
      fotoFimLadoEsquerdo: args.fotoFimLadoEsquerdo,
      fotoFimLadoDireito: args.fotoFimLadoDireito,
      fotoFimTras: args.fotoFimTras,
      fotoFimInterna: args.fotoFimInterna,
      fotoFimCarroceria: args.fotoFimCarroceria,
      observacoesFim: args.observacoesFim,
      assinaturaTecnico: args.assinaturaTecnico,
      assinaturaFimTecnico: args.assinaturaFimTecnico || (isFinalized ? args.assinaturaTecnico : undefined),
    });

    // Atualiza o kmAtual do veículo
    const currentKm = args.kmFinal || args.kmInicial;
    if (currentKm) {
      await ctx.db.patch(vehicleId, { kmAtual: currentKm });
    }

    return checklistId;
  },
});

export const getActiveChecklist = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.clerkId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId!))
      .first();

    if (!user) return null;

    // Busca checklists em andamento do usuário
    const openChecklists = await ctx.db
      .query("checklists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Filtra pelo checklist mais recente que ainda não foi finalizado (status EM_ANDAMENTO ou sem kmFinal)
    const active = openChecklists.find(
      (c) => c.status === "EM_ANDAMENTO" || c.kmFinal === undefined || c.kmFinal === null
    );

    if (!active) return null;

    const vehicle = await ctx.db.get(active.vehicleId);

    // Gerar URLs das fotos de saída para pré-visualização se houver
    const [
      urlFrente,
      urlLadoEsquerdo,
      urlLadoDireito,
      urlTras,
      urlInterna,
      urlCarroceria,
    ] = await Promise.all([
      active.fotoFrente ? ctx.storage.getUrl(active.fotoFrente) : null,
      active.fotoLadoEsquerdo ? ctx.storage.getUrl(active.fotoLadoEsquerdo) : null,
      active.fotoLadoDireito ? ctx.storage.getUrl(active.fotoLadoDireito) : null,
      active.fotoTras ? ctx.storage.getUrl(active.fotoTras) : null,
      active.fotoInterna ? ctx.storage.getUrl(active.fotoInterna) : null,
      active.fotoCarroceria ? ctx.storage.getUrl(active.fotoCarroceria) : null,
    ]);

    return {
      ...active,
      veiculoPlaca: vehicle?.placa || "Sem Placa",
      veiculoModelo: vehicle?.modelo || "Modelo não informado",
      photoUrls: {
        frente: urlFrente,
        ladoEsquerdo: urlLadoEsquerdo,
        ladoDireito: urlLadoDireito,
        tras: urlTras,
        interna: urlInterna,
        carroceria: urlCarroceria,
      },
    };
  },
});

export const finalize = mutation({
  args: {
    id: v.id("checklists"),
    kmFinal: v.number(),
    horaFinal: v.string(),
    fotoFimFrente: v.optional(v.id("_storage")),
    fotoFimLadoEsquerdo: v.optional(v.id("_storage")),
    fotoFimLadoDireito: v.optional(v.id("_storage")),
    fotoFimTras: v.optional(v.id("_storage")),
    fotoFimInterna: v.optional(v.id("_storage")),
    fotoFimCarroceria: v.optional(v.id("_storage")),
    observacoesFim: v.optional(v.string()),
    assinaturaFimTecnico: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.id);
    if (!checklist) {
      throw new Error("Checklist não encontrado.");
    }

    if (args.kmFinal < checklist.kmInicial) {
      throw new Error("O KM Final não pode ser menor do que o KM Inicial registrado na saída.");
    }

    // Atualiza o checklist com os dados de encerramento
    await ctx.db.patch(args.id, {
      kmFinal: args.kmFinal,
      horaFinal: args.horaFinal,
      status: "FINALIZADO",
      fotoFimFrente: args.fotoFimFrente ?? checklist.fotoFimFrente,
      fotoFimLadoEsquerdo: args.fotoFimLadoEsquerdo ?? checklist.fotoFimLadoEsquerdo,
      fotoFimLadoDireito: args.fotoFimLadoDireito ?? checklist.fotoFimLadoDireito,
      fotoFimTras: args.fotoFimTras ?? checklist.fotoFimTras,
      fotoFimInterna: args.fotoFimInterna ?? checklist.fotoFimInterna,
      fotoFimCarroceria: args.fotoFimCarroceria ?? checklist.fotoFimCarroceria,
      observacoesFim: args.observacoesFim ?? checklist.observacoesFim,
      assinaturaFimTecnico: args.assinaturaFimTecnico ?? checklist.assinaturaFimTecnico,
    });

    // Atualiza o KM atual do veículo
    await ctx.db.patch(checklist.vehicleId, {
      kmAtual: args.kmFinal,
    });

    return args.id;
  },
});

export const listAll = query({
  args: {
    dataFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let checklists = await ctx.db.query("checklists").order("desc").collect();

    if (args.dataFilter) {
      checklists = checklists.filter((c) => c.data === args.dataFilter);
    }

    // Enriquecer os dados com o usuário e veículo
    const enriched = await Promise.all(
      checklists.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        const vehicle = await ctx.db.get(c.vehicleId);
        
        return {
          ...c,
          status: c.status || (c.kmFinal ? "FINALIZADO" : "EM_ANDAMENTO"),
          tecnicoNome: user?.name || "Técnico",
          tecnicoEmail: user?.email || "",
          veiculoPlaca: vehicle?.placa || "Sem Placa",
          veiculoModelo: vehicle?.modelo || "Modelo não informado",
        };
      })
    );

    return enriched;
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const allChecklists = await ctx.db.query("checklists").collect();
    const todayChecklists = allChecklists.filter((c) => c.data === today);

    // Técnicos únicos hoje
    const uniqueTechniciansToday = new Set(todayChecklists.map((c) => c.userId));
    
    // Veículos únicos hoje
    const uniqueVehiclesToday = new Set(todayChecklists.map((c) => c.vehicleId));

    const totalVehicles = (await ctx.db.query("vehicles").collect()).length;

    const inProgressToday = todayChecklists.filter(
      (c) => c.status === "EM_ANDAMENTO" || !c.kmFinal
    ).length;

    const completedToday = todayChecklists.filter(
      (c) => c.status === "FINALIZADO" || !!c.kmFinal
    ).length;

    return {
      totalChecklistsToday: todayChecklists.length,
      inProgressToday,
      completedToday,
      activeTechniciansToday: uniqueTechniciansToday.size,
      vehiclesInUseToday: uniqueVehiclesToday.size,
      totalVehicles,
    };
  },
});

export const getDetails = query({
  args: { id: v.id("checklists") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.id);
    if (!checklist) return null;

    const user = await ctx.db.get(checklist.userId);
    const vehicle = await ctx.db.get(checklist.vehicleId);

    // Gerar URLs reais de visualização das fotos armazenadas no Convex Storage
    const [
      urlFrente,
      urlLadoEsquerdo,
      urlLadoDireito,
      urlTras,
      urlInterna,
      urlCarroceria,
      urlFimFrente,
      urlFimLadoEsquerdo,
      urlFimLadoDireito,
      urlFimTras,
      urlFimInterna,
      urlFimCarroceria,
    ] = await Promise.all([
      checklist.fotoFrente ? ctx.storage.getUrl(checklist.fotoFrente) : null,
      checklist.fotoLadoEsquerdo ? ctx.storage.getUrl(checklist.fotoLadoEsquerdo) : null,
      checklist.fotoLadoDireito ? ctx.storage.getUrl(checklist.fotoLadoDireito) : null,
      checklist.fotoTras ? ctx.storage.getUrl(checklist.fotoTras) : null,
      checklist.fotoInterna ? ctx.storage.getUrl(checklist.fotoInterna) : null,
      checklist.fotoCarroceria ? ctx.storage.getUrl(checklist.fotoCarroceria) : null,
      
      checklist.fotoFimFrente ? ctx.storage.getUrl(checklist.fotoFimFrente) : null,
      checklist.fotoFimLadoEsquerdo ? ctx.storage.getUrl(checklist.fotoFimLadoEsquerdo) : null,
      checklist.fotoFimLadoDireito ? ctx.storage.getUrl(checklist.fotoFimLadoDireito) : null,
      checklist.fotoFimTras ? ctx.storage.getUrl(checklist.fotoFimTras) : null,
      checklist.fotoFimInterna ? ctx.storage.getUrl(checklist.fotoFimInterna) : null,
      checklist.fotoFimCarroceria ? ctx.storage.getUrl(checklist.fotoFimCarroceria) : null,
    ]);

    return {
      ...checklist,
      status: checklist.status || (checklist.kmFinal ? "FINALIZADO" : "EM_ANDAMENTO"),
      tecnicoNome: user?.name || "Técnico",
      tecnicoEmail: user?.email || "",
      veiculoPlaca: vehicle?.placa || "Sem Placa",
      veiculoModelo: vehicle?.modelo || "Modelo não informado",
      photoUrls: {
        frente: urlFrente,
        ladoEsquerdo: urlLadoEsquerdo,
        ladoDireito: urlLadoDireito,
        tras: urlTras,
        interna: urlInterna,
        carroceria: urlCarroceria,
      },
      photoFimUrls: {
        frente: urlFimFrente,
        ladoEsquerdo: urlFimLadoEsquerdo,
        ladoDireito: urlFimLadoDireito,
        tras: urlFimTras,
        interna: urlFimInterna,
        carroceria: urlFimCarroceria,
      },
    };
  },
});

export const remove = mutation({
  args: {
    id: v.id("checklists"),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.id);
    if (!checklist) {
      throw new Error("Checklist não encontrado.");
    }

    // Exclui fotos armazenadas no Convex Storage associadas a este checklist
    const photoIds = [
      checklist.fotoFrente,
      checklist.fotoLadoEsquerdo,
      checklist.fotoLadoDireito,
      checklist.fotoTras,
      checklist.fotoInterna,
      checklist.fotoCarroceria,
      checklist.fotoFimFrente,
      checklist.fotoFimLadoEsquerdo,
      checklist.fotoFimLadoDireito,
      checklist.fotoFimTras,
      checklist.fotoFimInterna,
      checklist.fotoFimCarroceria,
    ];

    for (const photoId of photoIds) {
      if (photoId) {
        try {
          await ctx.storage.delete(photoId);
        } catch (e) {
          console.warn("Não foi possível excluir o arquivo do storage:", photoId, e);
        }
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
