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
  salvarEndereco: (usuarioId, endereco) => requisicao("PUT", `/usuarios/${usuarioId}/endereco`, endereco),

  // Favoritos
  listarFavoritos: (usuarioId) => requisicao("GET", `/usuarios/${usuarioId}/favoritos`),
  favoritar: (usuarioId, produtoId) => requisicao("POST", `/usuarios/${usuarioId}/favoritos`, { produto_id: Number(produtoId) }),
  desfavoritar: (usuarioId, produtoId) => requisicao("DELETE", `/usuarios/${usuarioId}/favoritos/${produtoId}`),

  // Pedidos
  criarPedido: (dados) => requisicao("POST", "/pedidos", dados),
  listarPedidos: (usuarioId) => requisicao("GET", `/pedidos?usuario_id=${usuarioId}`),
  listarTodosPedidos: () => requisicao("GET", "/pedidos"),
  obterPedido: (pedidoId) => requisicao("GET", `/pedidos/${pedidoId}`),
  avancarPedido: (pedidoId) => requisicao("POST", `/pedidos/${pedidoId}/avancar`),

  verificarPagamento: (pedidoId) => requisicao("POST", `/pedidos/${pedidoId}/verificar-pagamento`, null, { tempoLimite: 15000 }),

  exportarJson: () => requisicao("POST", "/exportar", null, { tempoLimite: 15000 }),
};

export async function buscarCep(cep) {
  const numeros = String(cep).replace(/\D/g, "");
  const dados = await requisicao("GET", `/ws/${numeros}/json/`, null, { base: "https://viacep.com.br" });
  if (dados.erro) throw new ErroApi("CEP não encontrado.", { status: 404 });
  return {
    cep: numeros,
    rua: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    uf: dados.uf || "",
  };
}
