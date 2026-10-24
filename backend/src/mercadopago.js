// Integração com o Mercado Pago (Checkout Pro) usando a API REST oficial.
// O Access Token fica só no servidor (variável de ambiente MP_ACCESS_TOKEN, lida do backend/.env).
const API_MP = "https://api.mercadopago.com";
const FORMA_MERCADO_PAGO = "Mercado Pago";

function configurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

async function chamarMp(metodo, rota, corpo) {
  const resposta = await fetch(API_MP + rota, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.message || `Mercado Pago respondeu com erro ${resposta.status}`);
  }
  return dados;
}

// Código único que liga o pedido do nosso banco ao pagamento no Mercado Pago.
function gerarReferencia(pedidoId) {
  return `frutevida-${pedidoId}-${Date.now().toString(36)}`;
}

function montarPreferencia({ referencia, itens }) {
  return {
    items: itens.map((i) => ({
      id: String(i.produto_id),
      title: i.nome,
      quantity: i.quantidade,
      unit_price: Number(i.preco_unitario),
      currency_id: "BRL",
    })),
    external_reference: referencia,
    statement_descriptor: "FRUTEVIDA",
  };
}

// Cria o link de pagamento (init_point) que o app abre no navegador.
function criarPreferencia(corpo) {
  return chamarMp("POST", "/checkout/preferences", corpo);
}

// Consulta o pagamento mais recente feito para aquele pedido.
async function buscarUltimoPagamento(referencia) {
  const dados = await chamarMp(
    "GET",
    `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`
  );
  return (dados.results && dados.results[0]) || null;
}

// Converte o status do Mercado Pago para o vocabulário do nosso sistema.
function traduzirStatus(statusMp) {
  switch (statusMp) {
    case "approved":
      return "aprovado";
    case "rejected":
    case "cancelled":
      return "recusado";
    case "refunded":
    case "charged_back":
      return "estornado";
    default: // pending, in_process, authorized, in_mediation...
      return "pendente";
  }
}

module.exports = {
  FORMA_MERCADO_PAGO,
  configurado,
  gerarReferencia,
  montarPreferencia,
  criarPreferencia,
  buscarUltimoPagamento,
  traduzirStatus,
};