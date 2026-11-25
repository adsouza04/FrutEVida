// Validações e formatações usadas nas telas — testadas em backend/tests/unit/carrinho-app.test.js.
const { validarCpf, somenteDigitos } = require("./regrasPedido");

const SENHA_MINIMA = 8;

function formatarPreco(valor) {
  return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function limparCep(cep) {
  return somenteDigitos(cep);
}

function cepValido(cep) {
  return limparCep(cep).length === 8;
}

// Erros de cada campo do cadastro: { campo: mensagem }. Objeto vazio = tudo certo.
function errosCadastro({ nome, cpf, email, telefone, senha, confirmarSenha, aceitouTermos }) {
  const erros = {};
  if (!nome || nome.trim().split(/\s+/).length < 2) erros.nome = "Digite seu nome e sobrenome.";
  if (!validarCpf(cpf)) erros.cpf = "CPF inválido.";
  if (!emailValido(email || "")) erros.email = "Digite um e-mail válido.";
  const tel = somenteDigitos(telefone);
  if (tel.length < 10 || tel.length > 11) erros.telefone = "Digite o telefone com DDD.";
  if (!senha || senha.length < SENHA_MINIMA) erros.senha = `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (!confirmarSenha || senha !== confirmarSenha) erros.confirmarSenha = "As senhas não conferem.";
  if (!aceitouTermos) erros.aceitouTermos = "Aceite os termos para continuar.";
  return erros;
}

// Primeira mensagem de erro do cadastro, ou null se estiver tudo certo.
function validarCadastro(dados) {
  const erros = Object.values(errosCadastro(dados));
  return erros.length ? erros[0] : null;
}

module.exports = { SENHA_MINIMA, formatarPreco, emailValido, limparCep, cepValido, errosCadastro, validarCadastro };
