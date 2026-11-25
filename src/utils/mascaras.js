const digitos = (t, max) => String(t || "").replace(/\D/g, "").slice(0, max);

function mascararCpf(texto) {
  const d = digitos(texto, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function mascararTelefone(texto) {
  const d = digitos(texto, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mascararCep(texto) {
  const d = digitos(texto, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function ocultarCpf(cpf) {
  const d = digitos(cpf, 11);
  if (d.length !== 11) return "";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

module.exports = { mascararCpf, mascararTelefone, mascararCep, ocultarCpf };
