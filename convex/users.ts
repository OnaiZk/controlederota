import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const normalizedEmail = args.email.trim().toLowerCase();
    
    // Validação de domínio corporativo
    if (normalizedEmail && !normalizedEmail.endsWith("@eletromidia.com.br")) {
      // Para ambiente de desenvolvimento ou avisar usuário
      console.warn(`Atenção: E-mail ${normalizedEmail} não pertence ao domínio @eletromidia.com.br`);
    }

    if (!existing) {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: normalizedEmail,
        role: "TECNICO", // Por padrão todos entram como técnico
      });
    }

    // Atualiza nome ou e-mail caso tenham mudado
    if (existing.name !== args.name || existing.email !== normalizedEmail) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: normalizedEmail,
      });
    }

    return existing._id;
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.clerkId) return null;
    const clerkId = args.clerkId;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("TECNICO"), v.literal("LIDER")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { role: args.role });
  },
});

export const remove = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Usuário não encontrado.");
    }
    await ctx.db.delete(args.id);
  },
});

