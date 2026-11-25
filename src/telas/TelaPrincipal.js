import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { CATEGORIAS, CATEGORIA_ICONE } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import { useUsuario } from "../contexto/ContextoUsuario";
import CartaoProduto from "../componentes/CartaoProduto";
import Icone from "../componentes/Icone";
import { useAlturaAbas } from "../componentes/BarraAbas";
import { FRETE_GRATIS_A_PARTIR_DE } from "../utils/regrasPedido";

export default function TelaPrincipal({ navigation }) {
  const { produtos, carregando, sincronizando, sincronizar, status } = useProdutos();
  const { usuario } = useUsuario();
  const alturaAbas = useAlturaAbas();
  const primeiroNome = usuario?.nome?.split(" ")[0];

  const ofertas = useMemo(() => produtos.filter((p) => p.preco_antigo && p.estoque > 0), [produtos]);
  const destaques = useMemo(() => {
    const lista = produtos.filter((p) => p.destaque);
    return lista.length ? lista : produtos.slice(0, 8);
  }, [produtos]);

  const abrirProduto = (p) => navigation.navigate("Produto", { produtoId: p.id });
  const abrirCategoria = (c) => navigation.navigate("Buscar", { categoria: c });

  const cabecalho = (
    <>
      <View style={s.topo}>
        <View style={{ flex: 1 }}>
          <Text style={s.saudacao}>Olá{primeiroNome ? `, ${primeiroNome}` : ""}!</Text>
          <Text style={s.titulo}>O que vamos levar hoje?</Text>
        </View>
        <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate("Perfil")} accessibilityLabel="Meu perfil">
          <Text style={s.avatarTexto}>{(primeiroNome || "?").charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {status.online === false && (
        <TouchableOpacity style={s.aviso} onPress={sincronizar}>
          <Icone nome="cloud-offline-outline" tamanho={18} cor="#6B5418" estilo={{ marginRight: 8 }} />
          <Text style={s.avisoTexto}>Sem conexão com a loja. Mostrando o catálogo salvo. Toque para tentar de novo.</Text>
        </TouchableOpacity>
      )}
      {status.pendentes > 0 && (
        <View style={s.aviso}>
          <Icone nome="time-outline" tamanho={18} cor="#6B5418" estilo={{ marginRight: 8 }} />
          <Text style={s.avisoTexto}>{status.pendentes} pedido(s) salvos no celular serão enviados quando a conexão voltar.</Text>
        </View>
      )}

      <TouchableOpacity style={s.busca} onPress={() => navigation.navigate("Buscar", { focar: true })} activeOpacity={0.8}>
        <Icone nome="search" tamanho={20} cor={cores.primaria} />
        <Text style={s.buscaTexto}>Buscar frutas, verduras e mais</Text>
      </TouchableOpacity>

      <View style={s.banner}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitulo}>Colhido fresco, entregue no seu horário.</Text>
          <Text style={s.bannerSub}>
            Frete grátis a partir de R$ {FRETE_GRATIS_A_PARTIR_DE},00. Use o cupom BEMVINDO5 e ganhe R$ 5 em compras acima de R$ 30.
          </Text>
        </View>
        <Icone nome="leaf" tamanho={54} cor="rgba(255,255,255,0.22)" />
      </View>

      <Text style={s.secaoTitulo}>Categorias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categorias}>
        {CATEGORIAS.map((c) => (
          <TouchableOpacity key={c} style={s.categoria} onPress={() => abrirCategoria(c)}>
            <View style={s.categoriaBolha}>
              <Text style={s.categoriaEmoji}>{CATEGORIA_ICONE[c]}</Text>
            </View>
            <Text style={s.categoriaTexto}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {ofertas.length > 0 && (
        <>
          <View style={s.secaoLinha}>
            <Text style={s.secaoTitulo}>Ofertas da semana</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Buscar", { ofertas: true })}>
              <Text style={s.verTodos}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={ofertas}
            keyExtractor={(p) => `oferta-${p.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            renderItem={({ item }) => <CartaoProduto produto={item} largura={164} onPress={() => abrirProduto(item)} />}
          />
        </>
      )}

      <View style={[s.secaoLinha, { marginTop: 8 }]}>
        <Text style={s.secaoTitulo}>Mais pedidos</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Buscar")}>
          <Text style={s.verTodos}>Ver catálogo</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <FlatList
        data={destaques}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={[s.conteudo, { paddingBottom: alturaAbas + 16 }]}
        ListHeaderComponent={cabecalho}
        refreshing={sincronizando}
        onRefresh={sincronizar}
        renderItem={({ item }) => <CartaoProduto produto={item} onPress={() => abrirProduto(item)} />}
        ListEmptyComponent={
          <Text style={s.vazio}>{carregando ? "Carregando produtos..." : "Nenhum produto disponível no momento."}</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16 },
  topo: { flexDirection: "row", alignItems: "center", paddingTop: 12, paddingBottom: 16 },
  saudacao: { fontSize: 14, color: cores.textoClaro, fontWeight: "600" },
  titulo: { fontSize: 24, fontWeight: "800", color: cores.texto, marginTop: 2, letterSpacing: -0.3 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: cores.primaria, alignItems: "center", justifyContent: "center",
  },
  avatarTexto: { color: cores.branco, fontSize: 18, fontWeight: "800" },
  aviso: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.destaque, borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: "#F1DFAE",
  },
  avisoTexto: { flex: 1, fontSize: 12, color: "#6B5418", lineHeight: 17 },
  busca: {
    height: 50, borderRadius: 14, backgroundColor: cores.superficie, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, borderWidth: 1, borderColor: cores.borda, marginBottom: 16, gap: 10,
  },
  buscaTexto: { fontSize: 15, color: cores.placeholder },
  banner: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.primaria, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 18, overflow: "hidden",
  },
  bannerTitulo: { fontSize: 19, lineHeight: 24, fontWeight: "800", color: cores.branco },
  bannerSub: { fontSize: 13, lineHeight: 18, color: "#D5E6D6", marginTop: 6 },
  secaoLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  secaoTitulo: { fontSize: 18, fontWeight: "800", color: cores.texto, marginTop: 20, marginBottom: 12 },
  verTodos: { fontSize: 13, color: cores.primaria, fontWeight: "800" },
  categorias: { gap: 14, paddingRight: 16 },
  categoria: { alignItems: "center", width: 66 },
  categoriaBolha: {
    width: 62, height: 62, borderRadius: 20, backgroundColor: cores.superficie, borderWidth: 1,
    borderColor: cores.borda, alignItems: "center", justifyContent: "center",
  },
  categoriaEmoji: { fontSize: 28 },
  categoriaTexto: { fontSize: 12, color: cores.texto, marginTop: 6, fontWeight: "600" },
  vazio: { textAlign: "center", color: cores.textoClaro, marginVertical: 30 },
});
