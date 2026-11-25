function resolverImagem(imagem, baseApi) {
  if (!imagem || typeof imagem !== "string") return null;
  const texto = imagem.trim();
  if (/^https?:\/\//i.test(texto)) return texto;
  if (texto.startsWith("/")) return String(baseApi || "").replace(/\/$/, "") + texto;
  return null;
}

module.exports = { resolverImagem };
