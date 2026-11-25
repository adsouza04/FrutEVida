const { ETAPAS_PEDIDO } = require("./regrasPedido");

const SITUACOES = {
  aguardando_pagamento: { rotulo: "Aguardando pagamento", tom: "atencao" },
  confirmado: { rotulo: "Confirmado", tom: "andamento" },
  separando: { rotulo: "Separando", tom: "andamento" },
  saiu_para_entrega: { rotulo: "Saiu para entrega", tom: "andamento" },
  entregue: { rotulo: "Entregue", tom: "sucesso" },
  cancelado: { rotulo: "Cancelado", tom: "erro" },
};

function situacao(status) {
  return SITUACOES[status] || { rotulo: status, tom: "andamento" };
}

function emAndamento(status) {
  return !["entregue", "cancelado"].includes(status);
}

function progresso(status) {
  const i = ETAPAS_PEDIDO.findIndex((e) => e.status === status);
  return i < 0 ? 0 : i + 1;
}

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dois = (n) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

function textoEntrega(pedido) {
  const a = pedido?.agendamento;
  if (!a) return "";
  const prefixo = pedido.tipo_entrega === "expressa" ? "Expressa" : "Entrega";
  return `${prefixo} ${formatarData(a.data_entrega)}, das ${a.horario_inicio} às ${a.horario_fim}`;
}

module.exports = { SITUACOES, situacao, emAndamento, progresso, formatarData, formatarDataHora, textoEntrega };
