import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "react-native";

import { ProvedorProdutos } from "./src/contexto/ContextoProdutos";
import { ProvedorCarrinho } from "./src/contexto/ContextoCarrinho";
import { ProvedorUsuario } from "./src/contexto/ContextoUsuario";

import { inicializarBanco } from "./src/dados/banco";

import TelaLogin from "./src/telas/TelaLogin";
import TelaCadastro from "./src/telas/TelaCadastro";
import TelaPrincipal from "./src/telas/TelaPrincipal";
import TelaCarrinho from "./src/telas/TelaCarrinho";
import TelaPagamento from "./src/telas/TelaPagamento";
import TelaAdmin from "./src/telas/TelaAdmin";

const TELAS = {
  Login: TelaLogin,
  Cadastro: TelaCadastro,
  Principal: TelaPrincipal,
  Carrinho: TelaCarrinho,
  Pagamento: TelaPagamento,
  Admin: TelaAdmin,
};

function Navegacao() {
  const [pilha, setPilha] = useState(["Login"]);

  const rotaAtual = pilha[pilha.length - 1];
  const TelaAtual = TELAS[rotaAtual] || TelaLogin;

  const navigation = useMemo(
    () => ({
      navigate: (nome) => {
        if (TELAS[nome]) {
          setPilha((anterior) => [...anterior, nome]);
        }
      },

      replace: (nome) => {
        if (TELAS[nome]) {
          setPilha((anterior) => [
            ...anterior.slice(0, -1),
            nome,
          ]);
        }
      },

      goBack: () => {
        setPilha((anterior) =>
          anterior.length > 1
            ? anterior.slice(0, -1)
            : anterior
        );
      },
    }),
    []
  );

  return <TelaAtual navigation={navigation} />;
}

export default function App() {
  useEffect(() => {
    async function prepararBanco() {
      try {
        await inicializarBanco();
      } catch (erro) {
        console.error(
          "Erro ao inicializar o banco de dados:",
          erro
        );
      }
    }

    prepararBanco();
  }, []);

  return (
    <ProvedorUsuario>
      <ProvedorProdutos>
        <ProvedorCarrinho>
          <StatusBar barStyle="dark-content" />
          <Navegacao />
        </ProvedorCarrinho>
      </ProvedorProdutos>
    </ProvedorUsuario>
  );
}