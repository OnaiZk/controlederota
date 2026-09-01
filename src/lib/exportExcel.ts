import ExcelJS from "exceljs";

export interface ChecklistExportData {
  _id: string;
  data: string;
  hora: string;
  centroOperacao: string;
  tecnicoNome: string;
  tecnicoEmail: string;
  opec?: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  kmInicial: number;
  kmFinal?: number | null;
  nivelOleo: string;
  nivelAgua: string;
  nivelCombustivel: string;
  estepe: string | boolean;
  triangulo: string | boolean;
  chaveRoda: string | boolean;
  faroisLanternas: string | boolean;
  macaco: string | boolean;
  buzina: string | boolean;
  documentacao: string | boolean;
  cartaoAbastecimento: string | boolean;
}

export interface VehicleExportData {
  _id: string;
  placa: string;
  modelo: string;
  tag?: string;
  status: string;
  centroOperacao?: string;
  kmAtual?: number;
  proximaManutencaoKm?: number;
  dataEntradaManutencao?: string;
  horaEntradaManutencao?: string;
  motivoManutencao?: string;
  ultimaManutencaoData?: string;
  ultimaManutencaoDescricao?: string;
}

export interface MaintenanceExportData {
  _id: string;
  placa: string;
  modelo?: string;
  tag?: string;
  centroOperacao?: string;
  dataEntrada?: string;
  horaEntrada?: string;
  dataReativacao: string;
  horaReativacao?: string;
  kmManutencao?: number;
  motivoEntrada?: string;
  descricaoServico: string;
  tipoManutencao?: string;
  oficina?: string;
  proximaRevisaoKm?: number;
  realizadoPorNome: string;
  realizadoPorEmail?: string;
  status?: string;
  criadoEm?: number;
}

