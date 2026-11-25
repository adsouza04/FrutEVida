const arredondar = (v) => Math.round(v * 100) / 100;

const FRETE_GRATIS_A_PARTIR_DE = 100;

const TIPOS_ENTREGA = {
  padrao: { nome: "Padrão", descricao: "Agendada: escolha o dia e a janela", valor: 7.9 },
  expressa: { nome: "Expressa", descricao: "Chega em até 2 horas", valor: 14.9 },
};

const CUPONS = {
  FRUTA10: { tipo: "percentual", valor: 10, descricao: "10% de desconto nos produtos" },
  FRETEGRATIS: { tipo: "frete", valor: 0, descricao: "Frete grátis" },
  BEMVINDO5: { tipo: "fixo", valor: 5, descricao: "R$ 5,00 de desconto", minimo: 30 },
};

const ETAPAS_PEDIDO = [
  { status: "confirmado", titulo: "Pedido confirmado", descricao: "Recebemos seu pedido e o pagamento." },
  { status: "separando", titulo: "Separando os produtos", descricao: "Escolhendo os itens mais frescos." },
  { status: "saiu_para_entrega", titulo: "Saiu para entrega", descricao: "O entregador está a caminho." },
  { status: "entregue", titulo: "Entregue", descricao: "Pedido entregue. Bom apetite!" },
];

function proximoStatus(status) {
  const i = ETAPAS_PEDIDO.findIndex((e) => e.status === status);
  if (i < 0 || i === ETAPAS_PEDIDO.length - 1) return null;
  return ETAPAS_PEDIDO[i + 1].status;
}

function calcularFrete(subtotal, tipoEntrega = "padrao") {
  const tipo = TIPOS_ENTREGA[tipoEntrega];
  if (!tipo) return null;
  if (tipoEntrega === "padrao" && subtotal >= FRETE_GRATIS_A_PARTIR_DE) return 0;
  return tipo.valor;
}

function validarCupom(codigo, subtotal) {
  const chave = String(codigo || "").trim().toUpperCase();
  if (!chave) return { valido: false, erro: "Digite um cupom." };
  const cupom = CUPONS[chave];
  if (!cupom) return { valido: false, erro: "Cupom inválido ou expirado." };
  if (cupom.minimo && subtotal < cupom.minimo) {
    return { valido: false, erro: `Este cupom vale para compras a partir de R$ ${cupom.minimo.toFixed(2).replace(".", ",")}.` };
  }
  return { valido: true, cupom: { codigo: chave, ...cupom } };
}

function calcularResumo({ subtotal, tipoEntrega = "padrao", cupom }) {
  subtotal = arredondar(subtotal);
  let frete = calcularFrete(subtotal, tipoEntrega);
  let desconto = 0;
  let cupomAplicado = null;

  if (cupom) {
    const r = validarCupom(cupom, subtotal);
    if (r.valido) {
      cupomAplicado = r.cupom.codigo;
      if (r.cupom.tipo === "percentual") desconto = arredondar((subtotal * r.cupom.valor) / 100);
      if (r.cupom.tipo === "fixo") desconto = Math.min(r.cupom.valor, subtotal);
      if (r.cupom.tipo === "frete") frete = 0;
    }
  }

  return {
    subtotal,
    frete: arredondar(frete ?? 0),
    desconto: arredondar(desconto),
    total: arredondar(subtotal - desconto + (frete ?? 0)),
    cupom: cupomAplicado,
  };
}

function somenteDigitos(texto) {
  return String(texto || "").replace(/\D/g, "");
}

function validarCpf(cpf) {
  const n = somenteDigitos(cpf);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(n[i]) * (tamanho + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(n[tamanho])) return false;
  }
  return true;
}

function codigoPedido(id) {
  return "FV-" + String(id).padStart(6, "0");
}

module.exports = {
  FRETE_GRATIS_A_PARTIR_DE,
  TIPOS_ENTREGA,
  CUPONS,
  ETAPAS_PEDIDO,
  proximoStatus,
  calcularFrete,
  validarCupom,
  calcularResumo,
  validarCpf,
  somenteDigitos,
  codigoPedido,
};
