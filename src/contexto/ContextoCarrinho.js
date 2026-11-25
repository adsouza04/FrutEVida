import React, { createContext, useContext, useMemo, useState } from "react";
import {
  adicionarItem, alterarQuantidadeItem, removerItem, calcularTotal, contarItens,
} from "../utils/carrinho";
import { calcularResumo, validarCupom } from "../utils/regrasPedido";

const ContextoCarrinho = createContext(null);

export function ProvedorCarrinho({ children }) {
  const [itens, setItens] = useState([]); 
  const [cupom, setCupom] = useState(null); 

  const total = useMemo(() => calcularTotal(itens), [itens]);
  const quantidadeTotal = useMemo(() => contarItens(itens), [itens]);

  function resumo(tipoEntrega = "padrao") {
    return calcularResumo({ subtotal: total, tipoEntrega, cupom });
  }

  function aplicarCupom(codigo) {
    const r = validarCupom(codigo, total);
    if (!r.valido) return r.erro;
    setCupom(r.cupom.codigo);
    return null;
  }

  function limparCarrinho() {
    setItens([]);
    setCupom(null);
  }

  return (
    <ContextoCarrinho.Provider
      value={{
        itens,
        adicionarAoCarrinho: (produto, quantidade = 1) => setItens((atual) => adicionarItem(atual, produto, quantidade)),
        removerDoCarrinho: (id) => setItens((atual) => removerItem(atual, id)),
        alterarQuantidade: (id, delta) => setItens((atual) => alterarQuantidadeItem(atual, id, delta)),
        quantidadeDe: (id) => itens.find((i) => i.produto.id === id)?.quantidade || 0,
        limparCarrinho,
        total,
        quantidadeTotal,
        cupom,
        aplicarCupom,
        removerCupom: () => setCupom(null),
        resumo,
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
