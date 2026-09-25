import React, { createContext, useContext, useMemo, useState } from "react";

const ContextoCarrinho = createContext(null);

export function ProvedorCarrinho({ children }) {
  const [itens, setItens] = useState([]); // [{ produto, quantidade }]

  function adicionarAoCarrinho(produto) {
    setItens((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...atual, { produto, quantidade: 1 }];
    });
  }

  function removerDoCarrinho(produtoId) {
    setItens((atual) => atual.filter((item) => item.produto.id !== produtoId));
  }

  function alterarQuantidade(produtoId, delta) {
    setItens((atual) =>
      atual
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade + delta }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function limparCarrinho() {
    setItens([]);
  }

  const total = useMemo(
    () => itens.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0),
    [itens]
  );

  const quantidadeTotal = useMemo(
    () => itens.reduce((soma, item) => soma + item.quantidade, 0),
    [itens]
  );

  return (
    <ContextoCarrinho.Provider
      value={{
        itens,
        adicionarAoCarrinho,
        removerDoCarrinho,
        alterarQuantidade,
        limparCarrinho,
        total,
        quantidadeTotal,
      }}
    >
      {children}
    </ContextoCarrinho.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(ContextoCarrinho);
  if (!ctx) {
    throw new Error("useCarrinho precisa ser usado dentro de um ProvedorCarrinho");
  }
  return ctx;
}
