import React, { createContext, useContext, useMemo, useState } from "react";
import {
  adicionarItem, alterarQuantidadeItem, removerItem, calcularTotal, contarItens,
} from "../utils/carrinho";

const ContextoCarrinho = createContext(null);

export function ProvedorCarrinho({ children }) {
  const [itens, setItens] = useState([]); // [{ produto, quantidade }]

  const total = useMemo(() => calcularTotal(itens), [itens]);
  const quantidadeTotal = useMemo(() => contarItens(itens), [itens]);

  return (
    <ContextoCarrinho.Provider
      value={{
        itens,
        adicionarAoCarrinho: (produto) => setItens((atual) => adicionarItem(atual, produto)),
        removerDoCarrinho: (id) => setItens((atual) => removerItem(atual, id)),
        alterarQuantidade: (id, delta) => setItens((atual) => alterarQuantidadeItem(atual, id, delta)),
        limparCarrinho: () => setItens([]),
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
  if (!ctx) throw new Error("useCarrinho precisa ser usado dentro de um ProvedorCarrinho");
  return ctx;
}