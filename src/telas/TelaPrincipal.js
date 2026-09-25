import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";

import cores from "../tema/cores";
import {
  CATEGORIAS,
  CATEGORIA_ICONE,
} from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import { useCarrinho } from "../contexto/ContextoCarrinho";

export default function TelaPrincipal({ navigation }) {
  const { produtos } = useProdutos();

  const {
    adicionarAoCarrinho,
    quantidadeTotal,
  } = useCarrinho();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState(null);

  const filtrados = useMemo(
    () =>
      produtos.filter(
        (p) =>
          (!categoria || p.categoria === categoria) &&
          (!busca ||
            p.nome
              .toLowerCase()
              .includes(busca.toLowerCase()))
      ),
    [produtos, categoria, busca]
  );

  const cabecalho = (
    <>
      <View style={s.topo}>
        <View>
          <Text style={s.saudacao}>Olá! 👋</Text>

          <Text style={s.titulo}>
            O que vamos levar hoje?
          </Text>
        </View>

        <TouchableOpacity
          style={s.avatar}
          onPress={() => navigation.navigate("Admin")}
        >
          <Text>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={s.busca}>
        <Text style={s.lupa}>⌕</Text>

        <TextInput
          style={s.buscaInput}
          placeholder="Buscar frutas, verduras e mais..."
          placeholderTextColor={cores.placeholder}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <View style={s.banner}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTag}>
            FRESQUINHO TODO DIA
          </Text>

          <Text style={s.bannerTitulo}>
            Mais cor e saúde{`\n`}na sua rotina.
          </Text>

          <Text style={s.bannerSub}>
            Produtos selecionados com carinho.
          </Text>
        </View>

        <Text style={s.bannerEmoji}>🥑</Text>
      </View>

      <View style={s.secaoLinha}>
        <Text style={s.secaoTitulo}>
          Categorias
        </Text>

        <Text style={s.verTodos}>
          Ver todas
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categorias}
      >
        {CATEGORIAS.map((c) => {
          const ativo = categoria === c;

          return (
            <TouchableOpacity
              key={c}
              style={s.categoriaItem}
              onPress={() =>
                setCategoria(ativo ? null : c)
              }
            >
              <View
                style={[
                  s.categoriaBolha,
                  ativo && s.categoriaBolhaAtiva,
                ]}
              >
                <Text style={s.categoriaEmoji}>
                  {CATEGORIA_ICONE[c]}
                </Text>
              </View>

              <Text
                style={[
                  s.categoriaTexto,
                  ativo && s.categoriaTextoAtivo,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.secaoLinha}>
        <View>
          <Text style={s.secaoTitulo}>
            {categoria || "Destaques da semana"}
          </Text>

          <Text style={s.secaoSub}>
            Escolhidos para você
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={filtrados}
        keyExtractor={(i) => i.id}
        numColumns={2}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={s.conteudo}
        columnWrapperStyle={s.colunas}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardImagem}>
              <View style={s.selo}>
                <Text style={s.seloTexto}>
                  FRESCO
                </Text>
              </View>

              <Text style={s.produtoEmoji}>
                {item.emoji ||
                  CATEGORIA_ICONE[item.categoria] ||
                  "🌱"}
              </Text>

              <TouchableOpacity style={s.favorito}>
                <Text>♡</Text>
              </TouchableOpacity>
            </View>

            <Text
              style={s.cardNome}
              numberOfLines={1}
            >
              {item.nome}
            </Text>

            <Text style={s.unidade}>
              {item.unidade || item.categoria}
            </Text>

            <View style={s.cardRodape}>
              <View>
                <Text style={s.preco}>
                  R${" "}
                  {item.preco
                    .toFixed(2)
                    .replace(".", ",")}
                </Text>
              </View>

              <TouchableOpacity
                style={s.mais}
                onPress={() =>
                  adicionarAoCarrinho(item)
                }
              >
                <Text style={s.maisTexto}>
                  ＋
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.vazio}>
            Nenhum produto encontrado.
          </Text>
        }
        ListFooterComponent={
          <View style={{ height: 100 }} />
        }
      />

      <View style={s.nav}>
        <TouchableOpacity style={s.navItem}>
          <Text style={s.navIcone}>⌂</Text>
          <Text style={s.navAtivo}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navItem}
          onPress={() => setCategoria(null)}
        >
          <Text style={s.navIcone}>▦</Text>
          <Text style={s.navTexto}>Produtos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navItem}
          onPress={() =>
            navigation.navigate("Carrinho")
          }
        >
          <View>
            <Text style={s.navIcone}>🛒</Text>

            {quantidadeTotal > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTexto}>
                  {quantidadeTotal}
                </Text>
              </View>
            )}
          </View>

          <Text style={s.navTexto}>Carrinho</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navItem}
          onPress={() =>
            navigation.navigate("Admin")
          }
        >
          <Text style={s.navIcone}>♙</Text>
          <Text style={s.navTexto}>Admin</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  conteudo: {
    paddingHorizontal: 18,
  },

  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 18,
  },

  saudacao: {
    fontSize: 13,
    color: cores.textoClaro,
    fontWeight: "600",
  },

  titulo: {
    fontSize: 23,
    fontWeight: "800",
    color: cores.texto,
    marginTop: 3,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
  },

  busca: {
    height: 50,
    borderRadius: 16,
    backgroundColor: cores.superficie,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: cores.borda,
    marginBottom: 18,
  },

  lupa: {
    fontSize: 22,
    color: cores.primaria,
    marginRight: 8,
  },

  buscaInput: {
    flex: 1,
    fontSize: 14,
    color: cores.texto,
  },

  banner: {
    backgroundColor: cores.primaria,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  bannerTag: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#CFE7C8",
  },

  bannerTitulo: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    color: cores.branco,
    marginTop: 7,
  },

  bannerSub: {
    fontSize: 11,
    color: "#DDECDD",
    marginTop: 7,
  },

  bannerEmoji: {
    fontSize: 72,
    transform: [{ rotate: "-12deg" }],
  },

  secaoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 24,
    marginBottom: 13,
  },

  secaoTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: cores.texto,
  },

  secaoSub: {
    fontSize: 11,
    color: cores.textoClaro,
    marginTop: 2,
  },

  verTodos: {
    fontSize: 12,
    color: cores.primaria,
    fontWeight: "700",
  },

  categorias: {
    gap: 16,
    paddingRight: 10,
  },

  categoriaItem: {
    alignItems: "center",
    width: 58,
  },

  categoriaBolha: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: "center",
    justifyContent: "center",
  },

  categoriaBolhaAtiva: {
    backgroundColor: cores.primariaClara,
    borderColor: cores.primaria,
  },

  categoriaEmoji: {
    fontSize: 26,
  },

  categoriaTexto: {
    fontSize: 10,
    color: cores.textoClaro,
    marginTop: 6,
    fontWeight: "600",
  },

  categoriaTextoAtivo: {
    color: cores.primaria,
    fontWeight: "800",
  },

  colunas: {
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: cores.borda,
  },

  cardImagem: {
    height: 118,
    borderRadius: 14,
    backgroundColor: "#F0F4EA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  produtoEmoji: {
    fontSize: 61,
  },

  selo: {
    position: "absolute",
    left: 7,
    top: 7,
    backgroundColor: cores.primariaClara,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  seloTexto: {
    fontSize: 7,
    color: cores.primaria,
    fontWeight: "900",
  },

  favorito: {
    position: "absolute",
    right: 8,
    top: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },

  cardNome: {
    fontSize: 13,
    fontWeight: "800",
    color: cores.texto,
    marginTop: 10,
  },

  unidade: {
    fontSize: 10,
    color: cores.textoClaro,
    marginTop: 2,
  },

  cardRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 9,
  },

  preco: {
    fontSize: 14,
    fontWeight: "900",
    color: cores.primariaEscura,
  },

  mais: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
  },

  maisTexto: {
    fontSize: 18,
    color: cores.branco,
    fontWeight: "700",
  },

  vazio: {
    textAlign: "center",
    color: cores.textoClaro,
    marginVertical: 30,
  },

  nav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    height: 68,
    borderRadius: 22,
    backgroundColor: cores.superficie,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.borda,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
  },

  navIcone: {
    fontSize: 19,
    color: cores.texto,
  },

  navTexto: {
    fontSize: 9,
    color: cores.textoClaro,
    marginTop: 3,
  },

  navAtivo: {
    fontSize: 9,
    color: cores.primaria,
    fontWeight: "800",
    marginTop: 3,
  },

  badge: {
    position: "absolute",
    right: -9,
    top: -6,
    backgroundColor: cores.secundaria,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeTexto: {
    fontSize: 9,
    color: cores.branco,
    fontWeight: "900",
  },
});