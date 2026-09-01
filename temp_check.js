"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CarIcon,
  UsersIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  EyeIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  WrenchIcon,
  CheckCircle2Icon,
  XCircleIcon,
  FuelIcon,
  GaugeIcon,
  DropletsIcon,
  ImageIcon,
  CameraIcon,
  ExternalLinkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  RouteIcon,
  FileSpreadsheetIcon,
  Trash2Icon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  LockIcon,
  ArrowLeftIcon,
  SmartphoneIcon,
  PrinterIcon,
  RotateCcwIcon,
  PencilIcon,
  HistoryIcon,
  FileTextIcon,
  CheckIcon,
  ListFilterIcon,
  DollarSignIcon,
  InfoIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportConsolidatedExcel } from "@/lib/exportExcel";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const isLeader = currentUser?.role === "LIDER";

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedChecklistId, setSelectedChecklistId] = useState<Id<"checklists"> | null>(null);

  // Queries do Convex (somente carregadas se o usuário for Líder)
  const stats = useQuery(api.checklists.getStats, isLeader ? {} : "skip");
  const checklists = useQuery(
    api.checklists.listAll,
    isLeader ? { dataFilter: selectedDate || undefined } : "skip"
  );
  const allChecklists = useQuery(api.checklists.listAll, isLeader ? {} : "skip");
  const checklistDetail = useQuery(
    api.checklists.getDetails,
    isLeader && selectedChecklistId ? { id: selectedChecklistId } : "skip"
  );
  const vehicles = useQuery(api.vehicles.list, isLeader ? {} : "skip");
  const maintenances = useQuery(api.maintenances.list, isLeader ? {} : "skip");
  const opecs = useQuery(api.opecs.list, isLeader ? {} : "skip");
  const usersList = useQuery(api.users.list, isLeader ? {} : "skip");

  // Mutações de Veículos e Usuários
  const createVehicle = useMutation(api.vehicles.create);
  const updateVehicle = useMutation(api.vehicles.updateVehicle);
  const updateVehicleStatus = useMutation(api.vehicles.updateStatus);
  const updateCentroOperacao = useMutation(api.vehicles.updateCentroOperacao);
  const assignBatchCentroOperacao = useMutation(api.vehicles.assignBatchCentroOperacao);
  const updateManutencao = useMutation(api.vehicles.updateManutencao);
  const resetKm = useMutation(api.vehicles.resetKm);
  const updateRole = useMutation(api.users.updateRole);
  const removeUser = useMutation(api.users.remove);
  const removeChecklist = useMutation(api.checklists.remove);
  const removeVehicle = useMutation(api.vehicles.remove);
  const removeAllVehicles = useMutation(api.vehicles.removeAll);

  // Mutações de Manutenção
  const colocarEmManutencao = useMutation(api.maintenances.colocarEmManutencao);
  const reativarVeiculoMutation = useMutation(api.maintenances.reativarVeiculo);
  const removeMaintenance = useMutation(api.maintenances.remove);

  // Mutações de OPEC
  const createOpec = useMutation(api.opecs.create);
  const updateOpec = useMutation(api.opecs.updateOpec);
  const updateOpecStatus = useMutation(api.opecs.updateStatus);
  const removeOpec = useMutation(api.opecs.remove);
  const removeAllOpecs = useMutation(api.opecs.removeAll);
  const initializeDefaultOpecs = useMutation(api.opecs.initializeDefaultOpecs);

  // Form states para Veículo
  const [newPlaca, setNewPlaca] = useState("");
  const [newModelo, setNewModelo] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCentroOperacao, setNewCentroOperacao] = useState<string>("Matriz");
  const [filialFilter, setFilialFilter] = useState<string>("TODAS");
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
  const [selectedMaintenanceVehicle, setSelectedMaintenanceVehicle] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editPlaca, setEditPlaca] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editFilial, setEditFilial] = useState<string>("Matriz");
  const [editStatus, setEditStatus] = useState<"ATIVO" | "MANUTENCAO">("ATIVO");
  const [editKmAtual, setEditKmAtual] = useState("");
  const [editProximaManutencao, setEditProximaManutencao] = useState("");
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [newProximaManutencao, setNewProximaManutencao] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenEditVehicle = (v: any) => {
    setEditingVehicle(v);
    setEditPlaca(v.placa || "");
    setEditModelo(v.modelo || "");
    setEditTag(v.tag || "");
    setEditFilial(v.centroOperacao || "Matriz");
    setEditStatus(v.status || "ATIVO");
    setEditKmAtual(v.kmAtual !== undefined && v.kmAtual !== null ? v.kmAtual.toString() : "");
    setEditProximaManutencao(v.proximaManutencaoKm ? v.proximaManutencaoKm.toString() : "");
  };

  const handleSaveEditVehicle = async () => {
    if (!editingVehicle) return;
    if (!editPlaca.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A placa do veículo não pode ficar em branco.",
        variant: "destructive",
      });
      return;
    }
    if (!editModelo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O modelo/nome do veículo não pode ficar em branco.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingVehicle(true);
    try {
      const kmAtualNum = editKmAtual.trim() !== "" ? parseInt(editKmAtual.trim(), 10) : undefined;
      const proxKmNum = editProximaManutencao.trim() !== "" ? parseInt(editProximaManutencao.trim(), 10) : undefined;

      await updateVehicle({
        id: editingVehicle._id,
        placa: editPlaca.trim().toUpperCase(),
        modelo: editModelo.trim(),
        tag: editTag.trim() || undefined,
        centroOperacao: editFilial,
        status: editStatus,
        kmAtual: isNaN(kmAtualNum as number) ? undefined : kmAtualNum,
        proximaManutencaoKm: isNaN(proxKmNum as number) ? undefined : proxKmNum,
      });

      toast({
        title: "Veículo Atualizado!",
        description: `Dados do veículo ${editPlaca.trim().toUpperCase()} salvos com sucesso.`,
      });
      setEditingVehicle(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar os dados do veículo.";
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  // States para Reativação de Veículo (Obrigatório descrever o que foi feito)
  const [vehicleToReactivate, setVehicleToReactivate] = useState<any>(null);
  const [reactivateDescricao, setReactivateDescricao] = useState("");
  const [reactivateTipo, setReactivateTipo] = useState<string>("PREVENTIVA");
  const [reactivateKm, setReactivateKm] = useState("");
  const [reactivateProximaManutencao, setReactivateProximaManutencao] = useState("");
  const [reactivateOficina, setReactivateOficina] = useState("");
  const [reactivateCusto, setReactivateCusto] = useState("");
  const [reactivateData, setReactivateData] = useState(todayStr);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleOpenReactivate = (v: any) => {
    setVehicleToReactivate(v);
    setReactivateDescricao("");
    setReactivateTipo("PREVENTIVA");
    setReactivateKm(v.kmAtual !== undefined && v.kmAtual !== null ? v.kmAtual.toString() : "");
    const baseKm = v.kmAtual || 0;
    const modeloUpper = (v.modelo || "").toUpperCase();
    if (modeloUpper.includes("MASTER") || modeloUpper.includes("DUCATO")) {
      setReactivateProximaManutencao((baseKm + 20000).toString());
    } else {
      setReactivateProximaManutencao((baseKm + 10000).toString());
    }
    setReactivateOficina("");
    setReactivateCusto("");
    setReactivateData(todayStr);
  };

  const handleConfirmReactivate = async () => {
    if (!vehicleToReactivate) return;
    const descTrimmed = reactivateDescricao.trim();
    if (!descTrimmed) {
      toast({
        title: "Descrição Obrigatória",
        description: "Por favor, descreva o que foi feito no carro para registrá-lo no histórico e reativá-lo.",
        variant: "destructive",
      });
      return;
    }

    setIsReactivating(true);
    try {
      const kmNum = reactivateKm ? parseInt(reactivateKm) : undefined;
      const proxKmNum = reactivateProximaManutencao ? parseInt(reactivateProximaManutencao) : undefined;
      const custoNum = reactivateCusto ? parseFloat(reactivateCusto.replace(",", ".")) : undefined;

      await reativarVeiculoMutation({
        vehicleId: vehicleToReactivate._id,
        descricaoServico: descTrimmed,
        tipoManutencao: reactivateTipo,
        kmManutencao: kmNum,
        proximaManutencaoKm: proxKmNum,
        oficina: reactivateOficina.trim() || undefined,
        custo: custoNum,
        dataReativacao: reactivateData || todayStr,
        realizadoPorNome: currentUser?.name || user?.fullName || "Líder",
        realizadoPorEmail: currentUser?.email || user?.primaryEmailAddress?.emailAddress || undefined,
        userId: currentUser?._id,
      });

      toast({
        title: "Veículo Reativado com Sucesso!",
        description: `O veículo ${vehicleToReactivate.placa} voltou ao status Ativo e o histórico de manutenção foi registrado.`,
      });
      setVehicleToReactivate(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao reativar o veículo.";
      toast({
        title: "Erro ao reativar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  // States para Colocar Veículo em Manutenção
  const [vehicleToEnterMaintenance, setVehicleToEnterMaintenance] = useState<any>(null);
  const [enterMaintenanceMotivo, setEnterMaintenanceMotivo] = useState("");
  const [enterMaintenanceData, setEnterMaintenanceData] = useState(todayStr);
  const [isEnteringMaintenance, setIsEnteringMaintenance] = useState(false);

  const handleOpenEnterMaintenance = (v: any) => {
    setVehicleToEnterMaintenance(v);
    setEnterMaintenanceMotivo("");
    setEnterMaintenanceData(todayStr);
  };

  const handleConfirmEnterMaintenance = async () => {
    if (!vehicleToEnterMaintenance) return;
    setIsEnteringMaintenance(true);
    try {
      await colocarEmManutencao({
        vehicleId: vehicleToEnterMaintenance._id,
        motivo: enterMaintenanceMotivo.trim() || undefined,
        dataEntrada: enterMaintenanceData || todayStr,
      });

      toast({
        title: "Veículo em Manutenção",
        description: `O veículo ${vehicleToEnterMaintenance.placa} foi marcado como Em Manutenção.`,
      });
      setVehicleToEnterMaintenance(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao colocar veículo em manutenção.";
      toast({
        title: "Erro ao atualizar status",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsEnteringMaintenance(false);
    }
  };

  // States para Visualizar Histórico do Veículo e Gestão de Manutenções
  const [vehicleToViewHistory, setVehicleToViewHistory] = useState<any>(null);
  const [maintenanceFilialFilter, setMaintenanceFilialFilter] = useState<string>("TODAS");
  const [maintenanceSearch, setMaintenanceSearch] = useState<string>("");
  const [maintenanceTipoFilter, setMaintenanceTipoFilter] = useState<string>("TODOS");
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<any>(null);
  const [isDeletingMaintenance, setIsDeletingMaintenance] = useState(false);

  const handleDeleteMaintenance = async () => {
    if (!maintenanceToDelete) return;
    setIsDeletingMaintenance(true);
    try {
      await removeMaintenance({ id: maintenanceToDelete._id });
      toast({
        title: "Registro de Manutenção Excluído",
        description: `O registro do veículo ${maintenanceToDelete.placa} foi removido com sucesso.`,
      });
      setMaintenanceToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir registro de manutenção.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingMaintenance(false);
    }
  };

  // States para Zerar KM de Veículo
  const [vehicleToResetKm, setVehicleToResetKm] = useState<any>(null);
  const [isResettingKm, setIsResettingKm] = useState(false);

  const handleResetKm = async () => {
    if (!vehicleToResetKm) return;
    setIsResettingKm(true);
    try {
      await resetKm({ id: vehicleToResetKm._id });
      toast({
        title: "Quilometragem Zerada!",
        description: `O KM do veículo ${vehicleToResetKm.placa} foi redefinido para 0 km.`,
      });
      setVehicleToResetKm(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao zerar a quilometragem.";
      toast({
        title: "Erro ao zerar KM",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsResettingKm(false);
    }
  };

  // Form states para OPEC
  const [newOpecCodigo, setNewOpecCodigo] = useState("");
  const [newOpecDescricao, setNewOpecDescricao] = useState("");
  const [newOpecCentroOperacao, setNewOpecCentroOperacao] = useState<string>("Matriz");
  const [opecFilialFilter, setOpecFilialFilter] = useState<string>("TODAS");
  const [isCreatingOpec, setIsCreatingOpec] = useState(false);
  const [editingOpec, setEditingOpec] = useState<any>(null);
  const [editOpecCodigo, setEditOpecCodigo] = useState("");
  const [editOpecDescricao, setEditOpecDescricao] = useState("");
  const [editOpecFilialValue, setEditOpecFilialValue] = useState<string>("Matriz");
  const [isUpdatingOpec, setIsUpdatingOpec] = useState(false);
  const [opecToDelete, setOpecToDelete] = useState<any>(null);
  const [isDeletingOpec, setIsDeletingOpec] = useState(false);
  const [isDeletingAllOpecsOpen, setIsDeletingAllOpecsOpen] = useState(false);
  const [isDeletingAllOpecs, setIsDeletingAllOpecs] = useState(false);
  const [isInitializingOpecs, setIsInitializingOpecs] = useState(false);

  // States para Exclusão de Veículos
  const [vehicleToDelete, setVehicleToDelete] = useState<any>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [isDeletingAllVehiclesOpen, setIsDeletingAllVehiclesOpen] = useState(false);
  const [isDeletingAllVehicles, setIsDeletingAllVehicles] = useState(false);

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setIsDeletingVehicle(true);
    try {
      await removeVehicle({ id: vehicleToDelete._id });
      toast({
        title: "Veículo Excluído",
        description: `O veículo ${vehicleToDelete.placa} foi removido com sucesso.`,
      });
      setVehicleToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir o veículo.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const handleDeleteAllVehicles = async () => {
    setIsDeletingAllVehicles(true);
    try {
      const count = await removeAllVehicles();
      toast({
        title: "Todos os Veículos Excluídos",
        description: `${count} veículo(s) foram removidos da frota com sucesso.`,
      });
      setIsDeletingAllVehiclesOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir todos os veículos.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAllVehicles(false);
    }
  };

  // Handlers para OPECs
  const handleCreateOpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpecCodigo.trim()) return;

    setIsCreatingOpec(true);
    try {
      await createOpec({
        codigo: newOpecCodigo.trim(),
        descricao: newOpecDescricao.trim() || undefined,
        centroOperacao: newOpecCentroOperacao,
        status: "ATIVO",
      });
      setNewOpecCodigo("");
      setNewOpecDescricao("");
      toast({
        title: "OPEC Cadastrado!",
        description: `Aparelho inserido com sucesso na Filial ${newOpecCentroOperacao}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível cadastrar o OPEC.";
      toast({
        title: "Erro ao cadastrar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingOpec(false);
    }
  };

  const handleUpdateOpec = async () => {
    if (!editingOpec) return;
    setIsUpdatingOpec(true);
    try {
      await updateOpec({
        id: editingOpec._id,
        codigo: editOpecCodigo.trim() || editingOpec.codigo,
        descricao: editOpecDescricao.trim() || undefined,
        centroOperacao: editOpecFilialValue,
      });
      toast({
        title: "OPEC Atualizado!",
        description: `Dados do aparelho ${editOpecCodigo || editingOpec.codigo} salvos com sucesso.`,
      });
      setEditingOpec(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do OPEC.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOpec(false);
    }
  };

  const handleDeleteOpec = async () => {
    if (!opecToDelete) return;
    setIsDeletingOpec(true);
    try {
      await removeOpec({ id: opecToDelete._id });
      toast({
        title: "OPEC Excluído",
        description: `O aparelho ${opecToDelete.codigo} foi removido com sucesso.`,
      });
      setOpecToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir o OPEC.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingOpec(false);
    }
  };

  const handleDeleteAllOpecs = async () => {
    setIsDeletingAllOpecs(true);
    try {
      const count = await removeAllOpecs();
      toast({
        title: "Todos os OPECs Excluídos",
        description: `${count} aparelho(s) foram removidos com sucesso.`,
      });
      setIsDeletingAllOpecsOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir todos os OPECs.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAllOpecs(false);
    }
  };

  const handleInitializeDefaultOpecs = async () => {
    setIsInitializingOpecs(true);
    try {
      const res = await initializeDefaultOpecs();
      toast({
        title: "OPECs Inicializados!",
        description: `${res.inserted} novo(s) OPEC(s) inseridos e ${res.updated} atualizados para a Matriz.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao inicializar OPECs padrão.";
      toast({
        title: "Erro ao inicializar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsInitializingOpecs(false);
    }
  };

  // States para Exclusão de Checklist
  const [checklistToDelete, setChecklistToDelete] = useState<any>(null);
  const [isDeletingChecklist, setIsDeletingChecklist] = useState(false);

  const handleDeleteChecklist = async () => {
    if (!checklistToDelete) return;
    setIsDeletingChecklist(true);
    try {
      await removeChecklist({ id: checklistToDelete._id });
      toast({
        title: "Checklist Excluído",
        description: `O checklist do veículo ${checklistToDelete.veiculoPlaca} foi removido com sucesso.`,
      });
      if (selectedChecklistId === checklistToDelete._id) {
        setSelectedChecklistId(null);
      }
      setChecklistToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir o checklist.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingChecklist(false);
    }
  };

  // Função para imprimir checklist completo
  const handlePrintChecklist = () => {
    if (!checklistDetail) return;

    const items = [
      { label: "Estepe", val: checklistDetail.estepe },
      { label: "Triângulo", val: checklistDetail.triangulo },
      { label: "Chave de Roda", val: checklistDetail.chaveRoda },
      { label: "Faróis/Lanternas", val: checklistDetail.faroisLanternas },
      { label: "Macaco", val: checklistDetail.macaco },
      { label: "Buzina", val: checklistDetail.buzina },
      { label: "Documentação", val: checklistDetail.documentacao },
      { label: "Cartão Abastecimento", val: checklistDetail.cartaoAbastecimento },
    ];

    const formatItemVal = (val: unknown) => {
      if (typeof val === "boolean") return val ? "Sim" : "Não";
      return (val as string) || "Não informado";
    };

    const isPositive = (val: unknown) =>
      val === true || val === "Sim" || val === "Bom";

    const kmRodados =
      checklistDetail.kmFinal !== undefined &&
        checklistDetail.kmFinal !== null &&
        checklistDetail.kmFinal >= checklistDetail.kmInicial
        ? `+${(checklistDetail.kmFinal - checklistDetail.kmInicial).toLocaleString()} km`
        : "Em rota";

    const fotosSaida = [
      { label: "Frente (Saída)", url: checklistDetail.photoUrls?.frente },
      { label: "Lado Esquerdo (Saída)", url: checklistDetail.photoUrls?.ladoEsquerdo },
      { label: "Lado Direito (Saída)", url: checklistDetail.photoUrls?.ladoDireito },
      { label: "Traseira (Saída)", url: checklistDetail.photoUrls?.tras },
      { label: "Foto Painel (Saída)", url: checklistDetail.photoUrls?.interna },
      { label: "Carroceria (Saída)", url: checklistDetail.photoUrls?.carroceria },
    ];

    const fotosRetorno = [
      { label: "Frente (Retorno)", url: checklistDetail.photoFimUrls?.frente },
      { label: "Lado Esquerdo (Retorno)", url: checklistDetail.photoFimUrls?.ladoEsquerdo },
      { label: "Lado Direito (Retorno)", url: checklistDetail.photoFimUrls?.ladoDireito },
      { label: "Traseira (Retorno)", url: checklistDetail.photoFimUrls?.tras },
      { label: "Foto Painel (Retorno)", url: checklistDetail.photoFimUrls?.interna },
      { label: "Carroceria (Retorno)", url: checklistDetail.photoFimUrls?.carroceria },
    ];

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Checklist - ${checklistDetail.veiculoPlaca} - ${checklistDetail.data}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            padding: 20px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-left h1 {
            font-size: 20px;
            font-weight: 800;
            color: #111;
          }
          .header-left .subtitle {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
          .header-right {
            text-align: right;
            font-size: 11px;
            color: #555;
          }
          .header-right .placa {
            font-size: 18px;
            font-weight: 800;
            color: #111;
            background: #f59e0b;
            padding: 4px 12px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 4px;
            font-family: monospace;
          }
          .info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
            padding: 10px;
            background: #f8f8f8;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
          }
          .info-item {
            flex: 1;
            min-width: 140px;
          }
          .info-item .label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #888;
            letter-spacing: 0.5px;
          }
          .info-item .value {
            font-size: 13px;
            font-weight: 600;
            color: #111;
          }
          .section {
            margin-bottom: 16px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .levels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .level-card {
            padding: 8px;
            background: #f5f5f5;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
          }
          .level-card .label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #888;
          }
          .level-card .value {
            font-size: 15px;
            font-weight: 700;
            font-family: monospace;
            color: #111;
          }
          .level-card.highlight {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }
          .level-card.highlight .value {
            color: #047857;
          }
          .items-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .item-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            background: #fafafa;
          }
          .item-row .name {
            font-weight: 600;
            font-size: 12px;
          }
          .item-row .status {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
          }
          .item-row .status.ok {
            background: #dcfce7;
            color: #166534;
          }
          .item-row .status.nok {
            background: #fee2e2;
            color: #991b1b;
          }
          .obs-box {
            padding: 10px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .obs-box .obs-title {
            font-weight: 700;
            font-size: 11px;
            color: #92400e;
            margin-bottom: 4px;
          }
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .photo-card {
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
            break-inside: avoid;
          }
          .photo-card .photo-label {
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            background: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
            text-transform: uppercase;
          }
          .photo-card img {
            width: 100%;
            height: 130px;
            object-fit: cover;
            display: block;
          }
          .photo-card .no-photo {
            width: 100%;
            height: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #aaa;
            font-size: 11px;
            font-style: italic;
            background: #f9f9f9;
          }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 2px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer .print-info {
            font-size: 10px;
            color: #999;
          }
          .footer .signature {
            text-align: center;
            min-width: 200px;
          }
          .footer .signature .line {
            border-top: 1px solid #333;
            margin-bottom: 4px;
          }
          .footer .signature .sig-label {
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { padding: 10px; }
            .photos-grid { break-inside: avoid; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>📋 Checklist de Veículo</h1>
            <div class="subtitle">Eletromidia — Controle de Frota</div>
          </div>
          <div class="header-right">
            <div class="placa">${checklistDetail.veiculoPlaca}</div>
            <div>Status: <strong>${checklistDetail.status === "FINALIZADO" ? "✅ TURNO FINALIZADO" : "🔄 EM ROTA"}</strong></div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-item">
            <div class="label">Técnico Responsável</div>
            <div class="value">${checklistDetail.tecnicoNome}</div>
          </div>
          <div class="info-item">
            <div class="label">OPEC</div>
            <div class="value">${checklistDetail.opec || "Não informado"}</div>
          </div>
          <div class="info-item">
            <div class="label">Data</div>
            <div class="value">${checklistDetail.data}</div>
          </div>
          <div class="info-item">
            <div class="label">Saída</div>
            <div class="value">${checklistDetail.hora}</div>
          </div>
          ${checklistDetail.horaFinal ? `
          <div class="info-item">
            <div class="label">Retorno</div>
            <div class="value">${checklistDetail.horaFinal}</div>
          </div>` : ""}
          <div class="info-item">
            <div class="label">Centro de Operação</div>
            <div class="value">${checklistDetail.centroOperacao}</div>
          </div>
        </div>

        ${checklistDetail.observacoesFim ? `
        <div class="obs-box">
          <div class="obs-title">📝 Observações do Encerramento:</div>
          <div>${checklistDetail.observacoesFim}</div>
        </div>` : ""}

        <div class="section">
          <div class="section-title">📊 Níveis e Quilometragem</div>
          <div class="levels-grid">
            <div class="level-card">
              <div class="label">KM Inicial (Saída)</div>
              <div class="value">${checklistDetail.kmInicial?.toLocaleString()} km</div>
            </div>
            <div class="level-card">
              <div class="label">KM Final (Retorno)</div>
              <div class="value">${checklistDetail.kmFinal !== undefined && checklistDetail.kmFinal !== null ? `${checklistDetail.kmFinal.toLocaleString()} km` : "Aguardando..."}</div>
            </div>
            <div class="level-card highlight">
              <div class="label">KM Rodados</div>
              <div class="value">${kmRodados}</div>
            </div>
            <div class="level-card">
              <div class="label">Combustível</div>
              <div class="value">${checklistDetail.nivelCombustivel}</div>
            </div>
            <div class="level-card">
              <div class="label">Óleo do Motor</div>
              <div class="value">${checklistDetail.nivelOleo}</div>
            </div>
            <div class="level-card">
              <div class="label">Água do Motor</div>
              <div class="value">${checklistDetail.nivelAgua}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">✅ Itens e Acessórios Verificados</div>
          <div class="items-grid">
            ${items.map((item) => `
              <div class="item-row">
                <span class="name">${item.label}</span>
                <span class="status ${isPositive(item.val) ? "ok" : "nok"}">${formatItemVal(item.val)}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section">
          <div class="section-title">📷 1. Registro Fotográfico de Saída</div>
          <div class="photos-grid">
            ${fotosSaida.map((foto) => `
              <div class="photo-card">
                <div class="photo-label">${foto.label}</div>
                ${foto.url ? `<img src="${foto.url}" alt="${foto.label}" />` : `<div class="no-photo">Sem foto</div>`}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="section">
          <div class="section-title">📷 2. Registro Fotográfico de Retorno</div>
          <div class="photos-grid">
            ${fotosRetorno.map((foto) => `
              <div class="photo-card">
                <div class="photo-label">${foto.label}</div>
                ${foto.url ? `<img src="${foto.url}" alt="${foto.label}" />` : `<div class="no-photo">Sem foto / Em rota</div>`}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="footer">
          <div class="print-info">
            Documento gerado em ${new Date().toLocaleString("pt-BR")}<br/>
            Veículo: ${checklistDetail.veiculoPlaca} • Checklist: ${checklistDetail.data}
          </div>
          <div class="signature">
            <div class="line"></div>
            <div class="sig-label">Assinatura / Responsável</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Aguardar imagens carregarem antes de imprimir
    const images = printWindow.document.querySelectorAll("img");
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      setTimeout(() => printWindow.print(), 300);
    } else {
      images.forEach((img) => {
        img.onload = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            setTimeout(() => printWindow.print(), 300);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            setTimeout(() => printWindow.print(), 300);
          }
        };
      });
      // Fallback: imprimir após 5 segundos mesmo se imagens não carregarem
      setTimeout(() => printWindow.print(), 5000);
    }
  };

  // States para Exclusão de Usuário
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await removeUser({ id: userToDelete._id });
      toast({
        title: "Usuário Excluído",
        description: `O usuário ${userToDelete.name} foi removido com sucesso.`,
      });
      setUserToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir o usuário.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };


  // Função para exportar Excel Institucional Consolidado (Oficial Eletromidia)
  const handleExportExcel = async (consolidated: boolean = true) => {
    try {
      setIsExporting(true);
      const dataToExport = consolidated ? (allChecklists || []) : (checklists || []);

      if (!dataToExport || dataToExport.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: consolidated
            ? "Não há registros de checklists no sistema para exportar."
            : `Não há checklists registrados para a data selecionada (${selectedDate}).`,
          variant: "destructive",
        });
        return;
      }

      await exportConsolidatedExcel(
        dataToExport as any,
        vehicles as any,
        maintenances as any,
        { filterDate: consolidated ? undefined : (selectedDate || undefined) }
      );

      toast({
        title: "Relatório Excel Gerado com Sucesso!",
        description: consolidated
          ? `Planilha consolidada oficial gerada com ${dataToExport.length} checklists, ${vehicles?.length || 0} veículos e ${maintenances?.length || 0} manutenções.`
          : `Planilha gerada para a data ${selectedDate} com histórico completo da frota.`,
      });
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao gerar a planilha formatada.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Função para exportar CSV (Fallback)
  const handleExportCSV = (consolidated: boolean = false) => {
    const dataToExport = consolidated ? (allChecklists || []) : (checklists || []);
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há checklists para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Data",
      "Hora",
      "Centro Operacao",
      "Tecnico",
      "Email",
      "OPEC (Celular)",
      "Placa",
      "Modelo",
      "KM Inicial",
      "KM Final",
      "KM Rodados",
      "Nivel Combustivel",
      "Nivel Oleo",
      "Nivel Agua",
      "Estepe",
      "Triangulo",
      "Chave Roda",
      "Farois/Lanternas",
      "Macaco",
      "Buzina",
      "Documentacao",
      "Cartao Abastecimento",
    ];

    const rows = dataToExport.map((c: any) => {
      const kmDiff =
        c.kmFinal !== undefined && c.kmFinal !== null && c.kmFinal >= c.kmInicial
          ? c.kmFinal - c.kmInicial
          : "-";

      return [
        c.data,
        c.hora,
        c.centroOperacao,
        `"${c.tecnicoNome}"`,
        c.tecnicoEmail,
        `"${c.opec || "-"}"`,
        c.veiculoPlaca,
        `"${c.veiculoModelo}"`,
        c.kmInicial,
        c.kmFinal !== undefined && c.kmFinal !== null ? c.kmFinal : "-",
        kmDiff,
        `"${c.nivelCombustivel}"`,
        c.nivelOleo,
        c.nivelAgua,
        typeof c.estepe === "boolean" ? (c.estepe ? "SIM" : "NAO") : (c.estepe || "N/A"),
        typeof c.triangulo === "boolean" ? (c.triangulo ? "SIM" : "NAO") : (c.triangulo || "N/A"),
        typeof c.chaveRoda === "boolean" ? (c.chaveRoda ? "SIM" : "NAO") : (c.chaveRoda || "N/A"),
        typeof c.faroisLanternas === "boolean" ? (c.faroisLanternas ? "SIM" : "NAO") : (c.faroisLanternas || "N/A"),
        typeof c.macaco === "boolean" ? (c.macaco ? "SIM" : "NAO") : (c.macaco || "N/A"),
        typeof c.buzina === "boolean" ? (c.buzina ? "SIM" : "NAO") : (c.buzina || "N/A"),
        typeof c.documentacao === "boolean" ? (c.documentacao ? "SIM" : "NAO") : (c.documentacao || "N/A"),
        typeof c.cartaoAbastecimento === "boolean" ? (c.cartaoAbastecimento ? "SIM" : "NAO") : (c.cartaoAbastecimento || "N/A"),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_frota_${consolidated ? "consolidado_geral" : (selectedDate || "todos")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório CSV Exportado!",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  // Contadores e Filtros por Filial (Veículos)
  const unassignedVehiclesCount = useMemo(() => {
    return vehicles?.filter((v) => !v.centroOperacao).length || 0;
  }, [vehicles]);

  const filialCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODAS: vehicles?.length || 0,
      Leste: 0,
      Sul: 0,
      Matriz: 0,
      "T.I": 0,
      SEM_FILIAL: 0,
    };
    vehicles?.forEach((v) => {
      if (!v.centroOperacao) {
        counts.SEM_FILIAL = (counts.SEM_FILIAL || 0) + 1;
      } else {
        const c = v.centroOperacao;
        counts[c] = (counts[c] || 0) + 1;
      }
    });
    return counts;
  }, [vehicles]);

  const displayedVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (filialFilter === "TODAS") return vehicles;
    if (filialFilter === "SEM_FILIAL") return vehicles.filter((v) => !v.centroOperacao);
    return vehicles.filter(
      (v) => (v.centroOperacao || "").toLowerCase() === filialFilter.toLowerCase()
    );
  }, [vehicles, filialFilter]);

  // Contadores e Filtros por Filial (OPECs)
  const unassignedOpecsCount = useMemo(() => {
    return opecs?.filter((o) => !o.centroOperacao).length || 0;
  }, [opecs]);

  const opecFilialCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODAS: opecs?.length || 0,
      Matriz: 0,
      Leste: 0,
      Sul: 0,
      "T.I": 0,
      SEM_FILIAL: 0,
    };
    opecs?.forEach((o) => {
      if (!o.centroOperacao) {
        counts.SEM_FILIAL = (counts.SEM_FILIAL || 0) + 1;
      } else {
        const c = o.centroOperacao;
        counts[c] = (counts[c] || 0) + 1;
      }
    });
    return counts;
  }, [opecs]);

  const displayedOpecs = useMemo(() => {
    if (!opecs) return [];
    if (opecFilialFilter === "TODAS") return opecs;
    if (opecFilialFilter === "SEM_FILIAL") return opecs.filter((o) => !o.centroOperacao);
    return opecs.filter(
      (o) => (o.centroOperacao || "").toLowerCase() === opecFilialFilter.toLowerCase()
    );
  }, [opecs, opecFilialFilter]);

  // Contadores e Filtros por Filial (Manutenções)
  const maintenanceFilialCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODAS: maintenances?.length || 0,
      Matriz: 0,
      Leste: 0,
      Sul: 0,
      "T.I": 0,
      SEM_FILIAL: 0,
    };
    maintenances?.forEach((m) => {
      if (!m.centroOperacao) {
        counts.SEM_FILIAL = (counts.SEM_FILIAL || 0) + 1;
      } else {
        const c = m.centroOperacao;
        counts[c] = (counts[c] || 0) + 1;
      }
    });
    return counts;
  }, [maintenances]);

  const displayedMaintenances = useMemo(() => {
    if (!maintenances) return [];
    return maintenances.filter((m) => {
      // Filtro de filial
      if (maintenanceFilialFilter !== "TODAS") {
        if (maintenanceFilialFilter === "SEM_FILIAL") {
          if (m.centroOperacao) return false;
        } else {
          if ((m.centroOperacao || "").toLowerCase() !== maintenanceFilialFilter.toLowerCase()) {
            return false;
          }
        }
      }

      // Filtro de tipo
      if (maintenanceTipoFilter !== "TODOS") {
        if ((m.tipoManutencao || "").toUpperCase() !== maintenanceTipoFilter.toUpperCase()) {
          return false;
        }
      }

      // Busca textual
      if (maintenanceSearch.trim()) {
        const q = maintenanceSearch.trim().toLowerCase();
        const matchesPlaca = (m.placa || "").toLowerCase().includes(q);
        const matchesTag = (m.tag || "").toLowerCase().includes(q);
        const matchesModelo = (m.modelo || "").toLowerCase().includes(q);
        const matchesDesc = (m.descricaoServico || "").toLowerCase().includes(q);
        const matchesMotivo = (m.motivoEntrada || "").toLowerCase().includes(q);
        const matchesOficina = (m.oficina || "").toLowerCase().includes(q);
        const matchesLider = (m.realizadoPorNome || "").toLowerCase().includes(q);
        const matchesFilial = (m.centroOperacao || "").toLowerCase().includes(q);
        return (
          matchesPlaca ||
          matchesTag ||
          matchesModelo ||
          matchesDesc ||
          matchesMotivo ||
          matchesOficina ||
          matchesLider ||
          matchesFilial
        );
      }

      return true;
    });
  }, [maintenances, maintenanceFilialFilter, maintenanceTipoFilter, maintenanceSearch]);

  const maintenanceKPIs = useMemo(() => {
    const total = maintenances?.length || 0;
    const emManutencao = vehicles?.filter((v) => v.status === "MANUTENCAO").length || 0;
    const totalCusto = maintenances?.reduce((acc, curr) => acc + (curr.custo || 0), 0) || 0;
    const preventivas =
      maintenances?.filter(
        (m) =>
          (m.tipoManutencao || "").toUpperCase().includes("PREVENTIVA") ||
          (m.tipoManutencao || "").toUpperCase().includes("REVISAO")
      ).length || 0;
    const corretivas =
      maintenances?.filter((m) =>
        (m.tipoManutencao || "").toUpperCase().includes("CORRETIVA")
      ).length || 0;

    return {
      total,
      emManutencao,
      totalCusto,
      preventivas,
      corretivas,
    };
  }, [maintenances, vehicles]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaca || !newModelo) return;

    setIsCreatingVehicle(true);
    try {
      await createVehicle({
        placa: newPlaca,
        modelo: newModelo,
        tag: newTag.trim() || undefined,
        status: "ATIVO",
        centroOperacao: newCentroOperacao,
      });
      setNewPlaca("");
      setNewModelo("");
      setNewTag("");
      toast({
        title: "Veículo Cadastrado!",
        description: `Veículo inserido com sucesso na Filial ${newCentroOperacao}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível cadastrar o veículo.";
      toast({
        title: "Erro ao cadastrar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingVehicle(false);
    }
  };


  const handleBatchAssignLeste = async () => {
    setIsBatchAssigning(true);
    try {
      const count = await assignBatchCentroOperacao({
        targetCentroOperacao: "Leste",
        onlyUnassigned: true,
      });
      toast({
        title: "Veículos Vinculados!",
        description: `${count} veículo(s) foram atribuídos à Filial Leste.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao vincular",
        description: "Não foi possível vincular os veículos.",
        variant: "destructive",
      });
    } finally {
      setIsBatchAssigning(false);
    }
  };

  // 1. Estado de Carregamento
  if (!isLoaded || (isSignedIn && currentUser === undefined)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Verificando permissões de acesso...
          </p>
        </motion.div>
      </div>
    );
  }

  // 2. Usuário não autenticado
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="max-w-md w-full text-center p-6 space-y-4 shadow-lg border-border">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <LockIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Autenticação Necessária</h2>
          <p className="text-sm text-muted-foreground">
            Você precisa estar conectado com sua conta Eletromidia para acessar este sistema.
          </p>
          <Link href="/" className="block">
            <Button className="w-full bg-primary text-black font-bold">
              Fazer Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 3. Usuário Não é Líder (Acesso Restrito para Técnicos)
  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 border-destructive/30 shadow-xl overflow-hidden bg-card">
            <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                <ShieldAlertIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-destructive">Acesso Restrito ao Painel</h2>
                <p className="text-xs text-muted-foreground">Permissão exclusiva para Líderes de Frota</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-5 text-center sm:text-left">
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">
                  Olá, <strong className="text-primary">{user?.fullName || user?.firstName || "Técnico"}</strong>!
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seu perfil atual de acesso está definido como <Badge variant="secondary" className="font-bold">TÉCNICO</Badge>. A visualização do dashboard gerencial, gestão da frota, exportação de planilhas e métricas consolidadas é restrita apenas aos Líderes.
                </p>
                <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border">
                  Caso você precise de acesso como Líder para gerenciar veículos e relatórios da sua filial, solicite a alteração de perfil ao seu gestor.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link href="/checklist" className="flex-1">
                  <Button className="w-full bg-primary text-black font-bold h-11 flex items-center justify-center gap-2 hover:bg-primary/90">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Ir para o Formulário de Checklist
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl pb-24">
      {/* Header com Boas Vindas e Data */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Painel do Líder</h1>
            <Badge className="bg-primary text-black font-bold">Gestão Eletromidia</Badge>
          </div>
          <p className="text-muted-foreground">
            Acompanhamento em tempo real da saída de veículos e relatórios diários.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => handleExportExcel(true)}
            disabled={isExporting}
            className="bg-primary text-black hover:bg-primary/90 font-bold flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheetIcon className="w-4 h-4" />
            {isExporting ? "Gerando Planilha..." : "Exportar Relatório Consolidado (.XLSX)"}
          </Button>

          {selectedDate && (
            <Button
              onClick={() => handleExportExcel(false)}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
              title={`Exportar somente os registros da data ${selectedDate}`}
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1" />
              Exportar Dia ({selectedDate})
            </Button>
          )}

          <Button
            onClick={() => handleExportCSV(true)}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Exportar CSV (Todos os Dias)"
          >
            .CSV
          </Button>
        </div>
      </motion.div>

      {/* Cards de Indicadores do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Checklists Hoje
            </CardTitle>
            <ClipboardCheckIcon className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalChecklistsToday ?? 0}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="text-green-600 font-semibold">{stats?.completedToday ?? 0} finalizados</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{stats?.inProgressToday ?? 0} em rota</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Rota / Atividade
            </CardTitle>
            <CarIcon className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.inProgressToday ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Carros aguardando KM final</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turnos Concluídos
            </CardTitle>
            <CheckCircle2Icon className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats?.completedToday ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Checklists 100% finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total da Frota
            </CardTitle>
            <WrenchIcon className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalVehicles ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Veículos cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="checklists" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 max-w-4xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="checklists" className="font-bold">
            Checklists
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="font-bold">
            Veículos ({vehicles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="font-bold">
            Manutenções ({maintenances?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="opecs" className="font-bold">
            OPECs ({opecs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users" className="font-bold">
            Equipe ({usersList?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RELATÓRIOS E CHECKLISTS */}
        <TabsContent value="checklists" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Histórico de Checklists</CardTitle>
                <CardDescription>
                  Visualize todos os envios com detalhes e registros fotográficos.
                </CardDescription>
              </div>

              {/* Filtro por Data */}
              <div className="flex items-center gap-2">
                <Label htmlFor="filtroData" className="text-sm font-medium whitespace-nowrap">
                  Filtrar Data:
                </Label>
                <Input
                  id="filtroData"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto h-9"
                />
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate("")}
                    className="text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Hora</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Aparelho (OPEC)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead>KM / Rodados</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead>Óleo/Água</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!checklists ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          Carregando relatórios...
                        </TableCell>
                      </TableRow>
                    ) : checklists.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          Nenhum checklist registrado para esta data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      checklists.map((c: any) => {
                        const isFinished = c.status === "FINALIZADO" || (c.kmFinal !== undefined && c.kmFinal !== null && c.kmFinal > 0);
                        const kmRodados =
                          isFinished && c.kmFinal !== undefined && c.kmFinal !== null && c.kmFinal >= c.kmInicial
                            ? c.kmFinal - c.kmInicial
                            : null;

                        return (
                          <TableRow key={c._id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">
                              <div>{c.hora}</div>
                              {c.horaFinal && (
                                <div className="text-[10px] text-muted-foreground">Fim: {c.horaFinal}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{c.tecnicoNome}</div>
                              <div className="text-xs text-muted-foreground">{c.tecnicoEmail}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono font-bold bg-muted/20">
                                {c.veiculoPlaca}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {c.opec ? (
                                <Badge variant="outline" className="text-xs font-semibold flex items-center gap-1 w-fit bg-primary/10 border-primary/30 text-foreground">
                                  <SmartphoneIcon className="w-3 h-3 text-primary shrink-0" />
                                  {c.opec}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Não inf.</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isFinished ? (
                                <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border border-green-600/30 font-bold text-[10px]">
                                  FINALIZADO
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] animate-pulse">
                                  EM ROTA
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                                {c.centroOperacao}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              <div>
                                <span className="text-muted-foreground text-[11px]">Saída: </span>
                                <span className="font-medium">{c.kmInicial.toLocaleString()} km</span>
                              </div>
                              {isFinished && c.kmFinal !== undefined && c.kmFinal !== null ? (
                                <div>
                                  <span className="text-muted-foreground text-[11px]">Retorno: </span>
                                  <span className="font-medium">{c.kmFinal.toLocaleString()} km</span>
                                </div>
                              ) : (
                                <div className="text-amber-600 text-[11px] font-semibold italic">
                                  Aguardando retorno...
                                </div>
                              )}
                              {kmRodados !== null && (
                                <div className="mt-1">
                                  <Badge className="bg-green-600/15 text-green-700 font-mono font-bold text-[10px] px-1.5 py-0 border border-green-600/30 hover:bg-green-600/20">
                                    +{kmRodados.toLocaleString()} km rodados
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{c.nivelCombustivel}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                Óleo: {c.nivelOleo} | Água: {c.nivelAgua}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedChecklistId(c._id)}
                                  className="flex items-center gap-1"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                  Ver Detalhes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40"
                                  onClick={() => setChecklistToDelete(c)}
                                  title="Excluir checklist"
                                >
                                  <Trash2Icon className="w-4 h-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: GERENCIAR VEÍCULOS */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulário de Novo Veículo */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircleIcon className="w-5 h-5 text-primary" />
                  Cadastrar Veículo
                </CardTitle>
                <CardDescription>Adicione novos carros à frota indicando sua filial.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateVehicle} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa">Placa do Carro</Label>
                    <Input
                      id="placa"
                      placeholder="Ex: ABC-1234"
                      value={newPlaca}
                      onChange={(e) => setNewPlaca(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo / Descrição</Label>
                    <Input
                      id="modelo"
                      placeholder="Ex: Fiorino Branca 2023"
                      value={newModelo}
                      onChange={(e) => setNewModelo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tag">TAG / Número da Frota (Opcional)</Label>
                    <Input
                      id="tag"
                      placeholder="Ex: 1, 12, 35"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="centroOperacao">Filial / Centro de Operação</Label>
                    <Select value={newCentroOperacao} onValueChange={(val) => val && setNewCentroOperacao(val)}>
                      <SelectTrigger id="centroOperacao">
                        <SelectValue placeholder="Selecione a filial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sul">Sul</SelectItem>
                        <SelectItem value="Leste">Leste</SelectItem>
                        <SelectItem value="Matriz">Matriz</SelectItem>
                        <SelectItem value="T.I">T.I</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingVehicle}
                    className="w-full bg-primary text-black font-bold h-11"
                  >
                    Salvar Veículo
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Listagem de Veículos */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>Veículos Cadastrados</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {displayedVehicles.length} de {vehicles?.length || 0}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Gerencie a frota por filial e acompanhe as manutenções.
                    </CardDescription>
                  </div>
                  {vehicles && vehicles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40 font-bold flex items-center gap-1.5 shrink-0"
                      onClick={() => setIsDeletingAllVehiclesOpen(true)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                      Apagar Todos ({vehicles.length})
                    </Button>
                  )}
                </div>

                {/* Alerta de Veículos sem Filial com 1-Click Fix */}
                {unassignedVehiclesCount > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-2">
                      <AlertTriangleIcon className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        Existem <strong>{unassignedVehiclesCount} veículo(s)</strong> sem filial definida.
                      </span>
                    </span>
                    <Button
                      size="sm"
                      onClick={handleBatchAssignLeste}
                      disabled={isBatchAssigning}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-xs shrink-0"
                    >
                      {isBatchAssigning ? "Vinculando..." : "Vincular todos à Filial Leste"}
                    </Button>
                  </div>
                )}

                {/* Filtro Rápido por Filial */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { id: "TODAS", label: "Todas", count: filialCounts.TODAS },
                    { id: "Leste", label: "Leste", count: filialCounts.Leste },
                    { id: "Sul", label: "Sul", count: filialCounts.Sul },
                    { id: "Matriz", label: "Matriz", count: filialCounts.Matriz },
                    { id: "T.I", label: "T.I", count: filialCounts["T.I"] || 0 },
                    ...(filialCounts.SEM_FILIAL > 0
                      ? [{ id: "SEM_FILIAL", label: "Sem Filial", count: filialCounts.SEM_FILIAL }]
                      : []),
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      variant={filialFilter === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilialFilter(tab.id)}
                      className={cn(
                        "h-8 text-xs font-semibold flex items-center gap-1.5",
                        filialFilter === tab.id
                          ? "bg-primary text-black font-bold hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                          filialFilter === tab.id
                            ? "bg-black/20 text-black"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {tab.count}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Placa</TableHead>
                        <TableHead>TAG</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Filial / Região</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Manutenção / KM</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            {filialFilter === "TODAS"
                              ? "Nenhum veículo cadastrado na frota."
                              : `Nenhum veículo cadastrado para o filtro "${filialFilter}".`}
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedVehicles.map((v) => {
                          const kmAtual = v.kmAtual || 0;
                          const proximaManutencao = v.proximaManutencaoKm || 0;
                          const isWarning = proximaManutencao > 0 && kmAtual >= proximaManutencao;

                          const filialName = v.centroOperacao;
                          let filialBadgeColor = "border-muted-foreground/30 text-muted-foreground";
                          if (filialName === "Leste") {
                            filialBadgeColor = "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10";
                          } else if (filialName === "Sul") {
                            filialBadgeColor = "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10";
                          } else if (filialName === "Matriz") {
                            filialBadgeColor = "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10";
                          } else if (filialName === "T.I") {
                            filialBadgeColor = "border-purple-500/40 text-purple-700 dark:text-purple-400 bg-purple-500/10";
                          }

                          return (
                            <TableRow key={v._id}>
                              <TableCell className="font-mono font-bold">
                                {v.placa}
                                {isWarning && (
                                  <Badge variant="destructive" className="ml-2 text-[10px]">
                                    MANUTENÇÃO RECOMENDADA
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {v.tag ? (
                                  <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 font-mono font-bold text-xs">
                                    TAG {v.tag}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs font-mono">-</span>
                                )}
                              </TableCell>
                              <TableCell>{v.modelo}</TableCell>
                              <TableCell>
                                {filialName ? (
                                  <Badge variant="outline" className={cn("font-semibold text-xs", filialBadgeColor)}>
                                    <MapPinIcon className="w-3 h-3 mr-1" />
                                    {filialName}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Sem Filial
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {v.status === "ATIVO" ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold">
                                    ATIVO
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="bg-red-600 hover:bg-red-600 font-semibold animate-pulse">
                                    EM MANUTENÇÃO
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  <div>Atual: {kmAtual > 0 ? `${kmAtual.toLocaleString()} km` : "N/I"}</div>
                                  <div>Próx: {proximaManutencao > 0 ? `${proximaManutencao.toLocaleString()} km` : "Não definida"}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1.5 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold hover:border-primary/50 text-foreground"
                                    onClick={() => handleOpenEditVehicle(v)}
                                    title="Editar dados do veículo (placa, modelo, TAG, filial, status, KM)"
                                  >
                                    <PencilIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold hover:border-primary/50 text-foreground"
                                    onClick={() => setVehicleToViewHistory(v)}
                                    title="Visualizar histórico de manutenções deste carro"
                                  >
                                    <HistoryIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                                    Histórico
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                      setSelectedMaintenanceVehicle(v);
                                      if (v.proximaManutencaoKm) {
                                        setNewProximaManutencao(v.proximaManutencaoKm.toString());
                                      } else {
                                        const modeloUpper = (v.modelo || "").toUpperCase();
                                        const baseKm = v.kmAtual || 0;
                                        if (modeloUpper.includes("MASTER") || modeloUpper.includes("DUCATO")) {
                                          setNewProximaManutencao((baseKm + 20000).toString());
                                        } else {
                                          setNewProximaManutencao((baseKm + 10000).toString());
                                        }
                                      }
                                    }}
                                    title="Configurar KM de Manutenção"
                                  >
                                    <WrenchIcon className="w-3.5 h-3.5 mr-1" /> KM
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-900/40"
                                    onClick={() => setVehicleToResetKm(v)}
                                    title="Zerar quilometragem deste veículo"
                                  >
                                    <RotateCcwIcon className="w-3.5 h-3.5 mr-1" />
                                    Zerar KM
                                  </Button>
                                  {v.status === "ATIVO" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300 dark:border-amber-900/50"
                                      onClick={() => handleOpenEnterMaintenance(v)}
                                      title="Colocar veículo em manutenção"
                                    >
                                      <WrenchIcon className="w-3.5 h-3.5 mr-1" />
                                      Manutenção
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                      onClick={() => handleOpenReactivate(v)}
                                      title="Reativar veículo e escrever o que foi feito no carro"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5 mr-1" />
                                      Reativar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40 px-2"
                                    onClick={() => setVehicleToDelete(v)}
                                    title="Excluir veículo"
                                  >
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: HISTÓRICO DE MANUTENÇÕES DA FROTA */}
        <TabsContent value="manutencoes" className="space-y-6">
          {/* Métricas de Manutenção (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Manutenções
                </CardTitle>
                <HistoryIcon className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">{maintenanceKPIs.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Registros salvos no histórico</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Manutenção Agora
                </CardTitle>
                <WrenchIcon className="w-5 h-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                    {maintenanceKPIs.emManutencao}
                  </div>
                  {maintenanceKPIs.emManutencao > 0 && (
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-600 text-[10px] animate-pulse">
                      Oficina
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Carros aguardando liberação</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Investimento Acumulado
                </CardTitle>
                <DollarSignIcon className="w-5 h-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {maintenanceKPIs.totalCusto > 0
                    ? `R$ ${maintenanceKPIs.totalCusto.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "R$ 0,00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Custo total informado em reparos</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Preventivas vs Corretivas
                </CardTitle>
                <CheckCircle2Icon className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    {maintenanceKPIs.preventivas} Prev.
                  </Badge>
                  <Badge className="bg-amber-600 text-white font-bold text-xs">
                    {maintenanceKPIs.corretivas} Corr.
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Classificação dos serviços</p>
              </CardContent>
            </Card>
          </div>

          {/* Listagem Geral de Manutenções com Filtros */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-primary" />
                    <span>Histórico Completo de Manutenções</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {displayedMaintenances.length} de {maintenances?.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Consulte todos os serviços executados nos veículos quando reativados pelos líderes.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/40 text-primary hover:bg-primary/10 font-bold"
                    onClick={() => handleExportExcel(true)}
                    disabled={isExporting}
                  >
                    <DownloadIcon className="w-4 h-4 mr-1.5" />
                    Exportar XLSX com Manutenções
                  </Button>
                </div>
              </div>

              {/* Barra de Filtros e Busca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {/* Busca Textual */}
                <div className="relative md:col-span-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa, TAG, modelo, serviço, oficina ou líder..."
                    value={maintenanceSearch}
                    onChange={(e) => setMaintenanceSearch(e.target.value)}
                    className="pl-9"
                  />
                  {maintenanceSearch && (
                    <button
                      type="button"
                      onClick={() => setMaintenanceSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtro por Filial */}
                <div>
                  <Select
                    value={maintenanceFilialFilter}
                    onValueChange={(val) => val && setMaintenanceFilialFilter(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filial / Região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">
                        Todas as Filiais ({maintenanceFilialCounts.TODAS})
                      </SelectItem>
                      <SelectItem value="Matriz">
                        Matriz ({maintenanceFilialCounts.Matriz})
                      </SelectItem>
                      <SelectItem value="Sul">
                        Sul ({maintenanceFilialCounts.Sul})
                      </SelectItem>
                      <SelectItem value="Leste">
                        Leste ({maintenanceFilialCounts.Leste})
                      </SelectItem>
                      <SelectItem value="T.I">
                        T.I ({maintenanceFilialCounts["T.I"]})
                      </SelectItem>
                      {maintenanceFilialCounts.SEM_FILIAL > 0 && (
                        <SelectItem value="SEM_FILIAL">
                          Sem Filial ({maintenanceFilialCounts.SEM_FILIAL})
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo */}
                <div>
                  <Select
                    value={maintenanceTipoFilter}
                    onValueChange={(val) => val && setMaintenanceTipoFilter(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os Tipos</SelectItem>
                      <SelectItem value="PREVENTIVA">Preventiva / Revisão</SelectItem>
                      <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                      <SelectItem value="PNEUS">Pneus / Alinhamento</SelectItem>
                      <SelectItem value="ELETRICA">Auto Elétrica</SelectItem>
                      <SelectItem value="FUNILARIA">Funilaria / Pintura</SelectItem>
                      <SelectItem value="OUTRO">Outros Reparos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[140px]">Data Reativação</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>KM Manutenção</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="min-w-[280px]">O Que Foi Feito no Carro</TableHead>
                      <TableHead>Oficina / Custo</TableHead>
                      <TableHead>Líder Responsável</TableHead>
                      <TableHead className="text-right w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedMaintenances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <HistoryIcon className="w-10 h-10 stroke-1 text-muted-foreground/60" />
                            <p className="font-semibold text-foreground">
                              {maintenances && maintenances.length === 0
                                ? "Nenhuma manutenção registrada até o momento."
                                : "Nenhum registro encontrado com os filtros aplicados."}
                            </p>
                            <p className="text-xs max-w-md text-center">
                              Quando um veículo entrar em manutenção e for reativado por um líder, o registro completo dos serviços realizados aparecerá automaticamente nesta tabela e nos relatórios.
                            </p>
                            {(maintenanceSearch || maintenanceFilialFilter !== "TODAS" || maintenanceTipoFilter !== "TODOS") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={() => {
                                  setMaintenanceSearch("");
                                  setMaintenanceFilialFilter("TODAS");
                                  setMaintenanceTipoFilter("TODOS");
                                }}
                              >
                                Limpar Filtros de Busca
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedMaintenances.map((m) => {
                        let dataFormatada = m.dataReativacao;
                        if (dataFormatada && dataFormatada.includes("-")) {
                          const parts = dataFormatada.split("-");
                          if (parts.length === 3) {
                            dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                        }

                        let dataEntradaFormatada = m.dataEntrada;
                        if (dataEntradaFormatada && dataEntradaFormatada.includes("-")) {
                          const parts = dataEntradaFormatada.split("-");
                          if (parts.length === 3) {
                            dataEntradaFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                        }

                        const tipoUpper = (m.tipoManutencao || "PREVENTIVA").toUpperCase();
                        let badgeColor = "bg-primary/20 text-primary border-primary/30";
                        if (tipoUpper.includes("PREVENTIVA") || tipoUpper.includes("REVISAO")) {
                          badgeColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
                        } else if (tipoUpper.includes("CORRETIVA")) {
                          badgeColor = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
                        }

                        return (
                          <TableRow key={m._id} className="hover:bg-muted/40 transition-colors">
                            {/* Data e Hora */}
                            <TableCell className="font-medium">
                              <div className="text-xs font-semibold">{dataFormatada}</div>
                              {m.horaReativacao && (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <ClockIcon className="w-3 h-3" />
                                  {m.horaReativacao}
                                </div>
                              )}
                              {dataEntradaFormatada && dataEntradaFormatada !== dataFormatada && (
                                <div className="text-[10px] text-muted-foreground/80 mt-1 italic">
                                  Entrada: {dataEntradaFormatada}
                                </div>
                              )}
                            </TableCell>

                            {/* Veículo */}
                            <TableCell>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {m.tag && (
                                  <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 font-bold text-[10px] px-1.5 py-0">
                                    TAG {m.tag}
                                  </Badge>
                                )}
                                <span className="font-mono font-bold text-xs bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                                  {m.placa}
                                </span>
                              </div>
                              {m.modelo && (
                                <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                                  {m.modelo}
                                </div>
                              )}
                            </TableCell>

                            {/* Filial */}
                            <TableCell>
                              {m.centroOperacao ? (
                                <Badge variant="secondary" className="text-xs">
                                  {m.centroOperacao}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            {/* KM */}
                            <TableCell>
                              <div className="text-xs font-mono font-semibold">
                                {m.kmManutencao !== undefined && m.kmManutencao !== null
                                  ? `${m.kmManutencao.toLocaleString()} km`
                                  : "-"}
                              </div>
                              {m.proximaRevisaoKm && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Próx: {m.proximaRevisaoKm.toLocaleString()} km
                                </div>
                              )}
                            </TableCell>

                            {/* Tipo */}
                            <TableCell>
                              <Badge variant="outline" className={cn("text-[11px] font-bold", badgeColor)}>
                                {m.tipoManutencao || "PREVENTIVA"}
                              </Badge>
                            </TableCell>

                            {/* O que foi feito */}
                            <TableCell>
                              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70 text-xs leading-relaxed">
                                <div className="font-medium text-foreground whitespace-pre-wrap">
                                  {m.descricaoServico}
                                </div>
                                {m.motivoEntrada && (
                                  <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-start gap-1">
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">Motivo entrada:</span>
                                    <span>{m.motivoEntrada}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Oficina e Custo */}
                            <TableCell>
                              <div className="text-xs">
                                {m.oficina ? (
                                  <div className="font-medium text-foreground">{m.oficina}</div>
                                ) : (
                                  <div className="text-muted-foreground text-xs italic">Oficina não inf.</div>
                                )}
                                {m.custo !== undefined && m.custo !== null && m.custo > 0 && (
                                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    R$ {m.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Responsável (Líder) */}
                            <TableCell>
                              <div className="text-xs font-medium text-foreground">
                                {m.realizadoPorNome}
                              </div>
                              {m.realizadoPorEmail && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                  {m.realizadoPorEmail}
                                </div>
                              )}
                            </TableCell>

                            {/* Ações */}
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => setMaintenanceToDelete(m)}
                                title="Excluir este registro de manutenção"
                              >
                                <Trash2Icon className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: GERENCIAR OPECS (CELULARES) */}
        <TabsContent value="opecs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulário de Novo OPEC */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SmartphoneIcon className="w-5 h-5 text-primary" />
                  Cadastrar Aparelho OPEC
                </CardTitle>
                <CardDescription>Adicione celulares corporativos e vincule à filial correspondente.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOpec} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="opec-codigo">Identificador / Código</Label>
                    <Input
                      id="opec-codigo"
                      placeholder="Ex: OPEC 51 ou OPEC Apoio 2"
                      value={newOpecCodigo}
                      onChange={(e) => setNewOpecCodigo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opec-descricao">Modelo / Descrição (Opcional)</Label>
                    <Input
                      id="opec-descricao"
                      placeholder="Ex: Samsung Galaxy A14, Motorola G54"
                      value={newOpecDescricao}
                      onChange={(e) => setNewOpecDescricao(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opec-centroOperacao">Filial / Centro de Operação</Label>
                    <Select value={newOpecCentroOperacao} onValueChange={(val) => val && setNewOpecCentroOperacao(val)}>
                      <SelectTrigger id="opec-centroOperacao">
                        <SelectValue placeholder="Selecione a filial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matriz">Matriz</SelectItem>
                        <SelectItem value="Sul">Sul</SelectItem>
                        <SelectItem value="Leste">Leste</SelectItem>
                        <SelectItem value="T.I">T.I</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingOpec}
                    className="w-full bg-primary text-black font-bold h-11 flex items-center justify-center gap-1.5"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    {isCreatingOpec ? "Cadastrando..." : "Salvar OPEC"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Listagem de OPECs */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>OPECs Cadastrados</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {displayedOpecs.length} de {opecs?.length || 0}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Gerencie os celulares corporativos por filial para a operação.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1.5"
                      onClick={handleInitializeDefaultOpecs}
                      disabled={isInitializingOpecs}
                      title="Carregar ou restaurar OPEC 01 a 50 vinculados à Matriz"
                    >
                      <SmartphoneIcon className="w-3.5 h-3.5" />
                      {isInitializingOpecs ? "Carregando..." : "Carregar Padrão (Matriz)"}
                    </Button>
                    {opecs && opecs.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40 font-bold flex items-center gap-1.5"
                        onClick={() => setIsDeletingAllOpecsOpen(true)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                        Apagar Todos ({opecs.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtro Rápido por Filial */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { id: "TODAS", label: "Todas", count: opecFilialCounts.TODAS },
                    { id: "Matriz", label: "Matriz", count: opecFilialCounts.Matriz },
                    { id: "Leste", label: "Leste", count: opecFilialCounts.Leste },
                    { id: "Sul", label: "Sul", count: opecFilialCounts.Sul },
                    { id: "T.I", label: "T.I", count: opecFilialCounts["T.I"] || 0 },
                    ...(opecFilialCounts.SEM_FILIAL > 0
                      ? [{ id: "SEM_FILIAL", label: "Sem Filial", count: opecFilialCounts.SEM_FILIAL }]
                      : []),
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      variant={opecFilialFilter === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOpecFilialFilter(tab.id)}
                      className={cn(
                        "h-8 text-xs font-semibold flex items-center gap-1.5",
                        opecFilialFilter === tab.id
                          ? "bg-primary text-black font-bold hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                          opecFilialFilter === tab.id
                            ? "bg-black/20 text-black"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {tab.count}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Código / Identificador</TableHead>
                        <TableHead>Modelo / Descrição</TableHead>
                        <TableHead>Filial / Centro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedOpecs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            {opecFilialFilter === "TODAS"
                              ? "Nenhum OPEC cadastrado no sistema."
                              : `Nenhum OPEC cadastrado para o filtro "${opecFilialFilter}".`}
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedOpecs.map((o) => {
                          const filialName = o.centroOperacao;
                          let filialBadgeColor = "border-muted-foreground/30 text-muted-foreground";
                          if (filialName === "Leste") {
                            filialBadgeColor = "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10";
                          } else if (filialName === "Sul") {
                            filialBadgeColor = "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10";
                          } else if (filialName === "Matriz") {
                            filialBadgeColor = "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10";
                          } else if (filialName === "T.I") {
                            filialBadgeColor = "border-purple-500/40 text-purple-700 dark:text-purple-400 bg-purple-500/10";
                          }

                          return (
                            <TableRow key={o._id}>
                              <TableCell className="font-bold">
                                <Badge variant="outline" className="text-xs font-bold flex items-center gap-1 w-fit bg-primary/10 border-primary/30 text-foreground">
                                  <SmartphoneIcon className="w-3 h-3 text-primary shrink-0" />
                                  {o.codigo}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-medium">
                                {o.descricao || "Celular Corporativo"}
                              </TableCell>
                              <TableCell>
                                {filialName ? (
                                  <Badge variant="outline" className={cn("font-semibold text-xs", filialBadgeColor)}>
                                    <MapPinIcon className="w-3 h-3 mr-1" />
                                    {filialName}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Sem Filial
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {o.status === "ATIVO" ? (
                                  <Badge className="bg-green-600 text-white">ATIVO</Badge>
                                ) : (
                                  <Badge variant="destructive">MANUTENÇÃO</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => {
                                      setEditingOpec(o);
                                      setEditOpecCodigo(o.codigo);
                                      setEditOpecDescricao(o.descricao || "");
                                      setEditOpecFilialValue(o.centroOperacao || "Matriz");
                                    }}
                                    title="Editar filial e descrição do aparelho"
                                  >
                                    <MapPinIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                                    Filial / Modelo
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      updateOpecStatus({
                                        id: o._id,
                                        status: o.status === "ATIVO" ? "MANUTENCAO" : "ATIVO",
                                      })
                                    }
                                  >
                                    {o.status === "ATIVO" ? "Manutenção" : "Ativar"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40 px-2"
                                    onClick={() => setOpecToDelete(o)}
                                    title="Excluir OPEC"
                                  >
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: GERENCIAR EQUIPE / PERFIS */}
        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                Controle de Acessos & Perfis
              </CardTitle>
              <CardDescription>
                Todos entram como Técnicos por padrão. Aqui você pode definir quem são os Líderes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil Atual</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!usersList || usersList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhum usuário sincronizado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      usersList.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell className="font-semibold">{u.name}</TableCell>
                          <TableCell className="font-mono text-sm">{u.email}</TableCell>
                          <TableCell>
                            {u.role === "LIDER" ? (
                              <Badge className="bg-primary text-black font-bold">LÍDER</Badge>
                            ) : (
                              <Badge variant="secondary">TÉCNICO</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant={u.role === "LIDER" ? "outline" : "default"}
                                className={u.role !== "LIDER" ? "bg-primary text-black font-bold" : ""}
                                onClick={() =>
                                  updateRole({
                                    id: u._id,
                                    role: u.role === "LIDER" ? "TECNICO" : "LIDER",
                                  })
                                }
                              >
                                {u.role === "LIDER" ? "Rebaixar para Técnico" : "Promover a Líder"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40"
                                onClick={() => setUserToDelete(u)}
                                title="Excluir usuário"
                              >
                                <Trash2Icon className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE DETALHES DO CHECKLIST (COM FOTOS REAIS) */}
      <Dialog
        open={!!selectedChecklistId}
        onOpenChange={(open) => !open && setSelectedChecklistId(null)}
      >
        <DialogContent className="max-w-4xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-2 border-b">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <span>Checklist Detalhado</span>
                </DialogTitle>
                {checklistDetail?.veiculoPlaca && (
                  <Badge className="bg-primary text-black font-mono font-bold text-sm px-2.5 py-0.5">
                    {checklistDetail.veiculoPlaca}
                  </Badge>
                )}
                {checklistDetail?.opec && (
                  <Badge className="bg-primary/20 text-foreground border border-primary/40 text-xs font-bold flex items-center gap-1">
                    <SmartphoneIcon className="w-3.5 h-3.5 text-primary" />
                    {checklistDetail.opec}
                  </Badge>
                )}
                {checklistDetail && (
                  <Badge
                    className={`text-xs font-bold ${checklistDetail.status === "FINALIZADO"
                      ? "bg-green-600/20 text-green-700 dark:text-green-400 border-green-600/30"
                      : "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse"
                      }`}
                  >
                    {checklistDetail.status === "FINALIZADO" ? "TURNO FINALIZADO" : "EM ROTA / EM ANDAMENTO"}
                  </Badge>
                )}
              </div>
            </div>
            {checklistDetail && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  <strong className="text-foreground">{checklistDetail.tecnicoNome}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <SmartphoneIcon className="w-3.5 h-3.5 text-primary" />
                  OPEC: <strong className="text-foreground">{checklistDetail.opec || "Não informado"}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {checklistDetail.data}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5 text-primary" />
                  Saída: <strong className="text-foreground">{checklistDetail.hora}</strong>
                </span>
                {checklistDetail.horaFinal && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5 text-green-600" />
                    Retorno: <strong className="text-foreground">{checklistDetail.horaFinal}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {checklistDetail.centroOperacao}
                </span>
              </div>
            )}
          </DialogHeader>

          {checklistDetail && (
            <div className="space-y-6 pt-2">
              {/* Observações de Encerramento (se houver) */}
              {checklistDetail.observacoesFim && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    📝 Observações do Encerramento:
                  </span>
                  <p className="text-foreground">{checklistDetail.observacoesFim}</p>
                </div>
              )}

              {/* Resumo dos Níveis e Quilometragem */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <GaugeIcon className="w-4 h-4 text-primary" />
                  Níveis e Quilometragem
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">KM Inicial (Saída)</span>
                    <p className="text-base sm:text-lg font-bold font-mono text-foreground mt-1">
                      {checklistDetail.kmInicial?.toLocaleString()} km
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase">KM Final (Retorno)</span>
                    <p className="text-base sm:text-lg font-bold font-mono text-foreground mt-1">
                      {checklistDetail.kmFinal !== undefined && checklistDetail.kmFinal !== null
                        ? `${checklistDetail.kmFinal.toLocaleString()} km`
                        : "Aguardando..."}
                    </p>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase flex items-center gap-1">
                      <RouteIcon className="w-3 h-3 text-green-600" />
                      KM Rodados
                    </span>
                    <p className="text-base sm:text-lg font-bold font-mono text-green-700 dark:text-green-400 mt-1">
                      {checklistDetail.kmFinal !== undefined &&
                        checklistDetail.kmFinal !== null &&
                        checklistDetail.kmFinal >= checklistDetail.kmInicial
                        ? `+${(checklistDetail.kmFinal - checklistDetail.kmInicial).toLocaleString()} km`
                        : "Em rota"}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <FuelIcon className="w-3 h-3 text-amber-500" />
                      Combustível
                    </span>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1">
                      {checklistDetail.nivelCombustivel}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <DropletsIcon className="w-3 h-3 text-blue-500" />
                      Óleo do Motor
                    </span>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1">
                      {checklistDetail.nivelOleo}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <DropletsIcon className="w-3 h-3 text-cyan-500" />
                      Água do Motor
                    </span>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1">
                      {checklistDetail.nivelAgua}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens e Acessórios */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <ClipboardCheckIcon className="w-4 h-4 text-primary" />
                  Itens e Acessórios Verificados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-sm">
                  {[
                    { label: "Estepe", val: checklistDetail.estepe },
                    { label: "Triângulo", val: checklistDetail.triangulo },
                    { label: "Chave de Roda", val: checklistDetail.chaveRoda },
                    { label: "Faróis/Lanternas", val: checklistDetail.faroisLanternas },
                    { label: "Macaco", val: checklistDetail.macaco },
                    { label: "Buzina", val: checklistDetail.buzina },
                    { label: "Documentação", val: checklistDetail.documentacao },
                    { label: "Cartão Abastecimento", val: checklistDetail.cartaoAbastecimento },
                  ].map((item) => {
                    const isPositive =
                      item.val === true ||
                      item.val === "Sim" ||
                      item.val === "Bom";
                    const displayStatus =
                      typeof item.val === "boolean"
                        ? item.val
                          ? "Sim"
                          : "Não"
                        : item.val || "Não informado";

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-card/60 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isPositive ? (
                            <CheckCircle2Icon className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-medium text-xs sm:text-sm truncate" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                        <Badge
                          variant={isPositive ? "outline" : "destructive"}
                          className={`text-xs font-semibold shrink-0 uppercase ${isPositive ? "border-green-600/30 text-green-700 bg-green-500/10" : ""
                            }`}
                        >
                          {displayStatus}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1. Galeria de Fotos de Saída */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  1. Registro Fotográfico de Saída (Início do Turno)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { label: "Frente (Saída)", url: checklistDetail.photoUrls?.frente },
                    { label: "Lado Esquerdo (Saída)", url: checklistDetail.photoUrls?.ladoEsquerdo },
                    { label: "Lado Direito (Saída)", url: checklistDetail.photoUrls?.ladoDireito },
                    { label: "Traseira (Saída)", url: checklistDetail.photoUrls?.tras },
                    { label: "Foto Painel (Saída)", url: checklistDetail.photoUrls?.interna },
                    { label: "Carroceria (Saída)", url: checklistDetail.photoUrls?.carroceria },
                  ].map((foto) => (
                    <div
                      key={foto.label}
                      className="rounded-xl border overflow-hidden bg-card flex flex-col shadow-xs"
                    >
                      <div className="px-3 py-2 text-xs font-bold flex items-center justify-between bg-muted/50 border-b">
                        <span>{foto.label}</span>
                        {foto.url && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                            <ExternalLinkIcon className="w-3 h-3" /> Clique para ampliar
                          </span>
                        )}
                      </div>
                      <div className="relative h-40 w-full flex items-center justify-center bg-muted/20">
                        {foto.url ? (
                          <a
                            href={foto.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-full h-full block group overflow-hidden"
                            title={`Ver foto ${foto.label} em tamanho real`}
                          >
                            <Image
                              src={foto.url}
                              alt={foto.label}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="bg-black/75 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs font-medium">
                                <ExternalLinkIcon className="w-3 h-3" /> Ampliar
                              </span>
                            </div>
                          </a>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60 p-4 text-center">
                            <ImageIcon className="w-7 h-7 stroke-1" />
                            <span className="text-xs italic">Sem foto de saída</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Galeria de Fotos de Retorno (Pós-Atividades) */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <CameraIcon className="w-4 h-4 text-green-600" />
                  2. Registro Fotográfico de Retorno (Pós-Atividades)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { label: "Frente (Retorno)", url: checklistDetail.photoFimUrls?.frente },
                    { label: "Lado Esquerdo (Retorno)", url: checklistDetail.photoFimUrls?.ladoEsquerdo },
                    { label: "Lado Direito (Retorno)", url: checklistDetail.photoFimUrls?.ladoDireito },
                    { label: "Traseira (Retorno)", url: checklistDetail.photoFimUrls?.tras },
                    { label: "Foto Painel (Retorno)", url: checklistDetail.photoFimUrls?.interna },
                    { label: "Carroceria (Retorno)", url: checklistDetail.photoFimUrls?.carroceria },
                  ].map((foto) => (
                    <div
                      key={foto.label}
                      className="rounded-xl border overflow-hidden bg-card flex flex-col shadow-xs border-green-500/30"
                    >
                      <div className="px-3 py-2 text-xs font-bold flex items-center justify-between bg-green-500/10 border-b border-green-500/20 text-green-900 dark:text-green-200">
                        <span>{foto.label}</span>
                        {foto.url && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                            <ExternalLinkIcon className="w-3 h-3" /> Clique para ampliar
                          </span>
                        )}
                      </div>
                      <div className="relative h-40 w-full flex items-center justify-center bg-muted/20">
                        {foto.url ? (
                          <a
                            href={foto.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-full h-full block group overflow-hidden"
                            title={`Ver foto ${foto.label} em tamanho real`}
                          >
                            <Image
                              src={foto.url}
                              alt={foto.label}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="bg-black/75 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs font-medium">
                                <ExternalLinkIcon className="w-3 h-3" /> Ampliar
                              </span>
                            </div>
                          </a>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60 p-4 text-center">
                            <CameraIcon className="w-7 h-7 stroke-1" />
                            <span className="text-xs italic">Ainda não enviada (em rota)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Excluir Checklist no Modal */}
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Checklist registrado no sistema • <span className="font-mono">{checklistDetail.veiculoPlaca}</span>
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial flex items-center gap-1"
                    onClick={handlePrintChecklist}
                  >
                    <PrinterIcon className="w-4 h-4 mr-1" />
                    Imprimir Checklist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40 flex-1 sm:flex-initial"
                    onClick={() => setChecklistToDelete(checklistDetail)}
                  >
                    <Trash2Icon className="w-4 h-4 mr-1" />
                    Excluir este Checklist
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE MANUTENÇÃO DO VEÍCULO */}
      <Dialog
        open={!!selectedMaintenanceVehicle}
        onOpenChange={(open) => !open && setSelectedMaintenanceVehicle(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Próxima Manutenção</DialogTitle>
            <DialogDescription>
              Defina o limite de KM para a próxima revisão do veículo{" "}
              <strong>{selectedMaintenanceVehicle?.placa}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quilometragem Atual (KM)</Label>
                {selectedMaintenanceVehicle && (selectedMaintenanceVehicle.kmAtual || 0) > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await resetKm({ id: selectedMaintenanceVehicle._id });
                        setSelectedMaintenanceVehicle((prev: any) =>
                          prev ? { ...prev, kmAtual: 0 } : null
                        );
                        toast({
                          title: "Quilometragem Zerada!",
                          description: `KM do veículo ${selectedMaintenanceVehicle.placa} foi redefinido para 0 km.`,
                        });
                      } catch (error) {
                        console.error(error);
                        toast({
                          title: "Erro ao zerar KM",
                          description: "Não foi possível zerar a quilometragem.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcwIcon className="w-3 h-3" />
                    Zerar KM agora
                  </button>
                )}
              </div>
              <Input
                value={
                  selectedMaintenanceVehicle?.kmAtual !== undefined && selectedMaintenanceVehicle?.kmAtual !== null
                    ? `${selectedMaintenanceVehicle.kmAtual.toLocaleString()} km`
                    : "0 km (Não informado)"
                }
                disabled
                className="bg-muted/40 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Avisar manutenção em (KM)</Label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={newProximaManutencao}
                onChange={(e) => setNewProximaManutencao(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para remover o aviso.
              </p>
            </div>
            <Button
              className="w-full bg-primary text-black font-bold"
              onClick={async () => {
                try {
                  const val = newProximaManutencao ? parseInt(newProximaManutencao) : undefined;
                  await updateManutencao({
                    id: selectedMaintenanceVehicle._id,
                    proximaManutencaoKm: val,
                  });
                  toast({
                    title: "Sucesso",
                    description: "Regra de manutenção atualizada.",
                  });
                  setSelectedMaintenanceVehicle(null);
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: "Não foi possível atualizar.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE ZERAR KM DO VEÍCULO */}
      <Dialog
        open={!!vehicleToResetKm}
        onOpenChange={(open) => !open && !isResettingKm && setVehicleToResetKm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold">
              <RotateCcwIcon className="w-5 h-5 text-amber-600" />
              Zerar Quilometragem
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja zerar a quilometragem do veículo{" "}
              <strong className="font-mono text-foreground font-semibold">
                {vehicleToResetKm?.placa}
              </strong>
              {vehicleToResetKm?.modelo ? ` (${vehicleToResetKm.modelo})` : ""}?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
              Aviso de Redefinição
            </div>
            <div>
              Quilometragem atual registrada:{" "}
              <strong>
                {vehicleToResetKm?.kmAtual !== undefined && vehicleToResetKm?.kmAtual !== null
                  ? `${vehicleToResetKm.kmAtual.toLocaleString()} km`
                  : "0 km"}
              </strong>
              .
            </div>
            <div>
              Após confirmar, o valor do KM atual será alterado para <strong>0 km</strong> na frota.
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isResettingKm}
              onClick={() => setVehicleToResetKm(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isResettingKm}
              onClick={handleResetKm}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isResettingKm ? "Zerando..." : "Sim, Zerar Quilometragem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO COMPLETA DE VEÍCULO */}
      <Dialog
        open={!!editingVehicle}
        onOpenChange={(open) => !open && !isUpdatingVehicle && setEditingVehicle(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilIcon className="w-5 h-5 text-primary" />
              Editar Veículo
            </DialogTitle>
            <DialogDescription>
              Altere as informações cadastrais do veículo{" "}
              <strong className="font-mono">{editingVehicle?.placa}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-placa">Placa do Carro *</Label>
                <Input
                  id="edit-placa"
                  placeholder="Ex: ABC-1234"
                  value={editPlaca}
                  onChange={(e) => setEditPlaca(e.target.value)}
                  className="font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tag">TAG / Frota (Opcional)</Label>
                <Input
                  id="edit-tag"
                  placeholder="Ex: 1, 12, 35"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-modelo">Modelo / Nome do Veículo *</Label>
              <Input
                id="edit-modelo"
                placeholder="Ex: Fiorino Branca 2023"
                value={editModelo}
                onChange={(e) => setEditModelo(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-filial">Filial / Centro de Operação</Label>
                <Select value={editFilial} onValueChange={(val) => val && setEditFilial(val)}>
                  <SelectTrigger id="edit-filial">
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sul">Sul</SelectItem>
                    <SelectItem value="Leste">Leste</SelectItem>
                    <SelectItem value="Matriz">Matriz</SelectItem>
                    <SelectItem value="T.I">T.I</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status do Veículo</Label>
                <Select
                  value={editStatus}
                  onValueChange={(val: "ATIVO" | "MANUTENCAO") => val && setEditStatus(val)}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">ATIVO (Disponível)</SelectItem>
                    <SelectItem value="MANUTENCAO">MANUTENÇÃO (Indisponível)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-km">KM Atual</Label>
                  <button
                    type="button"
                    onClick={() => setEditKmAtual("0")}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcwIcon className="w-3 h-3" />
                    Zerar para 0
                  </button>
                </div>
                <Input
                  id="edit-km"
                  type="number"
                  placeholder="Ex: 45000"
                  value={editKmAtual}
                  onChange={(e) => setEditKmAtual(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-manutencao">Próx. Manutenção (KM)</Label>
                <Input
                  id="edit-manutencao"
                  type="number"
                  placeholder="Ex: 50000"
                  value={editProximaManutencao}
                  onChange={(e) => setEditProximaManutencao(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingVehicle}
                onClick={() => setEditingVehicle(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-primary text-black font-bold"
                disabled={isUpdatingVehicle}
                onClick={handleSaveEditVehicle}
              >
                {isUpdatingVehicle ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ALTERAÇÃO DE FILIAL E DESCRIÇÃO DO OPEC */}
      <Dialog
        open={!!editingOpec}
        onOpenChange={(open) => !open && !isUpdatingOpec && setEditingOpec(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SmartphoneIcon className="w-5 h-5 text-primary" />
              Editar Aparelho OPEC
            </DialogTitle>
            <DialogDescription>
              Defina a filial e a descrição do aparelho{" "}
              <strong className="font-mono">{editingOpec?.codigo}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-opec-codigo">Código / Identificador</Label>
              <Input
                id="edit-opec-codigo"
                placeholder="Ex: OPEC 01"
                value={editOpecCodigo}
                onChange={(e) => setEditOpecCodigo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-opec-descricao">Modelo / Descrição</Label>
              <Input
                id="edit-opec-descricao"
                placeholder="Ex: Samsung Galaxy A14, Motorola G54"
                value={editOpecDescricao}
                onChange={(e) => setEditOpecDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-opec-filial">Filial / Centro de Operação</Label>
              <Select value={editOpecFilialValue} onValueChange={(val) => val && setEditOpecFilialValue(val)}>
                <SelectTrigger id="edit-opec-filial">
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matriz">Matriz</SelectItem>
                  <SelectItem value="Sul">Sul</SelectItem>
                  <SelectItem value="Leste">Leste</SelectItem>
                  <SelectItem value="T.I">T.I</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingOpec}
                onClick={() => setEditingOpec(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-primary text-black font-bold"
                disabled={isUpdatingOpec}
                onClick={handleUpdateOpec}
              >
                {isUpdatingOpec ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE OPEC INDIVIDUAL */}
      <Dialog
        open={!!opecToDelete}
        onOpenChange={(open) => !open && !isDeletingOpec && setOpecToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Excluir Aparelho OPEC
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja excluir o aparelho{" "}
              <strong className="text-foreground font-semibold">{opecToDelete?.codigo}</strong> (
              <span className="text-muted-foreground">{opecToDelete?.descricao || "Sem descrição"}</span>) da filial{" "}
              <strong>{opecToDelete?.centroOperacao || "Sem Filial"}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingOpec}
              onClick={() => setOpecToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingOpec}
              onClick={handleDeleteOpec}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingOpec ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TODOS OS OPECS */}
      <Dialog
        open={isDeletingAllOpecsOpen}
        onOpenChange={(open) => !open && !isDeletingAllOpecs && setIsDeletingAllOpecsOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Apagar Todos os OPECs
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja apagar <strong className="text-foreground font-semibold">TODOS os {opecs?.length || 0} aparelhos OPEC</strong> cadastrados?
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg leading-relaxed">
            Atenção: Esta ação removerá todos os celulares corporativos cadastrados. Você poderá re-inicializar a lista padrão da Matriz a qualquer momento.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingAllOpecs}
              onClick={() => setIsDeletingAllOpecsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingAllOpecs}
              onClick={handleDeleteAllOpecs}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingAllOpecs ? "Excluindo..." : "Sim, Apagar Todos os OPECs"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CHECKLIST */}
      <Dialog
        open={!!checklistToDelete}
        onOpenChange={(open) => !open && !isDeletingChecklist && setChecklistToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Excluir Checklist
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja excluir o checklist do veículo{" "}
              <strong className="text-foreground font-semibold font-mono">{checklistToDelete?.veiculoPlaca}</strong> realizado por{" "}
              <strong className="text-foreground font-semibold">{checklistToDelete?.tecnicoNome}</strong> em{" "}
              <span className="font-semibold">{checklistToDelete?.data} às {checklistToDelete?.hora}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg leading-relaxed">
            Atenção: Esta ação é irreversível. O registro do checklist e todas as fotos associadas serão excluídos permanentemente.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingChecklist}
              onClick={() => setChecklistToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingChecklist}
              onClick={handleDeleteChecklist}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingChecklist ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TODOS OS VEÍCULOS */}
      <Dialog
        open={isDeletingAllVehiclesOpen}
        onOpenChange={(open) => !open && !isDeletingAllVehicles && setIsDeletingAllVehiclesOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Apagar Todos os Veículos
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja apagar <strong className="text-foreground font-semibold">TODOS os {vehicles?.length || 0} veículos</strong> cadastrados na frota?
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg leading-relaxed">
            Atenção: Esta ação é irreversível e removerá permanentemente todos os registros de placas e modelos da lista de veículos da frota.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingAllVehicles}
              onClick={() => setIsDeletingAllVehiclesOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingAllVehicles}
              onClick={handleDeleteAllVehicles}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingAllVehicles ? "Excluindo..." : "Sim, Apagar Todos os Carros"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE VEÍCULO INDIVIDUAL */}
      <Dialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => !open && !isDeletingVehicle && setVehicleToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Excluir Veículo
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja excluir o veículo{" "}
              <strong className="text-foreground font-semibold font-mono">{vehicleToDelete?.placa}</strong> (
              <span className="text-muted-foreground">{vehicleToDelete?.modelo}</span>)?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingVehicle}
              onClick={() => setVehicleToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingVehicle}
              onClick={handleDeleteVehicle}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingVehicle ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && !isDeletingUser && setUserToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Excluir Usuário / Técnico
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja excluir o usuário{" "}
              <strong className="text-foreground font-semibold">{userToDelete?.name}</strong> (
              <span className="font-mono text-xs text-muted-foreground">{userToDelete?.email}</span>)?
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border leading-relaxed">
            Esta ação removerá o usuário da lista da equipe. Caso o usuário faça login novamente com sua conta corporativa, ele será re-sincronizado automaticamente como Técnico.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingUser}
              onClick={() => setUserToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingUser}
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingUser ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* MODAL DE REATIVAÇÃO DE VEÍCULO COM REGISTRO OBRIGATÓRIO DE MANUTENÇÃO */}
      <Dialog
        open={!!vehicleToReactivate}
        onOpenChange={(open) => !open && !isReactivating && setVehicleToReactivate(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              <CheckCircle2Icon className="w-6 h-6 text-emerald-600" />
              Reativar Veículo & Registrar Manutenção
            </DialogTitle>
            <DialogDescription className="text-sm">
              Veículo: <strong className="font-mono text-foreground font-bold">{vehicleToReactivate?.placa}</strong>
              {vehicleToReactivate?.tag && (
                <Badge className="ml-2 bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40 text-[11px] font-bold">
                  TAG {vehicleToReactivate.tag}
                </Badge>
              )}
              {vehicleToReactivate?.modelo && ` • ${vehicleToReactivate.modelo}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <InfoIcon className="w-4 h-4 shrink-0" />
                Registro Obrigatório de Serviços
              </div>
              <p className="leading-relaxed">
                Ao reativar o veículo na frota, descreva com detalhes o que foi consertado, revisado ou trocado. Este registro ficará salvo permanentemente no histórico do carro e será incluído nos relatórios oficiais.
              </p>
            </div>

            {/* O que foi feito no carro (OBRIGATÓRIO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reactivate-desc" className="font-bold flex items-center gap-1">
                  O que foi feito no carro? <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground font-medium">Obrigatório</span>
              </div>
              <textarea
                id="reactivate-desc"
                required
                rows={3}
                placeholder="Ex: Troca de pastilhas e discos de freio dianteiros, troca de óleo 5W30 e filtros de ar/combustível, alinhamento e balanceamento..."
                value={reactivateDescricao}
                onChange={(e) => setReactivateDescricao(e.target.value)}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>

            {/* Grid: Tipo de Manutenção e Data de Reativação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reactivate-tipo">Tipo de Manutenção</Label>
                <Select value={reactivateTipo} onValueChange={(val) => val && setReactivateTipo(val)}>
                  <SelectTrigger id="reactivate-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVA">Preventiva / Revisão Geral</SelectItem>
                    <SelectItem value="CORRETIVA">Corretiva (Reparo de Quebra/Falha)</SelectItem>
                    <SelectItem value="PNEUS">Pneus / Geometria / Balanceamento</SelectItem>
                    <SelectItem value="ELETRICA">Elétrica / Bateria / Alternador</SelectItem>
                    <SelectItem value="FUNILARIA">Funilaria / Pintura / Vidros</SelectItem>
                    <SelectItem value="OUTRO">Outros Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reactivate-data">Data da Reativação / Conclusão</Label>
                <Input
                  id="reactivate-data"
                  type="date"
                  value={reactivateData}
                  onChange={(e) => setReactivateData(e.target.value)}
                />
              </div>
            </div>

            {/* Grid: KM no Momento e Próxima Manutenção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reactivate-km">KM no Momento da Manutenção</Label>
                <Input
                  id="reactivate-km"
                  type="number"
                  placeholder="Ex: 48500"
                  value={reactivateKm}
                  onChange={(e) => {
                    const kmVal = e.target.value;
                    setReactivateKm(kmVal);
                    if (kmVal && !isNaN(parseInt(kmVal))) {
                      const num = parseInt(kmVal);
                      const mod = (vehicleToReactivate?.modelo || "").toUpperCase();
                      const add = mod.includes("MASTER") || mod.includes("DUCATO") ? 20000 : 10000;
                      setReactivateProximaManutencao((num + add).toString());
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reactivate-prox-km">Próx. Manutenção (KM)</Label>
                  {reactivateKm && !isNaN(parseInt(reactivateKm)) && (
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(reactivateKm) || 0;
                        setReactivateProximaManutencao((num + 10000).toString());
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      +10.000 km
                    </button>
                  )}
                </div>
                <Input
                  id="reactivate-prox-km"
                  type="number"
                  placeholder="Ex: 58500"
                  value={reactivateProximaManutencao}
                  onChange={(e) => setReactivateProximaManutencao(e.target.value)}
                />
              </div>
            </div>

            {/* Grid: Oficina e Custo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reactivate-oficina">Oficina / Mecânica / Prestador (Opcional)</Label>
                <Input
                  id="reactivate-oficina"
                  placeholder="Ex: Oficina Central, Concessionária"
                  value={reactivateOficina}
                  onChange={(e) => setReactivateOficina(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reactivate-custo">Custo / Valor Total em R$ (Opcional)</Label>
                <Input
                  id="reactivate-custo"
                  type="text"
                  placeholder="Ex: 450,00"
                  value={reactivateCusto}
                  onChange={(e) => setReactivateCusto(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={isReactivating}
                onClick={() => setVehicleToReactivate(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isReactivating}
                onClick={handleConfirmReactivate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isReactivating ? (
                  "Reativando..."
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-1.5" />
                    Salvar e Reativar Veículo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE COLOCAR VEÍCULO EM MANUTENÇÃO */}
      <Dialog
        open={!!vehicleToEnterMaintenance}
        onOpenChange={(open) => !open && !isEnteringMaintenance && setVehicleToEnterMaintenance(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
              <WrenchIcon className="w-5 h-5 text-amber-600" />
              Colocar Veículo em Manutenção
            </DialogTitle>
            <DialogDescription className="text-sm">
              Veículo: <strong className="font-mono text-foreground">{vehicleToEnterMaintenance?.placa}</strong>
              {vehicleToEnterMaintenance?.tag && ` (TAG ${vehicleToEnterMaintenance.tag})`}
              {vehicleToEnterMaintenance?.modelo && ` • ${vehicleToEnterMaintenance.modelo}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                Aviso de Status
              </div>
              <p>
                Ao marcar como manutenção, este veículo ficará bloqueado para novos checklists de saída. Quando o serviço for finalizado, você precisará informar o que foi feito para reativá-lo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enter-motivo">Motivo / Problema Relatado (Opcional)</Label>
              <textarea
                id="enter-motivo"
                rows={3}
                placeholder="Ex: Barulho no sistema de freio, revisão preventiva dos 30.000km, luz de advertência no painel..."
                value={enterMaintenanceMotivo}
                onChange={(e) => setEnterMaintenanceMotivo(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enter-data">Data de Entrada</Label>
              <Input
                id="enter-data"
                type="date"
                value={enterMaintenanceData}
                onChange={(e) => setEnterMaintenanceData(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={isEnteringMaintenance}
                onClick={() => setVehicleToEnterMaintenance(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isEnteringMaintenance}
                onClick={handleConfirmEnterMaintenance}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isEnteringMaintenance ? "Atualizando..." : "Confirmar Manutenção"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE HISTÓRICO DE MANUTENÇÃO POR VEÍCULO */}
      <Dialog
        open={!!vehicleToViewHistory}
        onOpenChange={(open) => !open && setVehicleToViewHistory(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <HistoryIcon className="w-5 h-5 text-primary" />
              Histórico de Manutenções do Veículo
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap pt-1">
              <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border">
                {vehicleToViewHistory?.placa}
              </span>
              {vehicleToViewHistory?.tag && (
                <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40 text-xs font-bold">
                  TAG {vehicleToViewHistory.tag}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {vehicleToViewHistory?.modelo} • Filial: {vehicleToViewHistory?.centroOperacao || "Sem Filial"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {(() => {
              const vehicleRecords = (maintenances || []).filter(
                (m) =>
                  m.vehicleId === vehicleToViewHistory?._id ||
                  (m.placa || "").toUpperCase() === (vehicleToViewHistory?.placa || "").toUpperCase()
              );

              if (vehicleRecords.length === 0) {
                return (
                  <div className="py-12 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <WrenchIcon className="w-10 h-10 stroke-1 text-muted-foreground/60" />
                    <p className="font-semibold text-foreground">Nenhuma manutenção registrada para este veículo.</p>
                    <p className="text-xs max-w-sm">
                      Quando este carro for colocado em manutenção e posteriormente reativado, o histórico completo de serviços aparecerá aqui.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground flex items-center justify-between border-b pb-2">
                    <span><strong>{vehicleRecords.length}</strong> registro(s) de manutenção encontrados</span>
                    <span>KM Atual: <strong>{vehicleToViewHistory?.kmAtual ? `${vehicleToViewHistory.kmAtual.toLocaleString()} km` : "N/I"}</strong></span>
                  </div>

                  <div className="space-y-3">
                    {vehicleRecords.map((rec, idx) => {
                      let dataReativadaStr = rec.dataReativacao;
                      if (dataReativadaStr && dataReativadaStr.includes("-")) {
                        const p = dataReativadaStr.split("-");
                        if (p.length === 3) dataReativadaStr = `${p[2]}/${p[1]}/${p[0]}`;
                      }

                      let dataEntradaStr = rec.dataEntrada;
                      if (dataEntradaStr && dataEntradaStr.includes("-")) {
                        const p = dataEntradaStr.split("-");
                        if (p.length === 3) dataEntradaStr = `${p[2]}/${p[1]}/${p[0]}`;
                      }

                      return (
                        <div
                          key={rec._id || idx}
                          className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-black font-bold text-xs">
                                {dataReativadaStr}
                              </Badge>
                              {rec.horaReativacao && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                  <ClockIcon className="w-3 h-3" />
                                  {rec.horaReativacao}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[11px] font-bold">
                                {rec.tipoManutencao || "PREVENTIVA"}
                              </Badge>
                            </div>

                            {rec.kmManutencao !== undefined && rec.kmManutencao !== null && (
                              <div className="text-xs font-mono font-semibold text-foreground">
                                KM na Manutenção: {rec.kmManutencao.toLocaleString()} km
                              </div>
                            )}
                          </div>

                          {/* O que foi feito */}
                          <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
                            <div className="font-semibold text-foreground flex items-center gap-1.5 text-primary">
                              <FileTextIcon className="w-3.5 h-3.5" />
                              Serviços Executados no Carro:
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-foreground font-medium pl-5">
                              {rec.descricaoServico}
                            </div>
                          </div>

                          {/* Metadados: Motivo, Oficina, Custo, Líder */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                            {rec.motivoEntrada && (
                              <div>
                                <span className="font-semibold text-foreground">Motivo entrada:</span>{" "}
                                {rec.motivoEntrada}
                              </div>
                            )}
                            {dataEntradaStr && dataEntradaStr !== dataReativadaStr && (
                              <div>
                                <span className="font-semibold text-foreground">Entrada em:</span>{" "}
                                {dataEntradaStr}
                              </div>
                            )}
                            {rec.oficina && (
                              <div>
                                <span className="font-semibold text-foreground">Oficina:</span>{" "}
                                {rec.oficina}
                              </div>
                            )}
                            {rec.custo !== undefined && rec.custo !== null && rec.custo > 0 && (
                              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Custo: R$ {rec.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-foreground">Líder:</span>{" "}
                              {rec.realizadoPorNome}
                            </div>
                            {rec.proximaRevisaoKm && (
                              <div>
                                <span className="font-semibold text-foreground">Próx. Revisão:</span>{" "}
                                {rec.proximaRevisaoKm.toLocaleString()} km
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVehicleToViewHistory(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE REGISTRO DE MANUTENÇÃO */}
      <Dialog
        open={!!maintenanceToDelete}
        onOpenChange={(open) => !open && !isDeletingMaintenance && setMaintenanceToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
              <Trash2Icon className="w-5 h-5 text-red-600" />
              Excluir Registro de Manutenção
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/85 text-sm">
              Tem certeza que deseja excluir o histórico de manutenção do veículo{" "}
              <strong className="text-foreground font-semibold font-mono">{maintenanceToDelete?.placa}</strong> registrado em{" "}
              <strong>{maintenanceToDelete?.dataReativacao}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg leading-relaxed">
            Atenção: Esta ação removerá este registro do histórico de manutenções e dos relatórios futuros.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingMaintenance}
              onClick={() => setMaintenanceToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingMaintenance}
              onClick={handleDeleteMaintenance}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeletingMaintenance ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


