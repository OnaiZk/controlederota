"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  User as UserIcon,
  LogOut as LogOutIcon,
  CheckCircle2Icon,
  CarIcon,
  ClockIcon,
  RouteIcon,
  CameraIcon,
  SaveIcon,
  RotateCcwIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VehicleCombobox } from "@/components/VehicleCombobox";
import Image from "next/image";

// Schema de Início do Checklist (KM Final é opcional)
const startChecklistSchema = z
  .object({
    centroOperacao: z.string().min(1, "Selecione o centro de operação"),
    veiculoId: z.string().min(1, "Informe a placa do veículo"),
    kmInicial: z.coerce.number().min(0, "KM inicial deve ser positivo"),
    kmFinal: z.coerce.number().optional().nullable(),
    
    nivelOleo: z.string().min(1, "Obrigatório"),
    nivelAgua: z.string().min(1, "Obrigatório"),
    nivelCombustivel: z.string().min(1, "Obrigatório"),
    
    estepe: z.string().min(1, "Selecione o status"),
    triangulo: z.string().min(1, "Selecione o status"),
    chaveRoda: z.string().min(1, "Selecione o status"),
    faroisLanternas: z.string().min(1, "Selecione o status"),
    macaco: z.string().min(1, "Selecione o status"),
    buzina: z.string().min(1, "Selecione o status"),
    documentacao: z.string().min(1, "Selecione o status"),
    cartaoAbastecimento: z.string().min(1, "Selecione o status"),

    fotoFrente: z.string().optional(),
    fotoLadoEsquerdo: z.string().optional(),
    fotoLadoDireito: z.string().optional(),
    fotoTras: z.string().optional(),
    fotoInterna: z.string().optional(),
    fotoCarroceria: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.kmFinal && data.kmFinal > 0) {
        return data.kmFinal >= data.kmInicial;
      }
      return true;
    },
    {
      message: "O KM final não pode ser menor que o KM inicial",
      path: ["kmFinal"],
    }
  );

type StartChecklistFormValues = z.infer<typeof startChecklistSchema>;

// Schema de Encerramento (KM Final obrigatório + Fotos de Retorno)
const finalizeChecklistSchema = z
  .object({
    kmFinal: z.coerce.number().min(1, "Informe o KM final do veículo"),
    observacoesFim: z.string().optional(),
    fotoFimFrente: z.string().optional(),
    fotoFimLadoEsquerdo: z.string().optional(),
    fotoFimLadoDireito: z.string().optional(),
    fotoFimTras: z.string().optional(),
    fotoFimInterna: z.string().optional(),
    fotoFimCarroceria: z.string().optional(),
  });

type FinalizeChecklistFormValues = z.infer<typeof finalizeChecklistSchema>;

type ChecklistItemKey = 
  | "estepe"
  | "triangulo"
  | "chaveRoda"
  | "faroisLanternas"
  | "macaco"
  | "buzina"
  | "documentacao"
  | "cartaoAbastecimento";

const checklistItems: { id: ChecklistItemKey; label: string; options: string[] }[] = [
  { id: "estepe", label: "Estepe", options: ["Bom", "Ruim"] },
  { id: "triangulo", label: "Triângulo", options: ["Sim", "Não"] },
  { id: "chaveRoda", label: "Chave de Roda", options: ["Sim", "Não"] },
  { id: "faroisLanternas", label: "Faróis e Lanternas", options: ["Bom", "Ruim"] },
  { id: "macaco", label: "Macaco", options: ["Sim", "Não"] },
  { id: "buzina", label: "Buzina", options: ["Sim", "Não"] },
  { id: "documentacao", label: "Documentação", options: ["Sim", "Não"] },
  { id: "cartaoAbastecimento", label: "Cartão Abastecimento", options: ["Sim", "Não"] },
];

type ChecklistPhotoKey =
  | "fotoFrente"
  | "fotoLadoEsquerdo"
  | "fotoLadoDireito"
  | "fotoTras"
  | "fotoInterna"
  | "fotoCarroceria";

const departurePhotoItems: { id: ChecklistPhotoKey; label: string }[] = [
  { id: "fotoFrente", label: "Frente do Veículo" },
  { id: "fotoLadoEsquerdo", label: "Lado Esquerdo" },
  { id: "fotoLadoDireito", label: "Lado Direito" },
  { id: "fotoTras", label: "Traseira" },
  { id: "fotoInterna", label: "Parte Interna" },
  { id: "fotoCarroceria", label: "Carroceria" },
];

