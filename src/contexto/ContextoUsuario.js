import React, { createContext, useContext, useState } from "react";
import { api } from "../servicos/api";

const ContextoUsuario = createContext(null);

export function ProvedorUsuario({ children }) {
  const [usuario, setUsuario] = useState(null);

  async function cadastrarUsuario(dados) {
    return api.cadastrar({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      telefone: dados.telefone.trim(),
      cep: (dados.cep || "").trim(),
      endereco: dados.endereco.trim(),
      senha: dados.senha,
    });
  }

  async function fazerLogin(email, senha) {
    const logado = await api.login(email.trim().toLowerCase(), senha);
    setUsuario(logado);
    return logado;
  }

  function sair() {
    setUsuario(null);
  }

  return (
    <ContextoUsuario.Provider value={{ usuario, cadastrarUsuario, fazerLogin, sair }}>
      {children}
    </ContextoUsuario.Provider>
  );
}

export function useUsuario() {
  const ctx = useContext(ContextoUsuario);
  if (!ctx) throw new Error("useUsuario precisa ser usado dentro de um ProvedorUsuario");
  return ctx;
}