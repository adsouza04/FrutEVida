

const arredondar = (valor) => Math.round(valor * 100) / 100;

function adicionarItem(itens, produto) {
  const existente = itens.find((i) => i.produto.id === produto.id);
  if (existente) {
    return itens.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
  }
  return [...itens, { produto, quantidade: 1 }];
}

function alterarQuantidadeItem(itens, produtoId, delta) {
  return itens
    .map((i) => (i.produto.id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i))
    .filter((i) => i.quantidade > 0);
}

function removerItem(itens, produtoId) {
  return itens.filter((i) => i.produto.id !== produtoId);
}

function calcularTotal(itens) {
  return arredondar(itens.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0));
}

function contarItens(itens) {
  return itens.reduce((soma, i) => soma + i.quantidade, 0);
}

// Formato que a API espera em POST /pedidos
function montarItensPedido(itens) {
  return itens.map((i) => ({ produto_id: Number(i.produto.id), quantidade: i.quantidade }));
}

module.exports = { adicionarItem, alterarQuantidadeItem, removerItem, calcularTotal, contarItens, montarItensPedido };