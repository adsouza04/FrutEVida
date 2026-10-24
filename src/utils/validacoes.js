// Validações e formatações usadas nas telas — testadas em backend/tests/unit/carrinho-app.test.js.

function formatarPreco(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function limparCep(cep) {
  return String(cep).replace(/\D/g, "");
}

function cepValido(cep) {
  return limparCep(cep).length === 8;
}

// Retorna a mensagem de erro, ou null se estiver tudo certo.
function validarCadastro({ nome, email, telefone, endereco, senha, confirmarSenha }) {
  if (![nome, email, telefone, endereco].every((c) => c && c.trim()) || !senha || !confirmarSenha) {
    return "Preencha todos os campos.";
  }
  if (!emailValido(email)) return "Digite um e-mail válido.";
  if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (senha !== confirmarSenha) return "As senhas não conferem.";
  return null;
}

module.exports = { formatarPreco, emailValido, limparCep, cepValido, validarCadastro };