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
    tag: v.optional(v.string()),
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
    centroOperacao: v.optional(v.string()),
    kmAtual: v.optional(v.number()),
    proximaManutencaoKm: v.optional(v.number()),
    dataEntradaManutencao: v.optional(v.string()), // Data ISO (YYYY-MM-DD) quando entrou em manutenção
    horaEntradaManutencao: v.optional(v.string()), // HH:mm
    motivoManutencao: v.optional(v.string()), // Motivo/defeito relatado ao entrar em manutenção
    ultimaManutencaoData: v.optional(v.string()), // Data da última manutenção concluída
    ultimaManutencaoDescricao: v.optional(v.string()), // Resumo do que foi feito na última manutenção
  })
    .index("by_placa", ["placa"])
    .index("by_tag", ["tag"])
    .index("by_centroOperacao", ["centroOperacao"])
    .index("by_status", ["status"]),

  maintenances: defineTable({
    vehicleId: v.id("vehicles"),
    placa: v.string(),
    modelo: v.optional(v.string()),
    tag: v.optional(v.string()),
    centroOperacao: v.optional(v.string()),

    // Datas e Horários
    dataEntrada: v.optional(v.string()), // Data ISO (YYYY-MM-DD) da entrada na manutenção
    horaEntrada: v.optional(v.string()), // HH:mm
    dataReativacao: v.string(), // Data ISO (YYYY-MM-DD) da conclusão / reativação
    horaReativacao: v.optional(v.string()), // HH:mm

    // Informações Técnicas e Serviços
    kmManutencao: v.optional(v.number()), // KM no momento da manutenção
    motivoEntrada: v.optional(v.string()), // Problema ou motivo informado na entrada
    descricaoServico: v.string(), // O que foi feito no carro (Obrigatório)
    tipoManutencao: v.optional(v.string()), // "PREVENTIVA", "CORRETIVA", "REVISAO", "PNEUS", "ELETRICA", "FUNILARIA", "OUTRO"
    oficina: v.optional(v.string()), // Oficina / Mecânica / Concessionária
    custo: v.optional(v.number()), // Valor / Custo em R$
    proximaRevisaoKm: v.optional(v.number()), // Próxima revisão configurada após a manutenção

    // Responsável (Líder)
    realizadoPorNome: v.string(),
    realizadoPorEmail: v.optional(v.string()),
    userId: v.optional(v.id("users")),

    status: v.literal("CONCLUIDA"),
    criadoEm: v.number(), // Timestamp Unix (Date.now())
  })
    .index("by_vehicleId", ["vehicleId"])
    .index("by_placa", ["placa"])
    .index("by_dataReativacao", ["dataReativacao"])
    .index("by_centroOperacao", ["centroOperacao"]),

  opecs: defineTable({
    codigo: v.string(), // Identificador do aparelho (ex: "OPEC 01", "OPEC Reserva", etc.)
    descricao: v.optional(v.string()), // Modelo / Descrição (ex: "Samsung Galaxy A14", "Motorola G54")
    centroOperacao: v.optional(v.string()), // Filial (ex: "Matriz", "Sul", "Leste", "T.I")
    status: v.union(v.literal("ATIVO"), v.literal("MANUTENCAO")),
  })
    .index("by_codigo", ["codigo"])
    .index("by_centroOperacao", ["centroOperacao"])
    .index("by_status", ["status"]),

  checklists: defineTable({
    userId: v.id("users"),
    vehicleId: v.id("vehicles"),
    data: v.string(), // ISO date
    hora: v.string(),
    centroOperacao: v.string(),
    kmInicial: v.number(),
    kmFinal: v.optional(v.number()),
    
    // Identificação da Operação
    opec: v.optional(v.string()), // Celular corporativo (OPEC) utilizado

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

    // Assinatura do Técnico
    assinaturaTecnico: v.optional(v.string()), // base64 data URL da assinatura na saída
    assinaturaFimTecnico: v.optional(v.string()), // base64 data URL da assinatura no encerramento

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
