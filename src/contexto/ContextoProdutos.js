import React, { createContext, useContext, useState } from "react";
import { PRODUTOS_INICIAIS, gerarNovoId } from "../dados/produtos";

const ContextoProdutos = createContext(null);

export function ProvedorProdutos({ children }) {
  const [produtos, setProdutos] = useState(PRODUTOS_INICIAIS);

  function adicionarProduto(produto) {
    setProdutos((atual) => [...atual, { ...produto, id: gerarNovoId() }]);
  }

  function editarProduto(id, dadosAtualizados) {
    setProdutos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, ...dadosAtualizados } : p))
    );
  }

  function excluirProduto(id) {
    setProdutos((atual) => atual.filter((p) => p.id !== id));
  }

  return (
    <ContextoProdutos.Provider
      value={{ produtos, adicionarProduto, editarProduto, excluirProduto }}
    >
      {children}
    </ContextoProdutos.Provider>
  );
}

export function useProdutos() {
  const ctx = useContext(ContextoProdutos);
  if (!ctx) {
    throw new Error("useProdutos precisa ser usado dentro de um ProvedorProdutos");
  }
  return ctx;
}
