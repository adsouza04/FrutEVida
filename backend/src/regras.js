// Regras de negócio puras (sem banco, sem HTTP) — testadas em tests/unit.
const crypto = require("crypto");
// Frete, cupons, etapas do pedido e CPF: as mesmas regras que o app usa para mostrar os valores.
const regrasPedido = require("../../src/utils/regrasPedido");

const CATEGORIAS = ["Frutas", "Verduras", "Legumes", "Temperos", "Sucos"];
const FORMAS_PAGAMENTO = ["Mercado Pago", "Pix", "Cartão de crédito", "Cartão de débito"];

function validarEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Aceita "7,90", "7.90" ou número. Retorna NaN quando inválido.
function converterPreco(valor) {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  const texto = valor.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return NaN;
  return Number(texto);
}

function validarProduto(dados, { parcial = false } = {}) {
  const erros = [];
  const produto = {};

  if (!parcial || dados.nome !== undefined) {
    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    if (nome.length < 2) erros.push("O nome do produto deve ter pelo menos 2 caracteres.");
    produto.nome = nome;
  }

  if (!parcial || dados.preco !== undefined) {
    const preco = converterPreco(dados.preco);
    if (Number.isNaN(preco) || preco <= 0) erros.push("Informe um preço válido maior que zero.");
    produto.preco = Math.round(preco * 100) / 100;
  }

  if (!parcial || dados.categoria !== undefined) {
    if (!CATEGORIAS.includes(dados.categoria)) erros.push(`Categoria inválida. Use: ${CATEGORIAS.join(", ")}.`);
    produto.categoria = dados.categoria;
  }

  if (dados.preco_antigo !== undefined) {
    if (dados.preco_antigo === null || dados.preco_antigo === "") {
      produto.preco_antigo = null;
    } else {
      const antigo = converterPreco(dados.preco_antigo);
      if (Number.isNaN(antigo) || antigo <= 0) erros.push("O preço antigo (oferta) deve ser um valor maior que zero.");
      else if (produto.preco !== undefined && !Number.isNaN(produto.preco) && antigo <= produto.preco) {
        erros.push("Na oferta, o preço antigo precisa ser maior que o preço atual.");
      }
      produto.preco_antigo = Math.round(antigo * 100) / 100;
    }
  }

  if (dados.estoque !== undefined) {
    const estoque = Number(dados.estoque);
    if (!Number.isInteger(estoque) || estoque < 0) erros.push("O estoque deve ser um número inteiro >= 0.");
    produto.estoque = estoque;
  }

  for (const campo of ["unidade", "emoji", "descricao", "imagem"]) {
    if (dados[campo] !== undefined) produto[campo] = dados[campo] === null ? null : String(dados[campo]).trim();
  }
  if (produto.imagem !== undefined && produto.imagem !== null && produto.imagem !== "" &&
      !/^(https?:\/\/|\/imagens\/)/.test(produto.imagem)) {
    erros.push("A imagem deve ser um link (http/https) ou um caminho /imagens/...");
  }
  if (produto.imagem === "") produto.imagem = null;
  if (dados.destaque !== undefined) produto.destaque = dados.destaque ? 1 : 0;

  return { valido: erros.length === 0, erros, produto };
}

// "08h–10h" -> { inicio: "08:00", fim: "10:00" }
function interpretarHorario(faixa) {
  const m = typeof faixa === "string" && faixa.match(/^(\d{1,2})h\s*[–-]\s*(\d{1,2})h$/);
  if (!m) return null;
  const inicio = Number(m[1]);
  const fim = Number(m[2]);
  if (inicio >= fim || fim > 23) return null;
  const pad = (n) => String(n).padStart(2, "0") + ":00";
  return { inicio: pad(inicio), fim: pad(fim) };
}

// O servidor recalcula o pedido com os preços do banco (nunca confia no preço enviado pelo app).
function calcularPedido(itens, produtosPorId) {
  if (!Array.isArray(itens) || itens.length === 0) {
    return { valido: false, erros: ["O pedido precisa ter pelo menos um item."] };
  }
  const erros = [];
  const itensCalculados = [];

  for (const item of itens) {
    const produto = produtosPorId[item.produto_id];
    const quantidade = Number(item.quantidade);
    if (!produto || !produto.ativo) {
      erros.push(`Produto ${item.produto_id} não está disponível.`);
      continue;
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      erros.push(`Quantidade inválida para ${produto.nome}.`);
      continue;
    }
    if (produto.estoque < quantidade) {
      erros.push(`Estoque insuficiente para ${produto.nome} (disponível: ${produto.estoque}).`);
      continue;
    }
    const subtotal = Math.round(produto.preco * quantidade * 100) / 100;
    itensCalculados.push({ produto_id: produto.id, quantidade, preco_unitario: produto.preco, subtotal });
  }

  const total = Math.round(itensCalculados.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
  return { valido: erros.length === 0, erros, itens: itensCalculados, total };
}

// Endereço de entrega separado em campos. Retorna { valido, erros, endereco }.
function validarEndereco(dados = {}) {
  const texto = (v) => (typeof v === "string" ? v.trim() : "");
  const endereco = {
    cep: regrasPedido.somenteDigitos(dados.cep),
    rua: texto(dados.rua),
    numero: texto(dados.numero),
    complemento: texto(dados.complemento),
    bairro: texto(dados.bairro),
    cidade: texto(dados.cidade),
    uf: texto(dados.uf).toUpperCase().slice(0, 2),
    referencia: texto(dados.referencia),
  };
  const erros = [];
  if (endereco.cep.length !== 8) erros.push("CEP inválido.");
  if (!endereco.rua) erros.push("Informe a rua.");
  if (!endereco.numero) erros.push("Informe o número.");
  if (!endereco.bairro) erros.push("Informe o bairro.");
  if (!endereco.cidade) erros.push("Informe a cidade.");
  return { valido: erros.length === 0, erros, endereco };
}

// Endereço gravado como JSON no banco; textos antigos (antes dos campos separados) viram null.
function lerEndereco(valor) {
  if (!valor) return null;
  try {
    const obj = JSON.parse(valor);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function gerarHashSenha(senha) {
  const sal = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(senha, sal, 64).toString("hex");
  return `${sal}:${hash}`;
}

function verificarSenha(senha, armazenada) {
  const [sal, hash] = String(armazenada).split(":");
  if (!sal || !hash) return false;
  const calculado = crypto.scryptSync(senha, sal, 64);
  const esperado = Buffer.from(hash, "hex");
  return esperado.length === calculado.length && crypto.timingSafeEqual(esperado, calculado);
}

module.exports = {
  ...regrasPedido,
  validarEndereco,
  lerEndereco,
  CATEGORIAS,
  FORMAS_PAGAMENTO,
  validarEmail,
  converterPreco,
  validarProduto,
  interpretarHorario,
  calcularPedido,
  gerarHashSenha,
  verificarSenha,
};