type ReturnPhotoKey =
  | "fotoFimFrente"
  | "fotoFimLadoEsquerdo"
  | "fotoFimLadoDireito"
  | "fotoFimTras"
  | "fotoFimInterna"
  | "fotoFimCarroceria";

const returnPhotoItems: { id: ReturnPhotoKey; label: string }[] = [
  { id: "fotoFimFrente", label: "Frente (Retorno)" },
  { id: "fotoFimLadoEsquerdo", label: "Lado Esquerdo (Retorno)" },
  { id: "fotoFimLadoDireito", label: "Lado Direito (Retorno)" },
  { id: "fotoFimTras", label: "Traseira (Retorno)" },
  { id: "fotoFimInterna", label: "Parte Interna (Retorno)" },
  { id: "fotoFimCarroceria", label: "Carroceria (Retorno)" },
];

export default function ChecklistPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const createChecklist = useMutation(api.checklists.create);
  const finalizeChecklist = useMutation(api.checklists.finalize);
  const vehicles = useQuery(api.vehicles.list);
  const activeChecklist = useQuery(
    api.checklists.getActiveChecklist,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const isLeader = currentUser?.role === "LIDER";

  const [forceNewChecklist, setForceNewChecklist] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [showDepartureDetails, setShowDepartureDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    placa: string;
    modelo: string;
    kmInicial: number;
    kmFinal: number;
    kmRodados: number;
    horaSaida: string;
    horaFinal: string;
    centroOperacao: string;
  } | null>(null);

  const draftKey = `eletromidia_checklist_draft_${user?.id || "guest"}`;

  // Form 1: Início de Turno / Checklist Novo
  const form = useForm<StartChecklistFormValues>({
    resolver: zodResolver(startChecklistSchema),
    defaultValues: {
      centroOperacao: "",
      veiculoId: "",
      kmInicial: 0,
      kmFinal: undefined,
      nivelOleo: "",
      nivelAgua: "",
      nivelCombustivel: "",
      estepe: "",
      triangulo: "",
      chaveRoda: "",
      faroisLanternas: "",
      macaco: "",
      buzina: "",
      documentacao: "",
      cartaoAbastecimento: "",
      fotoFrente: "",
      fotoLadoEsquerdo: "",
      fotoLadoDireito: "",
      fotoTras: "",
      fotoInterna: "",
      fotoCarroceria: "",
    },
  });

  // Form 2: Encerramento de Turno
  const finalizeForm = useForm<FinalizeChecklistFormValues>({
    resolver: zodResolver(finalizeChecklistSchema),
    defaultValues: {
      kmFinal: 0,
      observacoesFim: "",
      fotoFimFrente: "",
      fotoFimLadoEsquerdo: "",
      fotoFimLadoDireito: "",
      fotoFimTras: "",
      fotoFimInterna: "",
      fotoFimCarroceria: "",
    },
  });

  // Observa o Centro de Operação (Filial) selecionado para filtrar a frota
  const selectedCentroOperacao = form.watch("centroOperacao");

  // Filtra apenas os carros da filial selecionada
  const availableVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (!selectedCentroOperacao) return [];
    return vehicles.filter((v) => {
      const vCentro = (v.centroOperacao || "").trim().toLowerCase();
      const targetCentro = selectedCentroOperacao.trim().toLowerCase();
      return vCentro === targetCentro;
    });
  }, [vehicles, selectedCentroOperacao]);

  // Auto-Save: Recupera rascunho do LocalStorage ao montar
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && (parsed.veiculoId || parsed.centroOperacao || (parsed.kmInicial && parsed.kmInicial > 0))) {
          form.reset(parsed);
          setHasDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn("Não foi possível carregar o rascunho local:", e);
    }
  }, [draftKey, form]);

  // Auto-Save: Salva rascunho em tempo real a cada alteração
  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        if (value.veiculoId || value.centroOperacao || (value.kmInicial && value.kmInicial > 0)) {
          localStorage.setItem(draftKey, JSON.stringify(value));
        }
      } catch (e) {
        console.warn("Erro ao salvar rascunho local:", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, draftKey]);

  // Limpar Rascunho Manualmente
  const handleClearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      form.reset({
        centroOperacao: "",
        veiculoId: "",
        kmInicial: 0,
        kmFinal: undefined,
        nivelOleo: "",
        nivelAgua: "",
        nivelCombustivel: "",
        estepe: "",
        triangulo: "",
        chaveRoda: "",
        faroisLanternas: "",
        macaco: "",
        buzina: "",
        documentacao: "",
        cartaoAbastecimento: "",
        fotoFrente: "",
        fotoLadoEsquerdo: "",
        fotoLadoDireito: "",
        fotoTras: "",
        fotoInterna: "",
        fotoCarroceria: "",
      });
      setHasDraftRestored(false);
      toast({
        title: "Rascunho Limpo",
        description: "Os campos foram resetados.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Envio do Formulário 1 (Início de Turno / Novo Checklist)
  async function onStartSubmit(values: StartChecklistFormValues) {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const isFinishingNow = values.kmFinal && values.kmFinal > 0;
      const horaAtual = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await createChecklist({
        clerkId: user?.id,
        userName: user?.fullName || user?.firstName || "Técnico",
        userEmail: user?.primaryEmailAddress?.emailAddress || "",
        veiculoPlaca: values.veiculoId,
        data: now.toISOString().split("T")[0],
        hora: horaAtual,
        centroOperacao: values.centroOperacao,
        kmInicial: values.kmInicial,
        kmFinal: values.kmFinal ? Number(values.kmFinal) : undefined,
        nivelOleo: values.nivelOleo,
        nivelAgua: values.nivelAgua,
        nivelCombustivel: values.nivelCombustivel,
        estepe: values.estepe,
        triangulo: values.triangulo,
        chaveRoda: values.chaveRoda,
        faroisLanternas: values.faroisLanternas,
        macaco: values.macaco,
        buzina: values.buzina,
        documentacao: values.documentacao,
        cartaoAbastecimento: values.cartaoAbastecimento,
        
        fotoFrente: values.fotoFrente ? (values.fotoFrente as Id<"_storage">) : undefined,
        fotoLadoEsquerdo: values.fotoLadoEsquerdo ? (values.fotoLadoEsquerdo as Id<"_storage">) : undefined,
        fotoLadoDireito: values.fotoLadoDireito ? (values.fotoLadoDireito as Id<"_storage">) : undefined,
        fotoTras: values.fotoTras ? (values.fotoTras as Id<"_storage">) : undefined,
        fotoInterna: values.fotoInterna ? (values.fotoInterna as Id<"_storage">) : undefined,
        fotoCarroceria: values.fotoCarroceria ? (values.fotoCarroceria as Id<"_storage">) : undefined,
      });

      // Limpa rascunho após salvar com sucesso
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {
        console.error(e);
      }
      setHasDraftRestored(false);
      setForceNewChecklist(false);

      if (isFinishingNow) {
        setCompletedSummary({
          placa: values.veiculoId,
          modelo: "Veículo Frota",
          kmInicial: values.kmInicial,
          kmFinal: Number(values.kmFinal),
          kmRodados: Number(values.kmFinal) - values.kmInicial,
          horaSaida: horaAtual,
          horaFinal: horaAtual,
          centroOperacao: values.centroOperacao,
        });

        form.reset({
          centroOperacao: "",
          veiculoId: "",
          kmInicial: 0,
          kmFinal: undefined,
          nivelOleo: "",
          nivelAgua: "",
          nivelCombustivel: "",
          estepe: "",
          triangulo: "",
          chaveRoda: "",
          faroisLanternas: "",
          macaco: "",
          buzina: "",
          documentacao: "",
          cartaoAbastecimento: "",
          fotoFrente: "",
          fotoLadoEsquerdo: "",
          fotoLadoDireito: "",
          fotoTras: "",
          fotoInterna: "",
          fotoCarroceria: "",
        });

        toast({
          title: "Checklist Completo Salvo!",
          description: "O checklist foi finalizado e sincronizado com sucesso.",
        });
      } else {
        toast({
          title: "Saída Registrada com Sucesso! 🚗💨",
          description: "Turno iniciado! Ao retornar das atividades, você registrará o KM Final e as fotos.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Envio do Formulário 2 (Encerramento de Turno / Retorno)
  async function onFinalizeSubmit(values: FinalizeChecklistFormValues) {
    if (!activeChecklist) return;

    if (values.kmFinal < activeChecklist.kmInicial) {
      toast({
        title: "KM Final Inválido",
        description: `O KM final (${values.kmFinal} km) não pode ser menor que o KM inicial (${activeChecklist.kmInicial} km).`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const horaFinal = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await finalizeChecklist({
        id: activeChecklist._id,
        kmFinal: Number(values.kmFinal),
        horaFinal: horaFinal,
        fotoFimFrente: values.fotoFimFrente ? (values.fotoFimFrente as Id<"_storage">) : undefined,
        fotoFimLadoEsquerdo: values.fotoFimLadoEsquerdo ? (values.fotoFimLadoEsquerdo as Id<"_storage">) : undefined,
        fotoFimLadoDireito: values.fotoFimLadoDireito ? (values.fotoFimLadoDireito as Id<"_storage">) : undefined,
        fotoFimTras: values.fotoFimTras ? (values.fotoFimTras as Id<"_storage">) : undefined,
        fotoFimInterna: values.fotoFimInterna ? (values.fotoFimInterna as Id<"_storage">) : undefined,
        fotoFimCarroceria: values.fotoFimCarroceria ? (values.fotoFimCarroceria as Id<"_storage">) : undefined,
        observacoesFim: values.observacoesFim || undefined,
      });

      // Limpa qualquer rascunho local
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {
        console.error(e);
      }

      // Define o resumo de conclusão para exibir a tela de sucesso
      setCompletedSummary({
        placa: activeChecklist.veiculoPlaca,
        modelo: activeChecklist.veiculoModelo,
        kmInicial: activeChecklist.kmInicial,
        kmFinal: Number(values.kmFinal),
        kmRodados: Number(values.kmFinal) - activeChecklist.kmInicial,
        horaSaida: activeChecklist.hora,
        horaFinal: horaFinal,
        centroOperacao: activeChecklist.centroOperacao,
      });

      // Reseta todos os formulários para limpar valores anteriores
      form.reset({
        centroOperacao: "",
        veiculoId: "",
        kmInicial: 0,
        kmFinal: undefined,
        nivelOleo: "",
        nivelAgua: "",
        nivelCombustivel: "",
        estepe: "",
        triangulo: "",
        chaveRoda: "",
        faroisLanternas: "",
        macaco: "",
        buzina: "",
        documentacao: "",
        cartaoAbastecimento: "",
        fotoFrente: "",
        fotoLadoEsquerdo: "",
        fotoLadoDireito: "",
        fotoTras: "",
        fotoInterna: "",
        fotoCarroceria: "",
      });

      finalizeForm.reset({
        kmFinal: 0,
        observacoesFim: "",
        fotoFimFrente: "",
        fotoFimLadoEsquerdo: "",
        fotoFimLadoDireito: "",
        fotoFimTras: "",
        fotoFimInterna: "",
        fotoFimCarroceria: "",
      });

      setForceNewChecklist(false);

      toast({
        title: "Turno Finalizado com Sucesso! 🎉",
        description: `Checklist do veículo ${activeChecklist.veiculoPlaca} concluído com ${Number(values.kmFinal) - activeChecklist.kmInicial} km rodados.`,
      });
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Erro ao finalizar checklist.";
      toast({
        title: "Erro ao finalizar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Visualização de Checklist Ativo / Em Andamento
  const hasActiveChecklist = !!activeChecklist && !forceNewChecklist;

  const currentFinalKm = finalizeForm.watch("kmFinal");
  const calculatedKmDiff =
    activeChecklist && currentFinalKm && currentFinalKm >= activeChecklist.kmInicial
      ? currentFinalKm - activeChecklist.kmInicial
      : null;

  return (
    <div className="container mx-auto p-4 max-w-3xl pb-28">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Banner do Técnico Conectado */}
        <div className="bg-card border border-primary/30 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Técnico Responsável
                </span>
              </div>
              <p className="text-base font-bold text-foreground leading-tight">
                {user?.fullName || user?.firstName || "Técnico"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress || "e-mail corporativo"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            Não é você? Trocar de conta
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* CENÁRIO 0: TELA DE SUCESSO / TURNO FINALIZADO COM RECIBO                  */}
        {/* ========================================================================= */}
        {completedSummary ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-green-500 shadow-xl overflow-hidden bg-card">
              <div className="bg-green-600 px-4 sm:px-6 py-4 text-white font-bold flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2Icon className="w-6 h-6 text-white" />
                  <span className="text-lg sm:text-xl">Turno Finalizado com Sucesso!</span>
                </div>
                <Badge className="bg-white text-green-700 font-mono font-bold text-sm px-2.5 py-0.5">
                  {completedSummary.placa}
                </Badge>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    Checklist Diário Concluído
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O encerramento do veículo <strong className="text-foreground">{completedSummary.placa}</strong> foi sincronizado e todas as fotos foram arquivadas.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Veículo</span>
                    <p className="text-sm font-bold font-mono text-foreground">{completedSummary.placa}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{completedSummary.modelo}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Região / Centro</span>
                    <p className="text-sm font-bold text-foreground">{completedSummary.centroOperacao}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Quilometragem</span>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {completedSummary.kmInicial.toLocaleString()} ➔ {completedSummary.kmFinal.toLocaleString()} km
                    </p>
                    <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0 font-mono mt-0.5 font-bold">
                      +{completedSummary.kmRodados.toLocaleString()} km rodados
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Horários</span>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5 text-primary" />
                      {completedSummary.horaSaida} ➔ {completedSummary.horaFinal}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {isLeader && (
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full bg-primary text-black font-bold h-12 text-sm sm:text-base hover:bg-primary/90">
                        Ir para o Dashboard (Painel do Líder)
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant={isLeader ? "outline" : "default"}
                    onClick={() => setCompletedSummary(null)}
                    className={`flex-1 h-12 font-semibold text-sm sm:text-base ${
                      !isLeader ? "bg-primary text-black font-bold hover:bg-primary/90" : ""
                    }`}
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                    Iniciar Outro Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : hasActiveChecklist ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="active-checklist-mode"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4"
            >
              {/* Card de Alerta e Resumo da Saída */}
              <Card className="border-2 border-primary shadow-lg overflow-hidden bg-card">
                <div className="bg-primary px-4 py-3 text-black font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CarIcon className="w-5 h-5 animate-pulse" />
                    <span>Checklist em Andamento (Em Rota)</span>
                  </div>
                  <Badge className="bg-black text-primary font-mono text-xs px-2 py-0.5">
                    {activeChecklist.veiculoPlaca}
                  </Badge>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-xl border">
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">Veículo</span>
                      <p className="text-sm font-bold font-mono text-foreground">{activeChecklist.veiculoPlaca}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{activeChecklist.veiculoModelo}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">Região / Centro</span>
                      <p className="text-sm font-bold text-foreground">{activeChecklist.centroOperacao}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">KM Inicial (Saída)</span>
                      <p className="text-sm font-bold font-mono text-foreground">{activeChecklist.kmInicial.toLocaleString()} km</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">Horário de Saída</span>
                      <p className="text-sm font-bold text-foreground flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-primary" />
                        {activeChecklist.hora} ({activeChecklist.data})
                      </p>
                    </div>
                  </div>

                  {/* Toggle para ver dados e fotos registradas na saída */}
                  <div className="border rounded-xl p-3 bg-muted/20">
                    <button
                      type="button"
                      onClick={() => setShowDepartureDetails(!showDepartureDetails)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <CameraIcon className="w-4 h-4 text-primary" />
                        Ver fotos e itens verificados no início do turno
                      </span>
                      {showDepartureDetails ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>

                    {showDepartureDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-3 space-y-3"
                      >
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                          {[
                            { label: "Frente", url: activeChecklist.photoUrls?.frente },
                            { label: "Esquerda", url: activeChecklist.photoUrls?.ladoEsquerdo },
                            { label: "Direita", url: activeChecklist.photoUrls?.ladoDireito },
                            { label: "Traseira", url: activeChecklist.photoUrls?.tras },
                            { label: "Interna", url: activeChecklist.photoUrls?.interna },
                            { label: "Carroceria", url: activeChecklist.photoUrls?.carroceria },
                          ].map((f) => (
                            <div key={f.label} className="border rounded-lg p-1 bg-card text-center">
                              <span className="text-[10px] text-muted-foreground block truncate">{f.label}</span>
                              {f.url ? (
                                <div className="relative h-14 w-full mt-1 rounded overflow-hidden">
                                  <Image src={f.url} alt={f.label} fill className="object-cover" />
                                </div>
                              ) : (
                                <span className="text-[10px] italic text-muted-foreground/60 block py-4">Sem foto</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* FORMULÁRIO DE ENCERRAMENTO DO TURNO */}
                  <div className="pt-2">
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          2
                        </div>
                        <div>
                          <h3 className="text-lg font-bold leading-tight">Encerramento das Atividades</h3>
                          <p className="text-xs text-muted-foreground">
                            Informe o KM Final e anexe as fotos de como o carro ficou após o trabalho.
                          </p>
                        </div>
                      </div>

                      <Form {...finalizeForm}>
                        <form onSubmit={finalizeForm.handleSubmit(onFinalizeSubmit)} className="space-y-6">
                          {/* Campo KM Final */}
                          <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
                            <FormField
                              control={finalizeForm.control}
                              name="kmFinal"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex items-center justify-between">
                                    <FormLabel className="text-base font-bold flex items-center gap-1.5">
                                      <RouteIcon className="w-4 h-4 text-primary" />
                                      KM Final (Hodômetro no Retorno) *
                                    </FormLabel>
                                    {calculatedKmDiff !== null && (
                                      <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 font-mono font-bold text-xs border border-green-600/30">
                                        +{calculatedKmDiff.toLocaleString()} km rodados hoje
                                      </Badge>
                                    )}
                                  </div>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={`Mínimo: ${activeChecklist.kmInicial}`}
                                      className="text-lg font-mono font-bold h-12"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <p className="text-xs text-muted-foreground">
                              KM Inicial na saída: <strong className="font-mono">{activeChecklist.kmInicial.toLocaleString()} km</strong>
                            </p>
                          </div>

                          {/* Fotos de Retorno / Pós-Atividades */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                                  <CameraIcon className="w-4 h-4" />
                                  Fotos do Veículo Pós-Atividades
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Tire fotos do carro ao término das atividades para registrar as condições de entrega.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {returnPhotoItems.map((item) => (
                                <FormField
                                  key={item.id}
                                  control={finalizeForm.control}
                                  name={item.id}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <PhotoUpload
                                          label={item.label}
                                          value={field.value}
                                          onUploadSuccess={(storageId) => field.onChange(storageId)}
                                          onRemove={() => field.onChange("")}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Observações de Encerramento */}
                          <FormField
                            control={finalizeForm.control}
                            name="observacoesFim"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-semibold">
                                  Observações / Ocorrências do Dia (Opcional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Carro entregue abastecido, sem novas avarias..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Botão de Finalizar */}
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-md flex items-center justify-center gap-2"
                          >
                            <CheckCircle2Icon className="w-5 h-5" />
                            {isSubmitting ? "Finalizando Turno..." : "Finalizar Checklist e Concluir Turno"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>

                  {/* Opção para alternar para novo checklist se necessário */}
                  <div className="text-center pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setForceNewChecklist(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold"
                    >
                      <PlusCircleIcon className="w-3.5 h-3.5" />
                      Precisa iniciar um checklist para outro veículo? Clique aqui
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* ========================================================================= */
          /* CENÁRIO 2: NOVO CHECKLIST / INÍCIO DE TURNO (OU FORMULÁRIO COMPLETO)       */
          /* ========================================================================= */
          <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <span>Novo Checklist Diário</span>
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados no início do dia. O KM final e fotos de retorno podem ser preenchidos ao terminar as atividades.
                  </CardDescription>
                </div>

                {hasDraftRestored && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-2.5 py-1.5 rounded-lg text-xs">
                    <SparklesIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">Rascunho recuperado</span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-destructive hover:underline font-bold ml-1"
                      title="Limpar rascunho salvo"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              {activeChecklist && forceNewChecklist && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangleIcon className="w-4 h-4" />
                    Você possui um checklist aberto para {activeChecklist.veiculoPlaca}.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForceNewChecklist(false)}
                    className="h-7 text-xs font-semibold"
                  >
                    Voltar para ele
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onStartSubmit)} className="space-y-8">
                  
                  {/* 1. DADOS DA OPERAÇÃO */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2 text-primary flex items-center gap-2">
                      <span>1. Dados da Operação (Saída)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="centroOperacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de Operação (Filial)</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                const chosen = val || "";
                                field.onChange(chosen);
                                // Se o veículo atual não pertencer à nova filial selecionada, limpa a seleção
                                const currentVeiculoId = form.getValues("veiculoId");
                                if (currentVeiculoId && vehicles) {
                                  const currentVeh = vehicles.find(
                                    (v) => v.placa.toUpperCase() === currentVeiculoId.toUpperCase()
                                  );
                                  if (currentVeh && currentVeh.centroOperacao && currentVeh.centroOperacao.toLowerCase() !== chosen.toLowerCase()) {
                                    form.setValue("veiculoId", "");
                                  }
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a região/filial" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Sul">Sul</SelectItem>
                                <SelectItem value="Leste">Leste</SelectItem>
                                <SelectItem value="Matriz">Matriz</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="veiculoId"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <div className="flex items-center justify-between gap-2">
                              <FormLabel className="truncate">Veículo (Placa)</FormLabel>
                              {selectedCentroOperacao && (
                                <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                  Filial {selectedCentroOperacao}: {availableVehicles.length} carro(s)
                                </span>
                              )}
                            </div>
                            <FormControl>
                              <VehicleCombobox
                                value={field.value}
                                onChange={field.onChange}
                                vehicles={availableVehicles}
                                placeholder={
                                  !selectedCentroOperacao
                                    ? "Selecione o Centro de Operação primeiro..."
                                    : `Selecione ou busque o veículo da Filial ${selectedCentroOperacao}...`
                                }
                                disabled={!selectedCentroOperacao}
                                filialName={selectedCentroOperacao}
                                error={!!fieldState.error}
                              />
                            </FormControl>
                            {!selectedCentroOperacao ? (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Selecione o Centro de Operação primeiro para listar a frota desta filial.
                              </p>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kmInicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KM Inicial (Saída) *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="000000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kmFinal"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between gap-2">
                              <FormLabel className="truncate">KM Final (Opcional no início)</FormLabel>
                              <span className="text-[11px] text-muted-foreground italic shrink-0">Pode preencher ao final</span>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Deixe em branco se for preencher ao retornar"
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : undefined;
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* 2. NÍVEIS */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2 text-primary">2. Níveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="nivelOleo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Óleo do Motor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Bom">Bom</SelectItem>
                                <SelectItem value="Ruim">Ruim</SelectItem>
                                <SelectItem value="Completar">Completar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nivelAgua"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Água do Motor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Bom">Bom</SelectItem>
                                <SelectItem value="Ruim">Ruim</SelectItem>
                                <SelectItem value="Completar">Completar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nivelCombustivel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Combustível</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cheio">Cheio</SelectItem>
                                <SelectItem value="3/4">3/4</SelectItem>
                                <SelectItem value="1/2">1/2</SelectItem>
                                <SelectItem value="1/4">1/4</SelectItem>
                                <SelectItem value="Reserva">Reserva</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* 3. ACESSÓRIOS E CONDIÇÕES */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2 text-primary">3. Acessórios e Documentação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {checklistItems.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={item.id}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{item.label}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {item.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 4. FOTOS DE SAÍDA */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2 text-primary">4. Registro Fotográfico (Saída)</h3>
                    <p className="text-sm text-muted-foreground">Tire fotos reais do veículo antes de iniciar a operação.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {departurePhotoItems.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={item.id}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <PhotoUpload 
                                  label={item.label}
                                  value={field.value}
                                  onUploadSuccess={(storageId) => field.onChange(storageId)}
                                  onRemove={() => field.onChange("")}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* BOTÕES DE AÇÃO */}
                  <div className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 text-base font-bold bg-primary text-black hover:bg-primary/90 shadow-md flex items-center justify-center gap-2"
                    >
                      <SaveIcon className="w-5 h-5" />
                      {isSubmitting
                        ? "Salvando..."
                        : form.watch("kmFinal")
                        ? "Finalizar e Enviar Checklist Completo"
                        : "Salvar Saída (Iniciar Turno / Atividades)"}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>💾 Salvamento automático ativo no aparelho</span>
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="hover:text-destructive flex items-center gap-1"
                      >
                        <RotateCcwIcon className="w-3 h-3" /> Limpar formulário
                      </button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

