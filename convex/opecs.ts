import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("opecs").collect();
  },
});

export const listByCentroOperacao = query({
  args: {
    centroOperacao: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opecs")
      .withIndex("by_centroOperacao", (q) => q.eq("centroOperacao", args.centroOperacao))
      .collect();
  },
});

export const create = mutation({
  args: {
    codigo: v.string(),
    descricao: v.optional(v.string()),
    centroOperacao: v.optional(v.string()),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
  },
  handler: async (ctx, args) => {
    const cleanCodigo = args.codigo.trim();
    const existing = await ctx.db
      .query("opecs")
      .withIndex("by_codigo", (q) => q.eq("codigo", cleanCodigo))
      .first();

    if (existing) {
      throw new Error(`OPEC "${cleanCodigo}" já está cadastrado.`);
    }

    return await ctx.db.insert("opecs", {
      codigo: cleanCodigo,
      descricao: args.descricao ? args.descricao.trim() : undefined,
      centroOperacao: args.centroOperacao || "Matriz",
      status: args.status,
    });
  },
});

export const updateOpec = mutation({
  args: {
    id: v.id("opecs"),
    codigo: v.optional(v.string()),
    descricao: v.optional(v.string()),
    centroOperacao: v.optional(v.string()),
    status: v.optional(v.union(v.literal("ATIVO"), v.literal("MANUTENCAO"))),
  },
  handler: async (ctx, args) => {
    const patchData: any = {};
    if (args.codigo !== undefined) patchData.codigo = args.codigo.trim();
    if (args.descricao !== undefined) patchData.descricao = args.descricao ? args.descricao.trim() : undefined;
    if (args.centroOperacao !== undefined) patchData.centroOperacao = args.centroOperacao;
    if (args.status !== undefined) patchData.status = args.status;
    await ctx.db.patch(args.id, patchData);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("opecs"),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateCentroOperacao = mutation({
  args: {
    id: v.id("opecs"),
    centroOperacao: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { centroOperacao: args.centroOperacao });
  },
});

export const remove = mutation({
  args: {
    id: v.id("opecs"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("OPEC não encontrado.");
    }
    await ctx.db.delete(args.id);
  },
});

export const removeAll = mutation({
  handler: async (ctx) => {
    const allOpecs = await ctx.db.query("opecs").collect();
    for (const opec of allOpecs) {
      await ctx.db.delete(opec._id);
    }
    return allOpecs.length;
  },
});

export const initializeDefaultOpecs = mutation({
  handler: async (ctx) => {
    const defaultList = [
      ...Array.from({ length: 50 }, (_, i) => {
        const num = String(i + 1).padStart(2, "0");
        return `OPEC ${num}`;
      }),
      "OPEC Reserva",
      "OPEC Apoio",
      "Celular Próprio / Particular",
    ];

    let inserted = 0;
    let updated = 0;

    for (const codigo of defaultList) {
      const existing = await ctx.db
        .query("opecs")
        .withIndex("by_codigo", (q) => q.eq("codigo", codigo))
        .first();

      if (!existing) {
        await ctx.db.insert("opecs", {
          codigo,
          descricao: codigo === "Celular Próprio / Particular" ? "Aparelho do Técnico" : "Celular Corporativo",
          centroOperacao: "Matriz", // Todos os OPECs adicionados atualmente são da Matriz
          status: "ATIVO",
        });
        inserted++;
      } else if (!existing.centroOperacao) {
        await ctx.db.patch(existing._id, { centroOperacao: "Matriz" });
        updated++;
      }
    }

    return { inserted, updated };
  },
});