export async function exportConsolidatedExcel(
  checklists: ChecklistExportData[],
  vehicles?: VehicleExportData[],
  maintenancesOrOptions?: MaintenanceExportData[] | { filterDate?: string },
  optionsParam?: { filterDate?: string }
) {
  let maintenances: MaintenanceExportData[] | undefined;
  let options: { filterDate?: string } | undefined;

  if (Array.isArray(maintenancesOrOptions)) {
    maintenances = maintenancesOrOptions;
    options = optionsParam;
  } else {
    options = maintenancesOrOptions;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Eletromidia Frota";
  workbook.created = new Date();

  // Cores institucionais oficiais da Eletromidia
  const COLOR_ORANGE = "FFFF4F00"; // #FF4F00 - Laranja Marca
  const COLOR_DARK = "FF1E1E1E";   // #1E1E1E - Preto/Grafite Marca
  const COLOR_WHITE = "FFFFFFFF";  // #FFFFFF
  const COLOR_LIGHT_ZEBRA = "FFFFF7F2"; // Laranja suave para linhas alternadas
  const COLOR_BORDER = "FFD1D5DB"; // Cinza borda
  const COLOR_HEADER_MUTED = "FFF3F4F6"; // Cinza claro

  // Cores de Status
  const COLOR_GREEN_FILL = "FFE6F4EA";
  const COLOR_GREEN_TEXT = "FF137333";
  const COLOR_RED_FILL = "FFFCE8E6";
  const COLOR_RED_TEXT = "FFC5221F";
  const COLOR_YELLOW_FILL = "FFFEF7E0";
  const COLOR_YELLOW_TEXT = "FFB06000";

  // Ordena checklists por data mais recente e hora
  const sortedChecklists = [...checklists].sort((a, b) => {
    const dateComp = (b.data || "").localeCompare(a.data || "");
    if (dateComp !== 0) return dateComp;
    return (b.hora || "").localeCompare(a.hora || "");
  });

  // Ordena manutenções por data de reativação mais recente
  const sortedMaintenances = maintenances
    ? [...maintenances].sort((a, b) => {
        const dateComp = (b.dataReativacao || "").localeCompare(a.dataReativacao || "");
        if (dateComp !== 0) return dateComp;
        return (b.criadoEm || 0) - (a.criadoEm || 0);
      })
    : [];

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return "-";
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  // ==========================================
  // ABA 1: RELATÓRIO CONSOLIDADO GERAL (CHECKLISTS)
  // ==========================================
  const wsMain = workbook.addWorksheet("Consolidado Geral", {
    views: [{ showGridLines: true }],
  });

  wsMain.columns = [
    { key: "data", width: 14 },
    { key: "hora", width: 10 },
    { key: "centroOperacao", width: 22 },
    { key: "tecnicoNome", width: 26 },
    { key: "tecnicoEmail", width: 32 },
    { key: "opec", width: 16 },
    { key: "veiculoPlaca", width: 15 },
    { key: "veiculoModelo", width: 24 },
    { key: "kmInicial", width: 14 },
    { key: "kmFinal", width: 14 },
    { key: "kmRodados", width: 16 },
    { key: "nivelCombustivel", width: 20 },
    { key: "nivelOleo", width: 14 },
    { key: "nivelAgua", width: 14 },
    { key: "estepe", width: 12 },
    { key: "triangulo", width: 12 },
    { key: "chaveRoda", width: 14 },
    { key: "faroisLanternas", width: 18 },
    { key: "macaco", width: 12 },
    { key: "buzina", width: 12 },
    { key: "documentacao", width: 15 },
    { key: "cartaoAbastecimento", width: 20 },
  ];

  // 1. Banner Principal (Linhas 1 e 2)
  wsMain.mergeCells("A1:V1");
  const titleCell = wsMain.getCell("A1");
  titleCell.value = "ELETROMIDIA  |  SISTEMA DE CONTROLE DE FROTA";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: COLOR_WHITE } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsMain.getRow(1).height = 36;

  wsMain.mergeCells("A2:V2");
  const subtitleCell = wsMain.getCell("A2");
  const isFiltered = !!options?.filterDate;
  subtitleCell.value = isFiltered
    ? `RELATÓRIO DE CHECKLISTS - DATA: ${options?.filterDate}`
    : "RELATÓRIO CONSOLIDADO COMPLETO (TODOS OS DIAS)";
  subtitleCell.font = { name: "Arial", size: 11, bold: true, color: { argb: COLOR_WHITE } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsMain.getRow(2).height = 24;

  // 2. Linha de Métricas / Resumo Rápido (Linha 3)
  const totalKmCalculado = sortedChecklists.reduce((acc, curr) => {
    if (curr.kmFinal && curr.kmFinal >= curr.kmInicial) {
      return acc + (curr.kmFinal - curr.kmInicial);
    }
    return acc;
  }, 0);
  const totalVeiculosUnicos = new Set(sortedChecklists.map((c) => c.veiculoPlaca)).size;
  const totalTecnicosUnicos = new Set(sortedChecklists.map((c) => c.tecnicoNome)).size;
  const dataHojeStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  wsMain.mergeCells("A3:V3");
  const kpiCell = wsMain.getCell("A3");
  kpiCell.value = `Emissão: ${dataHojeStr}  |  Total de Checklists: ${sortedChecklists.length}  |  Veículos Atendidos: ${totalVeiculosUnicos}  |  Técnicos: ${totalTecnicosUnicos}  |  Total KM Rodados: ${totalKmCalculado.toLocaleString("pt-BR")} km`;
  kpiCell.font = { name: "Arial", size: 10, italic: true, bold: true, color: { argb: COLOR_DARK } };
  kpiCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_MUTED } };
  kpiCell.alignment = { horizontal: "center", vertical: "middle" };
  wsMain.getRow(3).height = 22;

  wsMain.getRow(4).height = 10;

  // 3. Cabeçalho da Tabela de Dados (Linha 5)
  const headers = [
    "DATA",
    "HORA",
    "CENTRO OPERAÇÃO",
    "TÉCNICO",
    "E-MAIL",
    "OPEC (CELULAR)",
    "PLACA",
    "MODELO",
    "KM INICIAL",
    "KM FINAL",
    "KM RODADOS",
    "NÍVEL COMBUSTÍVEL",
    "ÓLEO",
    "ÁGUA",
    "ESTEPE",
    "TRIÂNGULO",
    "CHAVE RODA",
    "FARÓIS / LUZES",
    "MACACO",
    "BUZINA",
    "DOCUMENTAÇÃO",
    "CARTÃO ABAST.",
  ];

  const headerRow = wsMain.getRow(5);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_DARK } },
      bottom: { style: "medium", color: { argb: COLOR_DARK } },
      left: { style: "thin", color: { argb: COLOR_WHITE } },
      right: { style: "thin", color: { argb: COLOR_WHITE } },
    };
  });

  const formatBooleanStatus = (val: string | boolean | undefined) => {
    if (val === true || val === "Sim" || val === "SIM") return "SIM";
    if (val === false || val === "Não" || val === "NAO" || val === "Nao") return "NÃO";
    if (val === "Bom" || val === "BOM") return "OK";
    if (val === "Ruim" || val === "RUIM") return "RUIM";
    return val ? String(val).toUpperCase() : "-";
  };

  let currentRowIndex = 6;
  sortedChecklists.forEach((c, index) => {
    const row = wsMain.getRow(currentRowIndex);
    row.height = 22;
    const isZebra = index % 2 === 1;
    const baseFillColor = isZebra ? COLOR_LIGHT_ZEBRA : COLOR_WHITE;

    const kmDiff =
      c.kmFinal !== undefined && c.kmFinal !== null && c.kmFinal >= c.kmInicial
        ? c.kmFinal - c.kmInicial
        : null;

    const dataFormatada = formatDateStr(c.data);

    const rowValues = [
      dataFormatada,
      c.hora || "-",
      c.centroOperacao || "-",
      c.tecnicoNome || "-",
      c.tecnicoEmail || "-",
      c.opec || "-",
      (c.veiculoPlaca || "").toUpperCase(),
      c.veiculoModelo || "-",
      c.kmInicial || 0,
      c.kmFinal !== undefined && c.kmFinal !== null ? c.kmFinal : "-",
      kmDiff !== null ? kmDiff : "-",
      c.nivelCombustivel || "-",
      formatBooleanStatus(c.nivelOleo),
      formatBooleanStatus(c.nivelAgua),
      formatBooleanStatus(c.estepe),
      formatBooleanStatus(c.triangulo),
      formatBooleanStatus(c.chaveRoda),
      formatBooleanStatus(c.faroisLanternas),
      formatBooleanStatus(c.macaco),
      formatBooleanStatus(c.buzina),
      formatBooleanStatus(c.documentacao),
      formatBooleanStatus(c.cartaoAbastecimento),
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 10, color: { argb: COLOR_DARK } };

      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };

      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseFillColor } };

      const colNum = colIdx + 1;

      if (colNum === 1 || colNum === 2 || colNum === 6 || colNum === 7) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNum === 7) {
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_DARK } };
        }
      } else if (colNum === 3) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNum === 4 || colNum === 5 || colNum === 8) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (colNum === 9 || colNum === 10 || colNum === 11) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (typeof val === "number") {
          cell.numFmt = '#,##0 "km"';
          if (colNum === 11) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_GREEN_TEXT } };
          }
        }
      } else if (colNum === 12) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.numFmt = "@";
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        const upperVal = String(val).toUpperCase();
        if (upperVal === "SIM" || upperVal === "OK" || upperVal === "BOM") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GREEN_FILL } };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_GREEN_TEXT } };
        } else if (upperVal === "NÃO" || upperVal === "NAO" || upperVal === "RUIM" || upperVal === "BAIXO") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_RED_FILL } };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_RED_TEXT } };
        } else if (upperVal === "MÉDIO" || upperVal === "MEDIO") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_YELLOW_FILL } };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_YELLOW_TEXT } };
        }
      }
    });

    currentRowIndex++;
  });

  // 5. Linha de Totalizador
  const totalRow = wsMain.getRow(currentRowIndex);
  totalRow.height = 26;
  totalRow.getCell(1).value = "TOTAIS / CONSOLIDADO";
  totalRow.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
  totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  for (let c = 2; c <= 22; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_ORANGE } },
      bottom: { style: "medium", color: { argb: COLOR_ORANGE } },
    };
  }

  totalRow.getCell(3).value = `${sortedChecklists.length} checklists`;
  totalRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

  totalRow.getCell(11).value = totalKmCalculado;
  totalRow.getCell(11).numFmt = '#,##0 "km"';
  totalRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };

  wsMain.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: 5,
      showGridLines: true,
    },
  ];

  // ==========================================
  // ABA 2: RESUMO CONSOLIDADO POR VEÍCULO
  // ==========================================
  const wsVehicles = workbook.addWorksheet("Resumo por Veículo", {
    views: [{ showGridLines: true }],
  });

  wsVehicles.columns = [
    { key: "placa", width: 16 },
    { key: "tag", width: 12 },
    { key: "modelo", width: 28 },
    { key: "filial", width: 18 },
    { key: "totalViagens", width: 20 },
    { key: "kmInicial", width: 18 },
    { key: "kmAtual", width: 18 },
    { key: "kmTotalRodado", width: 18 },
    { key: "status", width: 16 },
    { key: "proximaManutencao", width: 24 },
    { key: "totalManutencoes", width: 22 },
    { key: "ultimaManutencao", width: 35 },
  ];

  wsVehicles.mergeCells("A1:L1");
  const titleV = wsVehicles.getCell("A1");
  titleV.value = "ELETROMIDIA  |  RESUMO CONSOLIDADO DA FROTA POR VEÍCULO";
  titleV.font = { name: "Arial", size: 14, bold: true, color: { argb: COLOR_WHITE } };
  titleV.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
  titleV.alignment = { horizontal: "center", vertical: "middle" };
  wsVehicles.getRow(1).height = 32;

  const headersV = [
    "PLACA",
    "TAG",
    "MODELO",
    "FILIAL / REGIÃO",
    "TOTAL DE CHECKLISTS",
    "1º KM REGISTRADO",
    "ÚLTIMO KM (ATUAL)",
    "TOTAL KM RODADOS",
    "STATUS FROTA",
    "PRÓX. MANUTENÇÃO (KM)",
    "TOTAL MANUTENÇÕES",
    "ÚLTIMO SERVIÇO REALIZADO",
  ];

  const headerRowV = wsVehicles.getRow(3);
  headerRowV.height = 26;
  headersV.forEach((h, idx) => {
    const cell = headerRowV.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_ORANGE } },
      bottom: { style: "medium", color: { argb: COLOR_ORANGE } },
    };
  });

  const vehicleStatsMap: Record<
    string,
    {
      placa: string;
      tag: string;
      modelo: string;
      filial: string;
      totalChecklists: number;
      minKm: number;
      maxKm: number;
      totalRodado: number;
      status: string;
      proximaManutencao: number;
      totalManutencoes: number;
      ultimaManutencao: string;
    }
  > = {};

  if (vehicles) {
    vehicles.forEach((v) => {
      vehicleStatsMap[v.placa] = {
        placa: v.placa,
        tag: v.tag || "-",
        modelo: v.modelo,
        filial: v.centroOperacao || "-",
        totalChecklists: 0,
        minKm: 0,
        maxKm: v.kmAtual || 0,
        totalRodado: 0,
        status: v.status || "ATIVO",
        proximaManutencao: v.proximaManutencaoKm || 0,
        totalManutencoes: 0,
        ultimaManutencao: v.ultimaManutencaoDescricao
          ? `${formatDateStr(v.ultimaManutencaoData)}: ${v.ultimaManutencaoDescricao}`
          : "-",
      };
    });
  }

  sortedChecklists.forEach((c) => {
    const placa = (c.veiculoPlaca || "SEM PLACA").toUpperCase();
    if (!vehicleStatsMap[placa]) {
      vehicleStatsMap[placa] = {
        placa,
        tag: "-",
        modelo: c.veiculoModelo || "-",
        filial: c.centroOperacao || "-",
        totalChecklists: 0,
        minKm: c.kmInicial || 0,
        maxKm: c.kmFinal || c.kmInicial || 0,
        totalRodado: 0,
        status: "ATIVO",
        proximaManutencao: 0,
        totalManutencoes: 0,
        ultimaManutencao: "-",
      };
    }

    const stat = vehicleStatsMap[placa];
    stat.totalChecklists += 1;
    if (stat.minKm === 0 || (c.kmInicial && c.kmInicial < stat.minKm)) {
      stat.minKm = c.kmInicial;
    }
    const currentMax = c.kmFinal || c.kmInicial;
    if (currentMax > stat.maxKm) {
      stat.maxKm = currentMax;
    }
    if (c.kmFinal && c.kmFinal >= c.kmInicial) {
      stat.totalRodado += (c.kmFinal - c.kmInicial);
    }
  });

  // Vincula contagem de manutenções aos veículos
  if (maintenances) {
    maintenances.forEach((m) => {
      const placa = (m.placa || "").toUpperCase();
      if (vehicleStatsMap[placa]) {
        vehicleStatsMap[placa].totalManutencoes += 1;
        if (
          vehicleStatsMap[placa].ultimaManutencao === "-" ||
          !vehicleStatsMap[placa].ultimaManutencao
        ) {
          vehicleStatsMap[placa].ultimaManutencao = `${formatDateStr(m.dataReativacao)}: ${m.descricaoServico}`;
        }
      }
    });
  }

  let rowVIdx = 4;
  Object.values(vehicleStatsMap).forEach((v, idx) => {
    const row = wsVehicles.getRow(rowVIdx);
    row.height = 22;
    const isZebra = idx % 2 === 1;
    const baseFill = isZebra ? COLOR_LIGHT_ZEBRA : COLOR_WHITE;

    const rowVals = [
      v.placa,
      v.tag,
      v.modelo,
      v.filial,
      v.totalChecklists,
      v.minKm || "-",
      v.maxKm || "-",
      v.totalRodado,
      v.status,
      v.proximaManutencao > 0 ? v.proximaManutencao : "Não definida",
      v.totalManutencoes,
      v.ultimaManutencao,
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 10, color: { argb: COLOR_DARK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseFill } };
      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };

      if (cIdx === 0) {
        cell.font = { name: "Arial", size: 10, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (cIdx === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (cIdx === 2) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (cIdx >= 3 && cIdx <= 5) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (typeof val === "number") {
          cell.numFmt = '#,##0 "km"';
        }
      } else if (cIdx === 6) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (val === "ATIVO") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GREEN_FILL } };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_GREEN_TEXT } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_RED_FILL } };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_RED_TEXT } };
        }
      } else if (cIdx === 7) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (typeof val === "number") {
          cell.numFmt = '#,##0 "km"';
        }
      } else if (cIdx === 10) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (typeof val === "number" && val > 0) {
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_ORANGE } };
        }
      } else if (cIdx === 11) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });

    rowVIdx++;
  });

  // ==========================================
  // ABA 3: RESUMO POR CENTRO DE OPERAÇÃO
  // ==========================================
  const wsCentros = workbook.addWorksheet("Resumo por Região", {
    views: [{ showGridLines: true }],
  });

  wsCentros.columns = [
    { key: "centro", width: 26 },
    { key: "totalChecklists", width: 20 },
    { key: "totalKm", width: 22 },
    { key: "tecnicos", width: 20 },
    { key: "veiculos", width: 20 },
  ];

  wsCentros.mergeCells("A1:E1");
  const titleC = wsCentros.getCell("A1");
  titleC.value = "ELETROMIDIA  |  RESUMO POR CENTRO DE OPERAÇÃO / FILIAL";
  titleC.font = { name: "Arial", size: 14, bold: true, color: { argb: COLOR_WHITE } };
  titleC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
  titleC.alignment = { horizontal: "center", vertical: "middle" };
  wsCentros.getRow(1).height = 32;

  const headersC = [
    "CENTRO DE OPERAÇÃO",
    "TOTAL DE CHECKLISTS",
    "TOTAL KM RODADOS",
    "TÉCNICOS DISTINTOS",
    "VEÍCULOS DISTINTOS",
  ];

  const headerRowC = wsCentros.getRow(3);
  headerRowC.height = 26;
  headersC.forEach((h, idx) => {
    const cell = headerRowC.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_ORANGE } },
      bottom: { style: "medium", color: { argb: COLOR_ORANGE } },
    };
  });

  const centroStatsMap: Record<
    string,
    {
      centro: string;
      totalChecklists: number;
      totalKm: number;
      tecnicos: Set<string>;
      veiculos: Set<string>;
    }
  > = {};

  sortedChecklists.forEach((c) => {
    const centro = c.centroOperacao || "Não especificado";
    if (!centroStatsMap[centro]) {
      centroStatsMap[centro] = {
        centro,
        totalChecklists: 0,
        totalKm: 0,
        tecnicos: new Set(),
        veiculos: new Set(),
      };
    }
    const stat = centroStatsMap[centro];
    stat.totalChecklists += 1;
    if (c.kmFinal && c.kmFinal >= c.kmInicial) {
      stat.totalKm += (c.kmFinal - c.kmInicial);
    }
    if (c.tecnicoNome) stat.tecnicos.add(c.tecnicoNome);
    if (c.veiculoPlaca) stat.veiculos.add(c.veiculoPlaca);
  });

  let rowCIdx = 4;
  Object.values(centroStatsMap).forEach((c, idx) => {
    const row = wsCentros.getRow(rowCIdx);
    row.height = 22;
    const isZebra = idx % 2 === 1;
    const baseFill = isZebra ? COLOR_LIGHT_ZEBRA : COLOR_WHITE;

    const rowVals = [
      c.centro,
      c.totalChecklists,
      c.totalKm,
      c.tecnicos.size,
      c.veiculos.size,
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 10, color: { argb: COLOR_DARK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseFill } };
      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };

      if (cIdx === 0) {
        cell.font = { name: "Arial", size: 10, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (cIdx === 1 || cIdx === 3 || cIdx === 4) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (cIdx === 2) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (typeof val === "number") {
          cell.numFmt = '#,##0 "km"';
        }
      }
    });

    rowCIdx++;
  });

  // ==========================================
  // ABA 4: HISTÓRICO DE MANUTENÇÕES DA FROTA
  // ==========================================
  const wsMaintenances = workbook.addWorksheet("Histórico de Manutenções", {
    views: [{ showGridLines: true }],
  });

  wsMaintenances.columns = [
    { key: "dataReativacao", width: 16 },
    { key: "horaReativacao", width: 10 },
    { key: "dataEntrada", width: 16 },
    { key: "placa", width: 14 },
    { key: "tag", width: 10 },
    { key: "modelo", width: 22 },
    { key: "filial", width: 18 },
    { key: "kmManutencao", width: 16 },
    { key: "tipoManutencao", width: 18 },
    { key: "descricaoServico", width: 50 },
    { key: "motivoEntrada", width: 28 },
    { key: "oficina", width: 24 },
    { key: "proximaRevisaoKm", width: 22 },
    { key: "realizadoPorNome", width: 24 },
  ];

  // 1. Banner Principal
  wsMaintenances.mergeCells("A1:N1");
  const titleM = wsMaintenances.getCell("A1");
  titleM.value = "ELETROMIDIA  |  HISTÓRICO CONSOLIDADO DE MANUTENÇÕES DA FROTA";
  titleM.font = { name: "Arial", size: 15, bold: true, color: { argb: COLOR_WHITE } };
  titleM.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
  titleM.alignment = { horizontal: "center", vertical: "middle" };
  wsMaintenances.getRow(1).height = 36;

  wsMaintenances.mergeCells("A2:N2");
  const subtitleM = wsMaintenances.getCell("A2");
  subtitleM.value = isFiltered
    ? `REGISTROS DE SERVIÇOS E REATIVAÇÃO DE VEÍCULOS - FILTRO: ${options?.filterDate}`
    : "REGISTRO GERAL DE MANUTENÇÕES, REPAROS E REATIVAÇÕES DE VEÍCULOS";
  subtitleM.font = { name: "Arial", size: 11, bold: true, color: { argb: COLOR_WHITE } };
  subtitleM.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
  subtitleM.alignment = { horizontal: "center", vertical: "middle" };
  wsMaintenances.getRow(2).height = 24;

  // 2. Linha de Métricas da Manutenção
  const activeMaintenanceRows: MaintenanceExportData[] = (vehicles || [])
    .filter((v) => v.status === "MANUTENCAO")
    .map((v) => ({
      _id: `active-${v._id}`,
      placa: v.placa,
      modelo: v.modelo,
      tag: v.tag,
      centroOperacao: v.centroOperacao,
      dataEntrada: v.dataEntradaManutencao || "-",
      horaEntrada: v.horaEntradaManutencao || "-",
      dataReativacao: "NA OFICINA (AGUARDANDO)",
      horaReativacao: "-",
      kmManutencao: v.kmAtual,
      tipoManutencao: "EM ANDAMENTO",
      descricaoServico: "Veículo atualmente em manutenção na oficina aguardando conclusão dos reparos e reativação.",
      motivoEntrada: v.motivoManutencao || "Motivo não informado",
      oficina: "-",
      proximaRevisaoKm: v.proximaManutencaoKm,
      realizadoPorNome: "Em Manutenção",
      status: "MANUTENCAO",
    }));

  const allMaintenancesForExport = [...activeMaintenanceRows, ...sortedMaintenances];
  const veiculosComManutencao = new Set(allMaintenancesForExport.map((m) => m.placa)).size;

  wsMaintenances.mergeCells("A3:N3");
  const kpiMCell = wsMaintenances.getCell("A3");
  kpiMCell.value = `Emissão: ${dataHojeStr}  |  Total de Registros: ${allMaintenancesForExport.length} (${activeMaintenanceRows.length} na oficina)  |  Veículos Atendidos: ${veiculosComManutencao}`;
  kpiMCell.font = { name: "Arial", size: 10, italic: true, bold: true, color: { argb: COLOR_DARK } };
  kpiMCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_MUTED } };
  kpiMCell.alignment = { horizontal: "center", vertical: "middle" };
  wsMaintenances.getRow(3).height = 22;

  wsMaintenances.getRow(4).height = 10;

  // 3. Cabeçalhos da Tabela de Manutenção
  const headersM = [
    "STATUS / DATA REATIVAÇÃO",
    "HORA",
    "DATA ENTRADA",
    "PLACA",
    "TAG",
    "MODELO",
    "CENTRO DE OPERAÇÃO",
    "KM NO MOMENTO",
    "TIPO MANUTENÇÃO",
    "O QUE FOI FEITO NO CARRO (SERVIÇOS)",
    "MOTIVO / DEFEITO ENTRADA",
    "OFICINA / PRESTADOR",
    "PRÓX. REVISÃO (KM)",
    "LÍDER RESPONSÁVEL",
  ];

  const headerRowM = wsMaintenances.getRow(5);
  headerRowM.height = 28;
  headersM.forEach((h, idx) => {
    const cell = headerRowM.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ORANGE } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_DARK } },
      bottom: { style: "medium", color: { argb: COLOR_DARK } },
      left: { style: "thin", color: { argb: COLOR_WHITE } },
      right: { style: "thin", color: { argb: COLOR_WHITE } },
    };
  });

  // 4. Inserção das Linhas de Manutenção
  let currentMRowIdx = 6;
  if (allMaintenancesForExport.length === 0) {
    const emptyRow = wsMaintenances.getRow(currentMRowIdx);
    emptyRow.height = 28;
    wsMaintenances.mergeCells(`A${currentMRowIdx}:N${currentMRowIdx}`);
    const emptyCell = emptyRow.getCell(1);
    emptyCell.value = "Nenhum registro de manutenção ou veículo na oficina até o momento.";
    emptyCell.font = { name: "Arial", size: 11, italic: true, color: { argb: "FF6B7280" } };
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    currentMRowIdx++;
  } else {
    allMaintenancesForExport.forEach((m, index) => {
      const row = wsMaintenances.getRow(currentMRowIdx);
      row.height = 26;
      const isZebra = index % 2 === 1;
      const baseFillColor = isZebra ? COLOR_LIGHT_ZEBRA : COLOR_WHITE;

      const isEmAndamento = m.tipoManutencao === "EM ANDAMENTO" || m.status === "MANUTENCAO";
      const dataReativacaoDisplay = isEmAndamento ? "NA OFICINA (AGUARDANDO)" : formatDateStr(m.dataReativacao);

      const rowValues = [
        dataReativacaoDisplay,
        m.horaReativacao || "-",
        formatDateStr(m.dataEntrada),
        (m.placa || "").toUpperCase(),
        m.tag || "-",
        m.modelo || "-",
        m.centroOperacao || "-",
        m.kmManutencao !== undefined && m.kmManutencao !== null ? m.kmManutencao : "-",
        m.tipoManutencao || "PREVENTIVA",
        m.descricaoServico || "-",
        m.motivoEntrada || "-",
        m.oficina || "-",
        m.proximaRevisaoKm !== undefined && m.proximaRevisaoKm !== null ? m.proximaRevisaoKm : "-",
        m.realizadoPorNome || "-",
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: "Arial", size: 10, color: { argb: COLOR_DARK } };

        cell.border = {
          top: { style: "thin", color: { argb: COLOR_BORDER } },
          bottom: { style: "thin", color: { argb: COLOR_BORDER } },
          left: { style: "thin", color: { argb: COLOR_BORDER } },
          right: { style: "thin", color: { argb: COLOR_BORDER } },
        };

        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseFillColor } };

        const colNum = colIdx + 1;

        if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 5) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colNum === 4) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_DARK } };
        } else if (colNum === 6 || colNum === 7 || colNum === 12 || colNum === 14) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colNum === 8 || colNum === 13) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          if (typeof val === "number") {
            cell.numFmt = '#,##0 "km"';
          }
        } else if (colNum === 9) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          const upperVal = String(val).toUpperCase();
          if (isEmAndamento || upperVal.includes("EM ANDAMENTO")) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_RED_FILL } };
            cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_RED_TEXT } };
          } else if (upperVal.includes("PREVENTIVA") || upperVal.includes("REVISAO")) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GREEN_FILL } };
            cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_GREEN_TEXT } };
          } else if (upperVal.includes("CORRETIVA")) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_YELLOW_FILL } };
            cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_YELLOW_TEXT } };
          }
        } else if (colNum === 10 || colNum === 11) {
          cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
          if (colNum === 10) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_DARK } };
          } else if (colNum === 11 && isEmAndamento) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_RED_TEXT } };
          }
        }
      });

      currentMRowIdx++;
    });

    // 5. Linha de Totais da Manutenção
    const totalMRow = wsMaintenances.getRow(currentMRowIdx);
    totalMRow.height = 26;
    totalMRow.getCell(1).value = "TOTAL MANUTENÇÕES";
    totalMRow.getCell(1).font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    totalMRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
    totalMRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    for (let c = 2; c <= 14; c++) {
      const cell = totalMRow.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_DARK } };
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
      cell.border = {
        top: { style: "medium", color: { argb: COLOR_ORANGE } },
        bottom: { style: "medium", color: { argb: COLOR_ORANGE } },
      };
    }

    totalMRow.getCell(4).value = `${sortedMaintenances.length} registros`;
    totalMRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
  }

  wsMaintenances.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: 5,
      showGridLines: true,
    },
  ];

  // Gera o arquivo final .xlsx para download no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileNameDate = new Date().toISOString().split("T")[0];
  const filePrefix = isFiltered ? `relatorio_frota_${options?.filterDate}` : "relatorio_frota_consolidado_geral";
  link.download = `${filePrefix}_${fileNameDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
