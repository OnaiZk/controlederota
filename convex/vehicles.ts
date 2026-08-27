import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

export const listByCentroOperacao = query({
  args: {
    centroOperacao: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_centroOperacao", (q) => q.eq("centroOperacao", args.centroOperacao))
      .collect();
  },
});

export const create = mutation({
  args: {
    placa: v.string(),
    modelo: v.string(),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
    centroOperacao: v.optional(v.string()),
    kmAtual: v.optional(v.number()),
    proximaManutencaoKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_placa", (q) => q.eq("placa", args.placa.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Veículo com esta placa já está cadastrado.");
    }

    return await ctx.db.insert("vehicles", {
      placa: args.placa.toUpperCase(),
      modelo: args.modelo,
      status: args.status,
      centroOperacao: args.centroOperacao,
      kmAtual: args.kmAtual,
      proximaManutencaoKm: args.proximaManutencaoKm,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("vehicles"),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateCentroOperacao = mutation({
  args: {
    id: v.id("vehicles"),
    centroOperacao: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { centroOperacao: args.centroOperacao });
  },
});

export const updateVehicle = mutation({
  args: {
    id: v.id("vehicles"),
    placa: v.optional(v.string()),
    modelo: v.optional(v.string()),
    centroOperacao: v.optional(v.string()),
    status: v.optional(v.union(v.literal("ATIVO"), v.literal("MANUTENCAO"))),
  },
  handler: async (ctx, args) => {
    const patchData: any = {};
    if (args.placa !== undefined) patchData.placa = args.placa.toUpperCase().trim();
    if (args.modelo !== undefined) patchData.modelo = args.modelo.trim();
    if (args.centroOperacao !== undefined) patchData.centroOperacao = args.centroOperacao;
    if (args.status !== undefined) patchData.status = args.status;
    await ctx.db.patch(args.id, patchData);
  },
});

export const updateManutencao = mutation({
  args: {
    id: v.id("vehicles"),
    proximaManutencaoKm: v.optional(v.number()),
    kmAtual: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patchData: any = {};
    if (args.proximaManutencaoKm !== undefined) patchData.proximaManutencaoKm = args.proximaManutencaoKm;
    if (args.kmAtual !== undefined) patchData.kmAtual = args.kmAtual;
    await ctx.db.patch(args.id, patchData);
  },
});

export const insertMany = mutation({
  args: {
    vehicles: v.array(
      v.object({
        placa: v.string(),
        modelo: v.string(),
        status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
        centroOperacao: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const vehicle of args.vehicles) {
      const placaClean = vehicle.placa.trim().toUpperCase();
      const existing = await ctx.db
        .query("vehicles")
        .withIndex("by_placa", (q) => q.eq("placa", placaClean))
        .first();

      if (!existing) {
        await ctx.db.insert("vehicles", {
          placa: placaClean,
          modelo: vehicle.modelo,
          status: vehicle.status,
          centroOperacao: vehicle.centroOperacao,
        });
        inserted++;
      }
    }
    return inserted;
  },
});

export const assignBatchCentroOperacao = mutation({
  args: {
    targetCentroOperacao: v.string(),
    onlyUnassigned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const allVehicles = await ctx.db.query("vehicles").collect();
    let updated = 0;
    for (const vehicle of allVehicles) {
      if (!args.onlyUnassigned || !vehicle.centroOperacao) {
        await ctx.db.patch(vehicle._id, { centroOperacao: args.targetCentroOperacao });
        updated++;
      }
    }
    return updated;
  },
});

export const remove = mutation({
  args: {
    id: v.id("vehicles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Veículo não encontrado.");
    }
    await ctx.db.delete(args.id);
  },
});

export const removeAll = mutation({
  handler: async (ctx) => {
    const allVehicles = await ctx.db.query("vehicles").collect();
    for (const vehicle of allVehicles) {
      await ctx.db.delete(vehicle._id);
    }
    return allVehicles.length;
  },
});


