// Consumo dos serviços RESTful: API Frut & Vida e ViaCEP (Correios).
import { API_URL } from "./config";

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, semConexao = false } = {}) {
    super(mensagem);
    this.status = status;
    this.semConexao = semConexao;
  }
}

async function requisicao(metodo, rota, corpo, { base = API_URL, tempoLimite = 8000 } = {}) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), tempoLimite);
  let resposta;
  try {
    resposta = await fetch(base + rota, {
      method: metodo,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch (e) {
    throw new ErroApi("Sem conexão com o servidor.", { semConexao: true });
  } finally {
    clearTimeout(timer);
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroApi(dados.erro || `Erro ${resposta.status} no servidor.`, { status: resposta.status });
  }
  return dados;
}

export const api = {
  // Produtos (CRUD)
  listarProdutos: (desde) =>
    requisicao("GET", desde ? `/produtos?desde=${encodeURIComponent(desde)}` : "/produtos"),
  criarProduto: (dados) => requisicao("POST", "/produtos", dados),
  editarProduto: (id, dados) => requisicao("PUT", `/produtos/${id}`, dados),
  excluirProduto: (id) => requisicao("DELETE", `/produtos/${id}`),

  // Usuários
  cadastrar: (dados) => requisicao("POST", "/usuarios", dados),
  login: (email, senha) => requisicao("POST", "/login", { email, senha }),

  // Pedidos
  criarPedido: (dados) => requisicao("POST", "/pedidos", dados),
  listarPedidos: (usuarioId) => requisicao("GET", `/pedidos?usuario_id=${usuarioId}`),

  // Verifica o pagamento de um pedido no Mercado Pago e atualiza o status do pedido.
    criarPedido: (dados) => requisicao("POST", "/pedidos", dados),
  verificarPagamento: (pedidoId) => requisicao("POST", `/pedidos/${pedidoId}/verificar-pagamento`, null, { tempoLimite: 15000 }),

  // Item 2.2: gera o JSON para o dashboard
  exportarJson: () => requisicao("POST", "/exportar", null, { tempoLimite: 15000 }),
};

// Serviço externo dos Correios (via ViaCEP): preenche o endereço a partir do CEP.
export async function buscarCep(cep) {
  const numeros = String(cep).replace(/\D/g, "");
  const dados = await requisicao("GET", `/ws/${numeros}/json/`, null, { base: "https://viacep.com.br" });
  if (dados.erro) throw new ErroApi("CEP não encontrado.", { status: 404 });
  return {
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf,
    texto: `${dados.logradouro}, ${dados.bairro} - ${dados.localidade}/${dados.uf}`,
  };
}