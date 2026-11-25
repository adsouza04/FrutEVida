import React, { useEffect, useMemo, useState } from "react";
import { StatusBar, BackHandler, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ProvedorProdutos } from "./src/contexto/ContextoProdutos";
import { ProvedorCarrinho } from "./src/contexto/ContextoCarrinho";
import { ProvedorUsuario } from "./src/contexto/ContextoUsuario";

import { inicializarBanco } from "./src/dados/banco";
import BarraAbas, { ABAS } from "./src/componentes/BarraAbas";

import TelaLogin from "./src/telas/TelaLogin";
import TelaCadastro from "./src/telas/TelaCadastro";
import TelaPrincipal from "./src/telas/TelaPrincipal";
import TelaBuscar from "./src/telas/TelaBuscar";
import TelaProduto from "./src/telas/TelaProduto";
import TelaCarrinho from "./src/telas/TelaCarrinho";
import TelaCheckout from "./src/telas/TelaCheckout";
import TelaPedidoConfirmado from "./src/telas/TelaPedidoConfirmado";
import TelaPedidos from "./src/telas/TelaPedidos";
import TelaRastreamento from "./src/telas/TelaRastreamento";
import TelaPerfil from "./src/telas/TelaPerfil";
import TelaFavoritos from "./src/telas/TelaFavoritos";
import TelaEndereco from "./src/telas/TelaEndereco";
import TelaAdmin from "./src/telas/TelaAdmin";

const TELAS = {
  Login: TelaLogin,
  Cadastro: TelaCadastro,
  Inicio: TelaPrincipal,
  Buscar: TelaBuscar,
  Produto: TelaProduto,
  Carrinho: TelaCarrinho,
  Checkout: TelaCheckout,
  PedidoConfirmado: TelaPedidoConfirmado,
  Pedidos: TelaPedidos,
  Rastreamento: TelaRastreamento,
  Perfil: TelaPerfil,
  Favoritos: TelaFavoritos,
  Endereco: TelaEndereco,
  Admin: TelaAdmin,
};

const ROTAS_ABAS = ABAS.map((a) => a.rota);

// Navegação própria em pilha: cada tela recebe navigation e route ({ nome, params }).
// Tocar numa aba recomeça a pilha naquela aba, como nos apps de compras.
function Navegacao() {
  const [pilha, setPilha] = useState([{ nome: "Login" }]);
  const rota = pilha[pilha.length - 1];
  const TelaAtual = TELAS[rota.nome] || TelaLogin;
  const ehAba = ROTAS_ABAS.includes(rota.nome);

  const navigation = useMemo(
    () => ({
      navigate: (nome, params) => {
        if (!TELAS[nome]) return;
        if (ROTAS_ABAS.includes(nome)) setPilha([{ nome, params }]);
        else setPilha((anterior) => [...anterior, { nome, params }]);
      },
      replace: (nome, params) => {
        if (TELAS[nome]) setPilha((anterior) => [...anterior.slice(0, -1), { nome, params }]);
      },
      // reset([{ nome, params }, ...]) troca a pilha inteira (ex.: depois de finalizar o pedido).
      reset: (rotas) => setPilha(rotas.filter((r) => TELAS[r.nome])),
      goBack: () => setPilha((anterior) => (anterior.length > 1 ? anterior.slice(0, -1) : anterior)),
    }),
    []
  );

  // Botão "voltar" do Android: volta uma tela; numa aba fora do Início, vai para o Início.
  useEffect(() => {
    const assinatura = BackHandler.addEventListener("hardwareBackPress", () => {
      if (pilha.length > 1) {
        navigation.goBack();
        return true;
      }
      if (ehAba && rota.nome !== "Inicio") {
        navigation.navigate("Inicio");
        return true;
      }
      return false;
    });
    return () => assinatura.remove();
  }, [pilha.length, ehAba, rota.nome, navigation]);

  return (
    <View style={{ flex: 1 }}>
      <TelaAtual key={`${pilha.length}-${rota.nome}`} navigation={navigation} route={rota} />
      {ehAba && <BarraAbas rotaAtual={rota.nome} navigation={navigation} />}
    </View>
  );
}

export default function App() {
  useEffect(() => {
    inicializarBanco().catch((erro) => console.error("Erro ao inicializar o banco de dados:", erro));
  }, []);

  return (
    <SafeAreaProvider>
      <ProvedorUsuario>
        <ProvedorProdutos>
          <ProvedorCarrinho>
            <StatusBar barStyle="dark-content" />
            <Navegacao />
          </ProvedorCarrinho>
        </ProvedorProdutos>
      </ProvedorUsuario>
    </SafeAreaProvider>
  );
}
