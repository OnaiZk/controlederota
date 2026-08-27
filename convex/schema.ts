import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("TECNICO"), v.literal("LIDER")),
    centroOperacao: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  vehicles: defineTable({
    placa: v.string(),
    modelo: v.string(),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
    centroOperacao: v.optional(v.string()),
    kmAtual: v.optional(v.number()),
    proximaManutencaoKm: v.optional(v.number()),
  })
    .index("by_placa", ["placa"])
    .index("by_centroOperacao", ["centroOperacao"]),

  checklists: defineTable({
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    data: v.string(), // ISO date
    hora: v.string(),
    centroOperacao: v.string(),
    kmInicial: v.number(),
    kmFinal: v.optional(v.number()),
    
    // Horários e Status
    horaFinal: v.optional(v.string()),
    status: v.optional(v.union(v.literal("EM_ANDAMENTO"), v.literal("FINALIZADO"))),
    observacoesFim: v.optional(v.string()),

    // Verificações
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
    
    // Fotos de Saída (Início da Operação)
    fotoFrente: v.optional(v.id("_storage")),
    fotoLadoEsquerdo: v.optional(v.id("_storage")),
    fotoLadoDireito: v.optional(v.id("_storage")),
    fotoTras: v.optional(v.id("_storage")),
    fotoInterna: v.optional(v.id("_storage")),
    fotoCarroceria: v.optional(v.id("_storage")),

    // Fotos de Retorno (Pós-Atividades / Encerramento)
    fotoFimFrente: v.optional(v.id("_storage")),
    fotoFimLadoEsquerdo: v.optional(v.id("_storage")),
    fotoFimLadoDireito: v.optional(v.id("_storage")),
    fotoFimTras: v.optional(v.id("_storage")),
    fotoFimInterna: v.optional(v.id("_storage")),
    fotoFimCarroceria: v.optional(v.id("_storage")),
  }).index("by_date", ["data"])
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),
});
