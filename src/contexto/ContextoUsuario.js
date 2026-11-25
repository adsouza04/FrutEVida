import React, { createContext, useCallback, useContext, useState } from "react";
import { api } from "../servicos/api";
import { somenteDigitos } from "../utils/regrasPedido";

const ContextoUsuario = createContext(null);

export function ProvedorUsuario({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [favoritos, setFavoritos] = useState([]); 

  async function cadastrarUsuario(dados) {
    return api.cadastrar({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      cpf: somenteDigitos(dados.cpf),
      telefone: somenteDigitos(dados.telefone),
      senha: dados.senha,
    });
  }

  async function fazerLogin(email, senha) {
    const logado = await api.login(email.trim().toLowerCase(), senha);
    setUsuario(logado);
    try {
      setFavoritos((await api.listarFavoritos(logado.id)).map(String));
    } catch {
      setFavoritos([]);
    }
    return logado;
  }

  function sair() {
    setUsuario(null);
    setFavoritos([]);
  }

  async function salvarEndereco(endereco) {
    const atualizado = await api.salvarEndereco(usuario.id, endereco);
    setUsuario(atualizado);
    return atualizado;
  }

  const ehFavorito = useCallback((produtoId) => favoritos.includes(String(produtoId)), [favoritos]);

  async function alternarFavorito(produtoId) {
    const id = String(produtoId);
    const jaEra = favoritos.includes(id);
    setFavoritos((atual) => (jaEra ? atual.filter((f) => f !== id) : [id, ...atual]));
    try {
      if (jaEra) await api.desfavoritar(usuario.id, id);
      else await api.favoritar(usuario.id, id);
    } catch (erro) {
      setFavoritos((atual) => (jaEra ? [id, ...atual] : atual.filter((f) => f !== id)));
      throw erro;
    }
  }

  return (
    <ContextoUsuario.Provider
      value={{ usuario, favoritos, cadastrarUsuario, fazerLogin, sair, salvarEndereco, ehFavorito, alternarFavorito }}
    >
      {children}
    </ContextoUsuario.Provider>
  );
}

export function useUsuario() {
  const ctx = useContext(ContextoUsuario);
  if (!ctx) throw new Error("useUsuario precisa ser usado dentro de um ProvedorUsuario");
  return ctx;
}
