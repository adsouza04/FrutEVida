import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { useProdutos } from "../contexto/ContextoProdutos";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useUsuario } from "../contexto/ContextoUsuario";
import ImagemProduto from "../componentes/ImagemProduto";
import CartaoProduto, { ESTOQUE_BAIXO } from "../componentes/CartaoProduto";
import SeletorQuantidade from "../componentes/SeletorQuantidade";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import EstadoVazio from "../componentes/EstadoVazio";
import { formatarPreco } from "../utils/validacoes";

export default function TelaProduto({ navigation, route }) {
  const { produtos } = useProdutos();
  const { adicionarAoCarrinho, quantidadeDe } = useCarrinho();
  const { ehFavorito, alternarFavorito } = useUsuario();
  const insets = useSafeAreaInsets();

  const produto = produtos.find((p) => String(p.id) === String(route?.params?.produtoId));
  const [quantidade, setQuantidade] = useState(1);
  const [aviso, setAviso] = useState(false);
  const opacidade = useRef(new Animated.Value(0)).current;

  const relacionados = useMemo(
    () => (produto ? produtos.filter((p) => p.categoria === produto.categoria && p.id !== produto.id).slice(0, 8) : []),
    [produtos, produto]
  );

  // Mensagem "adicionado ao carrinho" que aparece e some sozinha.
  useEffect(() => {
    if (!aviso) return;
    Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacidade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setAviso(false));
    }, 2200);
    return () => clearTimeout(t);
  }, [aviso, opacidade]);

  if (!produto) {
    return (
      <SafeAreaView style={s.container}>
        <EstadoVazio icone="alert-circle-outline" titulo="Produto indisponível" texto="Ele pode ter sido removido do catálogo." acao="Voltar" onAcao={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const noCarrinho = quantidadeDe(produto.id);
  const disponivel = Math.max(0, (produto.estoque ?? 99) - noCarrinho);
  const esgotado = (produto.estoque ?? 1) <= 0;
  const favorito = ehFavorito(produto.id);
  const economia = produto.preco_antigo ? produto.preco_antigo - produto.preco : 0;
  const desconto = produto.preco_antigo ? Math.round((economia / produto.preco_antigo) * 100) : 0;

  function aumentar() {
    if (quantidade >= disponivel) {
      Alert.alert("Estoque", disponivel ? `Temos só mais ${disponivel} unidade(s) disponível(is).` : "Você já tem todo o estoque no carrinho.");
      return;
    }
    setQuantidade(quantidade + 1);
  }

  function colocarNoCarrinho() {
    if (disponivel <= 0) {
      Alert.alert("Estoque esgotado", "Você já tem todo o estoque deste produto no carrinho.");
      return false;
    }
    adicionarAoCarrinho(produto, Math.min(quantidade, disponivel));
    setQuantidade(1);
    return true;
  }

  async function favoritar() {
    try {
      await alternarFavorito(produto.id);
    } catch {
      Alert.alert("Favoritos", "Não foi possível salvar o favorito. Verifique a conexão.");
    }
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View>
          <ImagemProduto produto={produto} estilo={[s.imagem, { height: 300 + insets.top }]} tamanhoEmoji={120} />
          <View style={[s.barraTopo, { top: insets.top + 8 }]}>
            <TouchableOpacity style={s.botaoRedondo} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
              <Icone nome="chevron-back" tamanho={22} />
            </TouchableOpacity>
            <TouchableOpacity style={s.botaoRedondo} onPress={() => navigation.navigate("Carrinho")} accessibilityLabel="Ir ao carrinho">
              <Icone nome="basket-outline" tamanho={21} />
            </TouchableOpacity>
          </View>
          {desconto > 0 && (
            <View style={s.seloOferta}>
              <Text style={s.seloOfertaTexto}>{desconto}% off</Text>
            </View>
          )}
        </View>

        <View style={s.cartao}>
          <Text style={s.nome}>{produto.nome}</Text>
          <Text style={s.meta}>{produto.categoria}, {produto.unidade}</Text>

          <View style={s.estoqueLinha}>
            <View style={[s.ponto, { backgroundColor: esgotado ? cores.perigo : produto.estoque <= ESTOQUE_BAIXO ? cores.secundaria : cores.primaria }]} />
            <Text style={s.estoqueTexto}>
              {esgotado ? "Esgotado no momento" : produto.estoque <= ESTOQUE_BAIXO ? `Últimas ${produto.estoque} unidades` : "Em estoque, colhido esta semana"}
            </Text>
          </View>

          {produto.preco_antigo ? <Text style={s.precoAntigo}>{formatarPreco(produto.preco_antigo)}</Text> : null}
          <Text style={s.preco}>{formatarPreco(produto.preco)}</Text>
          {economia > 0 ? <Text style={s.economia}>Você economiza {formatarPreco(economia)}</Text> : null}

          {produto.descricao ? <Text style={s.descricao}>{produto.descricao}</Text> : null}

          {!esgotado && (
            <>
              <Text style={s.rotulo}>Quantidade</Text>
              <View style={s.qtdLinha}>
                <SeletorQuantidade grande valor={quantidade} onDiminuir={() => setQuantidade(Math.max(1, quantidade - 1))} onAumentar={aumentar} />
                <Text style={s.qtdTotal}>{formatarPreco(produto.preco * quantidade)}</Text>
              </View>
              {noCarrinho > 0 && <Text style={s.jaNoCarrinho}>Você já tem {noCarrinho} no carrinho.</Text>}
            </>
          )}

          <View style={s.botoesLinha}>
            <Botao
              titulo={favorito ? "Favorito" : "Favoritar"}
              icone={favorito ? "heart" : "heart-outline"}
              variante="secundario"
              onPress={favoritar}
              estilo={{ flex: 1 }}
            />
            <Botao
              titulo="Comprar"
              onPress={() => colocarNoCarrinho() && navigation.navigate("Carrinho")}
              desabilitado={esgotado}
              estilo={{ flex: 1 }}
            />
          </View>
          <Botao
            titulo="Adicionar ao carrinho"
            icone="basket-outline"
            variante="escuro"
            onPress={() => colocarNoCarrinho() && setAviso(true)}
            desabilitado={esgotado}
            estilo={{ marginTop: 12 }}
          />
        </View>

        {relacionados.length > 0 && (
          <>
            <Text style={s.secaoTitulo}>Mais {produto.categoria.toLowerCase()}</Text>
            <FlatList
              horizontal
              data={relacionados}
              keyExtractor={(p) => String(p.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <CartaoProduto produto={item} largura={164} onPress={() => navigation.replace("Produto", { produtoId: item.id })} />
              )}
            />
          </>
        )}
      </ScrollView>

      {aviso && (
        <Animated.View style={[s.aviso, { bottom: insets.bottom + 16, opacity: opacidade }]}>
          <Icone nome="checkmark-circle" tamanho={20} cor={cores.branco} />
          <Text style={s.avisoTexto}>Adicionado ao carrinho</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Carrinho")}>
            <Text style={s.avisoLink}>Ver carrinho</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  imagem: { width: "100%", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  barraTopo: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  botaoRedondo: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: cores.superficie,
    alignItems: "center", justifyContent: "center",
  },
  seloOferta: {
    position: "absolute", left: 16, bottom: 16, backgroundColor: cores.secundaria,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  seloOfertaTexto: { color: cores.branco, fontWeight: "900", fontSize: 13 },
  cartao: {
    backgroundColor: cores.superficie, marginHorizontal: 16, marginTop: 16, borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: cores.borda,
  },
  nome: { fontSize: 24, fontWeight: "800", color: cores.texto, letterSpacing: -0.3 },
  meta: { fontSize: 14, color: cores.textoClaro, marginTop: 4 },
  estoqueLinha: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  ponto: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  estoqueTexto: { fontSize: 13, color: cores.texto },
  precoAntigo: { fontSize: 14, color: cores.textoClaro, textDecorationLine: "line-through", marginTop: 14 },
  preco: { fontSize: 30, fontWeight: "900", color: cores.primariaEscura, marginTop: 2 },
  economia: { fontSize: 13, color: cores.primaria, fontWeight: "700", marginTop: 2 },
  descricao: { fontSize: 15, color: cores.texto, lineHeight: 22, marginTop: 14 },
  rotulo: { fontSize: 14, fontWeight: "800", color: cores.texto, marginTop: 18, marginBottom: 8 },
  qtdLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtdTotal: { fontSize: 16, fontWeight: "800", color: cores.texto },
  jaNoCarrinho: { fontSize: 12, color: cores.textoClaro, marginTop: 6 },
  botoesLinha: { flexDirection: "row", gap: 12, marginTop: 20 },
  secaoTitulo: { fontSize: 18, fontWeight: "800", color: cores.texto, marginTop: 24, marginBottom: 12, paddingHorizontal: 16 },
  aviso: {
    position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: cores.primariaEscura, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  avisoTexto: { flex: 1, color: cores.branco, fontWeight: "700" },
  avisoLink: { color: cores.secundaria, fontWeight: "900" },
});
