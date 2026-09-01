import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("maintenances").collect();
    return list.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  },
});

export const listByVehicle = query({
  args: {
    vehicleId: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("maintenances")
      .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();
    return list.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  },
});

export const listByPlaca = query({
  args: {
    placa: v.string(),
  },
  handler: async (ctx, args) => {
    const placaClean = args.placa.trim().toUpperCase();
    const list = await ctx.db
      .query("maintenances")
      .withIndex("by_placa", (q) => q.eq("placa", placaClean))
      .collect();
    return list.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  },
});

export const listByCentroOperacao = query({
  args: {
    centroOperacao: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("maintenances")
      .withIndex("by_centroOperacao", (q) => q.eq("centroOperacao", args.centroOperacao))
      .collect();
    return list.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  },
});

export const colocarEmManutencao = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    motivo: v.optional(v.string()),
    dataEntrada: v.optional(v.string()),
    horaEntrada: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado.");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nowHoraStr = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await ctx.db.patch(args.vehicleId, {
      status: "MANUTENCAO",
      dataEntradaManutencao: args.dataEntrada || todayStr,
      horaEntradaManutencao: args.horaEntrada || nowHoraStr,
      motivoManutencao: args.motivo ? args.motivo.trim() : undefined,
    });

    return args.vehicleId;
  },
});

export const reativarVeiculo = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    descricaoServico: v.string(), // Obrigatório: o que foi feito no carro
    tipoManutencao: v.optional(v.string()),
    kmManutencao: v.optional(v.number()),
    proximaManutencaoKm: v.optional(v.number()),
    oficina: v.optional(v.string()),
    custo: v.optional(v.number()),
    dataReativacao: v.optional(v.string()),
    horaReativacao: v.optional(v.string()),
    dataEntrada: v.optional(v.string()),
    motivoEntrada: v.optional(v.string()),
    realizadoPorNome: v.string(),
    realizadoPorEmail: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado.");
    }

    const descricaoTrimmed = args.descricaoServico ? args.descricaoServico.trim() : "";
    if (!descricaoTrimmed) {
      throw new Error("A descrição dos serviços realizados no carro é obrigatória para reativação.");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nowHoraStr = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const dataFinal = args.dataReativacao || todayStr;
    const horaFinal = args.horaReativacao || nowHoraStr;
    const dataEntradaFinal = args.dataEntrada || vehicle.dataEntradaManutencao;
    const motivoEntradaFinal = args.motivoEntrada || vehicle.motivoManutencao;

    // 1. Cria o registro definitivo de histórico de manutenção
    const maintenanceId = await ctx.db.insert("maintenances", {
      vehicleId: vehicle._id,
      placa: vehicle.placa,
      modelo: vehicle.modelo,
      tag: vehicle.tag,
      centroOperacao: vehicle.centroOperacao,
      dataEntrada: dataEntradaFinal,
      horaEntrada: vehicle.horaEntradaManutencao,
      dataReativacao: dataFinal,
      horaReativacao: horaFinal,
      kmManutencao: args.kmManutencao !== undefined ? args.kmManutencao : vehicle.kmAtual,
      motivoEntrada: motivoEntradaFinal,
      descricaoServico: descricaoTrimmed,
      tipoManutencao: args.tipoManutencao || "PREVENTIVA",
      oficina: args.oficina ? args.oficina.trim() : undefined,
      custo: args.custo !== undefined && args.custo > 0 ? args.custo : undefined,
      proximaRevisaoKm: args.proximaManutencaoKm,
      realizadoPorNome: args.realizadoPorNome.trim(),
      realizadoPorEmail: args.realizadoPorEmail ? args.realizadoPorEmail.trim() : undefined,
      userId: args.userId,
      status: "CONCLUIDA",
      criadoEm: Date.now(),
    });

    // 2. Atualiza o status do veículo para ATIVO e salva metadados
    const vehiclePatch: any = {
      status: "ATIVO",
      dataEntradaManutencao: undefined,
      horaEntradaManutencao: undefined,
      motivoManutencao: undefined,
      ultimaManutencaoData: dataFinal,
      ultimaManutencaoDescricao: descricaoTrimmed,
    };

    if (args.proximaManutencaoKm !== undefined && args.proximaManutencaoKm > 0) {
      vehiclePatch.proximaManutencaoKm = args.proximaManutencaoKm;
    }

    if (args.kmManutencao !== undefined && args.kmManutencao > 0) {
      if (!vehicle.kmAtual || args.kmManutencao > vehicle.kmAtual) {
        vehiclePatch.kmAtual = args.kmManutencao;
      }
    }

    await ctx.db.patch(vehicle._id, vehiclePatch);

    return maintenanceId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("maintenances"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Registro de manutenção não encontrado.");
    }
    await ctx.db.delete(args.id);
  },
});
