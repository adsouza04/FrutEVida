
import { api } from "./api";
import {
  lerProdutosCache, aplicarProdutosNoCache, lerMeta, gravarMeta,
  enfileirarPedido, listarPedidosPendentes, removerPedidoPendente,
} from "../dados/banco";

const CHAVE_ULTIMA_SYNC = "ultima_sincronizacao_produtos";

export const normalizarProduto = (p) => ({ ...p, id: String(p.id) });

export function gerarIdLocal() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function carregarProdutosLocais() {
  return lerProdutosCache();
}

export async function sincronizarProdutos() {
  const ultima = await lerMeta(CHAVE_ULTIMA_SYNC);
  const resposta = await api.listarProdutos(ultima);
  await aplicarProdutosNoCache(resposta.produtos.map(normalizarProduto), { substituirTudo: !ultima });
  await gravarMeta(CHAVE_ULTIMA_SYNC, resposta.sincronizado_em);
  return { produtos: await lerProdutosCache(), sincronizadoEm: resposta.sincronizado_em, alterados: resposta.produtos.length };
}

// Atualiza o cache local na hora após um CRUD bem-sucedido no admin.
export async function registrarAlteracaoLocal(produto) {
  await aplicarProdutosNoCache([normalizarProduto(produto)]);
  return lerProdutosCache();
}

export async function enviarPedido(corpo) {
  const pedido = { ...corpo, id_local: corpo.id_local || gerarIdLocal() };
  try {
    return { pendente: false, pedido: await api.criarPedido(pedido) };
  } catch (erro) {
    if (!erro.semConexao) throw erro; // erro de regra (estoque, etc.): mostra para o usuário
    await enfileirarPedido({ ...pedido, origem_offline: true });
    return { pendente: true, pedido };
  }
}

export async function enviarPedidosPendentes() {
  const pendentes = await listarPedidosPendentes();
  let enviados = 0;
  const recusados = [];
  for (const corpo of pendentes) {
    try {
      await api.criarPedido(corpo);
      await removerPedidoPendente(corpo.id_local);
      enviados++;
    } catch (erro) {
      if (erro.semConexao) break; // continua sem internet: tenta de novo depois
      recusados.push(erro.message); // o servidor recusou (ex.: acabou o estoque)
      await removerPedidoPendente(corpo.id_local);
    }
  }
  const restantes = (await listarPedidosPendentes()).length;
  return { enviados, recusados, restantes };
}

export async function contarPendentes() {
  return (await listarPedidosPendentes()).length;
}