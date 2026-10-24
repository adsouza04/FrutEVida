import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../servicos/api";
import {
  carregarProdutosLocais, sincronizarProdutos, registrarAlteracaoLocal,
  enviarPedidosPendentes, contarPendentes,
} from "../servicos/sincronizacao";

const ContextoProdutos = createContext(null);

export function ProvedorProdutos({ children }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [status, setStatus] = useState({ online: null, sincronizadoEm: null, pendentes: 0, erro: null });

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      const fila = await enviarPedidosPendentes();
      const resultado = await sincronizarProdutos();
      setProdutos(resultado.produtos);
      setStatus({ online: true, sincronizadoEm: resultado.sincronizadoEm, pendentes: fila.restantes, erro: null });
      return { ok: true, ...fila, alterados: resultado.alterados };
    } catch (erro) {
      setStatus((s) => ({ ...s, online: false, erro: erro.message }));
      return { ok: false, erro: erro.message };
    } finally {
      setSincronizando(false);
      setCarregando(false);
    }
  }, []);

  // Abre primeiro com o que está salvo no celular e depois atualiza com o servidor.
  useEffect(() => {
    (async () => {
      try {
        const locais = await carregarProdutosLocais();
        if (locais.length) {
          setProdutos(locais);
          setCarregando(false);
        }
        const pendentes = await contarPendentes();
        setStatus((s) => ({ ...s, pendentes }));
      } catch (e) {
        console.warn("Cache local indisponível:", e);
      }
      await sincronizar();
    })();
  }, [sincronizar]);

  async function aplicar(produtoDoServidor) {
    setProdutos(await registrarAlteracaoLocal(produtoDoServidor));
  }

  // CRUD: grava no servidor primeiro; só atualiza a tela se o servidor confirmar.
  async function adicionarProduto(dados) {
    await aplicar(await api.criarProduto(dados));
  }

  async function editarProduto(id, dados) {
    await aplicar(await api.editarProduto(id, dados));
  }

  async function excluirProduto(id) {
    await api.excluirProduto(id);
    await aplicar({ id, ativo: false });
  }

  async function atualizarPendentes() {
    const pendentes = await contarPendentes();
    setStatus((s) => ({ ...s, pendentes }));
  }

  return (
    <ContextoProdutos.Provider
      value={{
        produtos, carregando, sincronizando, status,
        sincronizar, adicionarProduto, editarProduto, excluirProduto, atualizarPendentes,
      }}
    >
      {children}
    </ContextoProdutos.Provider>
  );
}

export function useProdutos() {
  const ctx = useContext(ContextoProdutos);
  if (!ctx) throw new Error("useProdutos precisa ser usado dentro de um ProvedorProdutos");
  return ctx;
}