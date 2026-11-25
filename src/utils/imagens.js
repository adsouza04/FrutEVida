// Monta o endereço completo da foto de um produto.
// - Link completo (https://...) é usado como está.
// - Caminho do servidor (/imagens/maca.jpg) recebe o endereço da API na frente.
function resolverImagem(imagem, baseApi) {
  if (!imagem || typeof imagem !== "string") return null;
  const texto = imagem.trim();
  if (/^https?:\/\//i.test(texto)) return texto;
  if (texto.startsWith("/")) return String(baseApi || "").replace(/\/$/, "") + texto;
  return null;
}

module.exports = { resolverImagem };
