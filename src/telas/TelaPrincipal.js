import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { CATEGORIAS, CATEGORIA_ICONE } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useUsuario } from "../contexto/ContextoUsuario";
import ImagemProduto from "../componentes/ImagemProduto";
import { formatarPreco } from "../utils/validacoes";

const ESTOQUE_BAIXO = 5;

export default function TelaPrincipal({ navigation }) {
  const { produtos, carregando, sincronizando, sincronizar, status } = useProdutos();
  const { usuario, sair } = useUsuario();
  const { itens, adicionarAoCarrinho, quantidadeTotal, total, limparCarrinho } = useCarrinho();

  const insets = useSafeAreaInsets();
  const baseInferior = Math.max(insets.bottom, 12);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState(null);

  const ehAdmin = usuario?.perfil === "admin";
  const primeiroNome = usuario?.nome?.split(" ")[0];

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        (!termo || p.nome.toLowerCase().includes(termo))
    );
  }, [produtos, categoria, busca]);

  function quantidadeNoCarrinho(id) {
    return itens.find((i) => i.produto.id === id)?.quantidade || 0;
  }

  function adicionar(produto) {
    const noCarrinho = quantidadeNoCarrinho(produto.id);
    if (produto.estoque !== undefined && noCarrinho >= produto.estoque) {
      Alert.alert("Estoque esgotado", `Temos só ${produto.estoque} unidade(s) de ${produto.nome} no momento.`);
      return;
    }
    adicionarAoCarrinho(produto);
  }

  function confirmarSaida() {
    Alert.alert("Sair da conta", "Deseja sair? Os itens do carrinho serão descartados.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => { limparCarrinho(); sair(); navigation.replace("Login"); } },
    ]);
  }

  const cabecalho = (
    <>
      <View style={s.topo}>
        <View style={{ flex: 1 }}>
          <Text style={s.saudacao}>Olá{primeiroNome ? `, ${primeiroNome}` : ""}!</Text>
          <Text style={s.titulo}>O que vamos levar hoje?</Text>
        </View>

        <TouchableOpacity style={s.avatar} onPress={confirmarSaida} accessibilityLabel="Minha conta">
          <Text style={s.avatarTexto}>{(primeiroNome || "?").charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {status.online === false && (
        <TouchableOpacity style={s.aviso} onPress={sincronizar}>
          <Text style={s.avisoTexto}>
            Sem conexão com a loja. Você está vendo o catálogo salvo no celular. Toque para tentar de novo.
          </Text>
        </TouchableOpacity>
      )}
      {status.pendentes > 0 && (
        <View style={s.aviso}>
          <Text style={s.avisoTexto}>
            {status.pendentes} pedido(s) salvos no celular serão enviados assim que a conexão voltar.
          </Text>
        </View>
      )}

      <View style={s.busca}>
        <Text style={s.lupa}>⌕</Text>
        <TextInput
          style={s.buscaInput}
          placeholder="Buscar frutas, verduras e mais"
          placeholderTextColor={cores.placeholder}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
        />
        {busca ? (
          <TouchableOpacity onPress={() => setBusca("")} accessibilityLabel="Limpar busca">
            <Text style={s.limpar}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={s.banner}>
        <Text style={s.bannerTitulo}>Colhido fresco, entregue no seu horário.</Text>
        <Text style={s.bannerSub}>
          Monte sua cesta e escolha a janela de entrega no pagamento.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categorias}
      >
        <Chip rotulo="Todos" ativo={!categoria} onPress={() => setCategoria(null)} />
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            rotulo={c}
            icone={CATEGORIA_ICONE[c]}
            ativo={categoria === c}
            onPress={() => setCategoria(categoria === c ? null : c)}
          />
        ))}
      </ScrollView>

      <View style={s.secaoLinha}>
        <Text style={s.secaoTitulo}>{categoria || "Todos os produtos"}</Text>
        <Text style={s.secaoContagem}>
          {filtrados.length} {filtrados.length === 1 ? "item" : "itens"}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <FlatList
        data={filtrados}
        keyExtractor={(i) => String(i.id)}
        numColumns={2}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={s.conteudo}
        columnWrapperStyle={s.colunas}
        refreshing={sincronizando}
        onRefresh={sincronizar}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const esgotado = item.estoque !== undefined && item.estoque <= 0;
          const ultimas = !esgotado && item.estoque !== undefined && item.estoque <= ESTOQUE_BAIXO;
          const qtd = quantidadeNoCarrinho(item.id);
          return (
            <View style={[s.card, esgotado && { opacity: 0.55 }]}>
              <ImagemProduto produto={item} estilo={s.cardImagem} tamanhoEmoji={56} />
              {(esgotado || ultimas) && (
                <View style={[s.selo, esgotado && s.seloEsgotado]}>
                  <Text style={[s.seloTexto, esgotado && { color: cores.branco }]}>
                    {esgotado ? "Esgotado" : "Últimas unidades"}
                  </Text>
                </View>
              )}

              <Text style={s.cardNome} numberOfLines={1}>{item.nome}</Text>
              <Text style={s.unidade}>{item.unidade || item.categoria}</Text>

              <View style={s.cardRodape}>
                <Text style={s.preco}>{formatarPreco(item.preco)}</Text>
                <TouchableOpacity
                  testID={`adicionar-${item.id}`}
                  style={[s.mais, qtd > 0 && s.maisAtivo, esgotado && { backgroundColor: cores.borda }]}
                  onPress={() => adicionar(item)}
                  disabled={esgotado}
                  accessibilityLabel={`Adicionar ${item.nome} ao carrinho`}
                >
                  <Text style={s.maisTexto}>{qtd > 0 ? qtd : "+"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.vazioBox}>
            <Text style={s.vazioTitulo}>
              {carregando ? "Carregando produtos..." : "Nenhum produto encontrado"}
            </Text>
            {!carregando && (busca || categoria) ? (
              <TouchableOpacity onPress={() => { setBusca(""); setCategoria(null); }}>
                <Text style={s.vazioLink}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        ListFooterComponent={<View style={{ height: (quantidadeTotal > 0 ? 160 : 90) + baseInferior }} />}
      />

      {quantidadeTotal > 0 && (
        <TouchableOpacity style={[s.barraCarrinho, { bottom: baseInferior + 80 }]} onPress={() => navigation.navigate("Carrinho")}>
          <View style={s.barraQtd}>
            <Text style={s.barraQtdTexto}>{quantidadeTotal}</Text>
          </View>
          <Text style={s.barraTexto}>Ver carrinho</Text>
          <Text style={s.barraTotal}>{formatarPreco(total)}</Text>
        </TouchableOpacity>
      )}

      <View style={[s.nav, { bottom: baseInferior }]}>
        <ItemNav icone="⌂" rotulo="Início" ativo />
        <ItemNav icone="☰" rotulo="Pedidos" onPress={() => navigation.navigate("Pedidos")} />
        <ItemNav
          icone="🛒"
          rotulo="Carrinho"
          contador={quantidadeTotal}
          onPress={() => navigation.navigate("Carrinho")}
        />
        {ehAdmin && (
          <ItemNav icone="⚙" rotulo="Admin" onPress={() => navigation.navigate("Admin")} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Chip({ rotulo, icone, ativo, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, ativo && s.chipAtivo]} onPress={onPress}>
      {icone ? <Text style={s.chipIcone}>{icone}</Text> : null}
      <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

function ItemNav({ icone, rotulo, ativo, contador, onPress }) {
  return (
    <TouchableOpacity style={s.navItem} onPress={onPress} disabled={!onPress}>
      <View>
        <Text style={[s.navIcone, ativo && { color: cores.primaria }]}>{icone}</Text>
        {contador > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTexto}>{contador}</Text>
          </View>
        )}
      </View>
      <Text style={[s.navTexto, ativo && s.navAtivo]}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16 },
  colunas: { gap: 12 },

  topo: { flexDirection: "row", alignItems: "center", paddingTop: 12, paddingBottom: 16 },
  saudacao: { fontSize: 14, color: cores.textoClaro, fontWeight: "600" },
  titulo: { fontSize: 24, fontWeight: "800", color: cores.texto, marginTop: 2, letterSpacing: -0.3 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: cores.primaria,
    alignItems: "center", justifyContent: "center",
  },
  avatarTexto: { color: cores.branco, fontSize: 18, fontWeight: "800" },

  aviso: {
    backgroundColor: cores.destaque, borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: "#F1DFAE",
  },
  avisoTexto: { fontSize: 12, color: "#6B5418", lineHeight: 17 },

  busca: {
    height: 48, borderRadius: 14, backgroundColor: cores.superficie, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: cores.borda, marginBottom: 16,
  },
  lupa: { fontSize: 22, color: cores.primaria, marginRight: 8 },
  buscaInput: { flex: 1, fontSize: 15, color: cores.texto },
  limpar: { fontSize: 14, color: cores.textoClaro, paddingHorizontal: 4 },

  banner: { backgroundColor: cores.primaria, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 18 },
  bannerTitulo: { fontSize: 20, lineHeight: 25, fontWeight: "800", color: cores.branco, maxWidth: 260 },
  bannerSub: { fontSize: 13, lineHeight: 18, color: "#D5E6D6", marginTop: 6, maxWidth: 280 },

  categorias: { gap: 8, paddingVertical: 16, paddingRight: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", height: 38, paddingHorizontal: 14, borderRadius: 19,
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda,
  },
  chipAtivo: { backgroundColor: cores.primariaEscura, borderColor: cores.primariaEscura },
  chipIcone: { fontSize: 16, marginRight: 6 },
  chipTexto: { fontSize: 13, color: cores.texto, fontWeight: "600" },
  chipTextoAtivo: { color: cores.branco },

  secaoLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 },
  secaoTitulo: { fontSize: 18, fontWeight: "800", color: cores.texto },
  secaoContagem: { fontSize: 12, color: cores.textoClaro },

  card: {
    flex: 1, maxWidth: "48.5%", backgroundColor: cores.superficie, borderRadius: 18, padding: 8,
    marginBottom: 12, borderWidth: 1, borderColor: cores.borda,
  },
  cardImagem: { height: 128, borderRadius: 13 },
  selo: {
    position: "absolute", left: 14, top: 14, backgroundColor: cores.destaque,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  seloEsgotado: { backgroundColor: cores.perigo },
  seloTexto: { fontSize: 10, color: "#6B5418", fontWeight: "800" },
  cardNome: { fontSize: 14, fontWeight: "800", color: cores.texto, marginTop: 10, paddingHorizontal: 4 },
  unidade: { fontSize: 12, color: cores.textoClaro, marginTop: 2, paddingHorizontal: 4 },
  cardRodape: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, paddingLeft: 4,
  },
  preco: { fontSize: 15, fontWeight: "900", color: cores.primariaEscura },
  mais: {
    minWidth: 34, height: 34, borderRadius: 11, backgroundColor: cores.primaria,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 8,
  },
  maisAtivo: { backgroundColor: cores.secundaria },
  maisTexto: { fontSize: 17, color: cores.branco, fontWeight: "800" },

  vazioBox: { alignItems: "center", marginVertical: 40 },
  vazioTitulo: { color: cores.textoClaro, fontSize: 14 },
  vazioLink: { color: cores.primaria, fontWeight: "800", marginTop: 10 },

  barraCarrinho: {
    position: "absolute", left: 16, right: 16, bottom: 92, height: 56, borderRadius: 16,
    backgroundColor: cores.primariaEscura, flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    shadowColor: cores.sombra, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  barraQtd: {
    minWidth: 30, height: 30, borderRadius: 9, backgroundColor: cores.secundaria,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  barraQtdTexto: { color: cores.branco, fontWeight: "900" },
  barraTexto: { flex: 1, color: cores.branco, fontWeight: "800", fontSize: 15, marginLeft: 12 },
  barraTotal: { color: cores.branco, fontWeight: "900", fontSize: 15 },

  nav: {
    position: "absolute", left: 12, right: 12, bottom: 12, height: 68, borderRadius: 22,
    backgroundColor: cores.superficie, flexDirection: "row", justifyContent: "space-around",
    alignItems: "center", borderWidth: 1, borderColor: cores.borda,
  },
  navItem: { alignItems: "center", justifyContent: "center", minWidth: 64 },
  navIcone: { fontSize: 20, color: cores.textoClaro },
  navTexto: { fontSize: 11, color: cores.textoClaro, marginTop: 3 },
  navAtivo: { color: cores.primaria, fontWeight: "800" },
  badge: {
    position: "absolute", right: -10, top: -6, backgroundColor: cores.secundaria, minWidth: 18,
    height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeTexto: { fontSize: 10, color: cores.branco, fontWeight: "900" },
});
