import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { CATEGORIAS, CATEGORIA_ICONE } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import CartaoProduto from "../componentes/CartaoProduto";
import TituloAba from "../componentes/TituloAba";
import Icone from "../componentes/Icone";
import Botao from "../componentes/Botao";
import EstadoVazio from "../componentes/EstadoVazio";
import { useAlturaAbas } from "../componentes/BarraAbas";

const ORDENACOES = [
  { id: "nome", rotulo: "Nome (A a Z)" },
  { id: "menor", rotulo: "Menor preço" },
  { id: "maior", rotulo: "Maior preço" },
  { id: "desconto", rotulo: "Maior desconto" },
];

const FAIXAS = [
  { id: "todas", rotulo: "Todos os preços", min: 0, max: Infinity },
  { id: "ate5", rotulo: "Até R$ 5", min: 0, max: 5 },
  { id: "5a10", rotulo: "R$ 5 a R$ 10", min: 5, max: 10 },
  { id: "10a20", rotulo: "R$ 10 a R$ 20", min: 10, max: 20 },
  { id: "acima20", rotulo: "Acima de R$ 20", min: 20, max: Infinity },
];

// Remove acentos para "maca" encontrar "Maçã".
const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const percentualDesconto = (p) => (p.preco_antigo ? 1 - p.preco / p.preco_antigo : 0);

export default function TelaBuscar({ navigation, route }) {
  const params = route?.params || {};
  const { produtos, carregando, sincronizando, sincronizar } = useProdutos();
  const alturaAbas = useAlturaAbas();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState(params.categoria || null);
  const [soOfertas, setSoOfertas] = useState(Boolean(params.ofertas));
  const [ordem, setOrdem] = useState(params.ofertas ? "desconto" : "nome");
  const [faixa, setFaixa] = useState("todas");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const resultado = useMemo(() => {
    const termo = normalizar(busca.trim());
    const f = FAIXAS.find((x) => x.id === faixa);
    const lista = produtos.filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        (!soOfertas || p.preco_antigo) &&
        p.preco >= f.min && p.preco < f.max &&
        (!termo || normalizar(p.nome).includes(termo) || normalizar(p.categoria).includes(termo))
    );
    const comparar = {
      nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
      menor: (a, b) => a.preco - b.preco,
      maior: (a, b) => b.preco - a.preco,
      desconto: (a, b) => percentualDesconto(b) - percentualDesconto(a),
    }[ordem];
    return [...lista].sort(comparar);
  }, [produtos, busca, categoria, soOfertas, ordem, faixa]);

  const filtrosAtivos = (ordem !== "nome" ? 1 : 0) + (faixa !== "todas" ? 1 : 0);
  const rotuloOrdem = ORDENACOES.find((o) => o.id === ordem).rotulo;

  function limparTudo() {
    setBusca("");
    setCategoria(null);
    setSoOfertas(false);
    setOrdem("nome");
    setFaixa("todas");
  }

  const cabecalho = (
    <>
      <View style={s.linhaChips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip rotulo="Todas" ativo={!categoria} onPress={() => setCategoria(null)} />
          {CATEGORIAS.map((c) => (
            <Chip key={c} rotulo={c} icone={CATEGORIA_ICONE[c]} ativo={categoria === c} onPress={() => setCategoria(categoria === c ? null : c)} />
          ))}
        </ScrollView>
      </View>
      <View style={s.linhaChips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip rotulo={rotuloOrdem} iconeNome="swap-vertical" ativo={ordem !== "nome"} onPress={() => setFiltrosAbertos(true)} />
          <Chip rotulo="Ofertas" iconeNome="pricetag-outline" ativo={soOfertas} onPress={() => setSoOfertas(!soOfertas)} />
          {faixa !== "todas" && (
            <Chip rotulo={FAIXAS.find((x) => x.id === faixa).rotulo} iconeNome="close" ativo onPress={() => setFaixa("todas")} />
          )}
        </ScrollView>
      </View>
      <Text style={s.contagem}>
        {resultado.length} {resultado.length === 1 ? "produto encontrado" : "produtos encontrados"}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <TituloAba titulo="Buscar" />
      <View style={s.buscaLinha}>
        <View style={s.busca}>
          <Icone nome="search" tamanho={20} cor={cores.primaria} />
          <TextInput
            style={s.buscaInput}
            placeholder="Buscar produtos"
            placeholderTextColor={cores.placeholder}
            value={busca}
            onChangeText={setBusca}
            autoFocus={Boolean(params.focar)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {busca ? (
            <TouchableOpacity onPress={() => setBusca("")} accessibilityLabel="Limpar busca">
              <Icone nome="close-circle" tamanho={20} cor={cores.textoClaro} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={s.filtroBotao} onPress={() => setFiltrosAbertos(true)} accessibilityLabel="Filtros e ordenação">
          <Icone nome="options-outline" tamanho={22} cor={cores.branco} />
          {filtrosAtivos > 0 && (
            <View style={s.filtroBadge}><Text style={s.filtroBadgeTexto}>{filtrosAtivos}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={resultado}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={[s.conteudo, { paddingBottom: alturaAbas + 16 }]}
        ListHeaderComponent={cabecalho}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={sincronizando}
        onRefresh={sincronizar}
        renderItem={({ item }) => (
          <CartaoProduto produto={item} onPress={() => navigation.navigate("Produto", { produtoId: item.id })} />
        )}
        ListEmptyComponent={
          carregando ? (
            <Text style={s.carregando}>Carregando produtos...</Text>
          ) : (
            <EstadoVazio
              icone="search-outline"
              titulo="Nada encontrado"
              texto="Tente outro nome ou limpe os filtros."
              acao="Limpar filtros"
              onAcao={limparTudo}
            />
          )
        }
      />

      <Modal visible={filtrosAbertos} animationType="slide" transparent onRequestClose={() => setFiltrosAbertos(false)}>
        <TouchableOpacity style={s.modalFundo} activeOpacity={1} onPress={() => setFiltrosAbertos(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            <Text style={s.modalTitulo}>Filtros</Text>

            <Text style={s.modalSecao}>Ordenar por</Text>
            <View style={s.opcoes}>
              {ORDENACOES.map((o) => (
                <Chip key={o.id} rotulo={o.rotulo} ativo={ordem === o.id} onPress={() => setOrdem(o.id)} />
              ))}
            </View>

            <Text style={s.modalSecao}>Preço</Text>
            <View style={s.opcoes}>
              {FAIXAS.map((f) => (
                <Chip key={f.id} rotulo={f.rotulo} ativo={faixa === f.id} onPress={() => setFaixa(f.id)} />
              ))}
            </View>

            <View style={s.modalBotoes}>
              <Botao
                titulo="Limpar"
                variante="secundario"
                onPress={() => { setOrdem("nome"); setFaixa("todas"); }}
                estilo={{ flex: 1 }}
              />
              <Botao titulo="Ver resultados" onPress={() => setFiltrosAbertos(false)} estilo={{ flex: 1.4 }} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ rotulo, icone, iconeNome, ativo, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, ativo && s.chipAtivo]} onPress={onPress}>
      {icone ? <Text style={s.chipEmoji}>{icone}</Text> : null}
      {iconeNome ? (
        <Icone nome={iconeNome} tamanho={15} cor={ativo ? cores.branco : cores.texto} estilo={{ marginRight: 5 }} />
      ) : null}
      <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  buscaLinha: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  busca: {
    flex: 1, height: 50, borderRadius: 14, backgroundColor: cores.superficie, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: cores.borda, gap: 10,
  },
  buscaInput: { flex: 1, fontSize: 15, color: cores.texto },
  filtroBotao: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: cores.primariaEscura,
    alignItems: "center", justifyContent: "center",
  },
  filtroBadge: {
    position: "absolute", top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: cores.secundaria, alignItems: "center", justifyContent: "center",
  },
  filtroBadgeTexto: { color: cores.branco, fontSize: 10, fontWeight: "900" },
  conteudo: { paddingHorizontal: 16 },
  linhaChips: { marginHorizontal: -16, marginBottom: 8 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: "row", alignItems: "center", height: 36, paddingHorizontal: 14, borderRadius: 18,
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda,
  },
  chipAtivo: { backgroundColor: cores.primariaEscura, borderColor: cores.primariaEscura },
  chipEmoji: { fontSize: 15, marginRight: 6 },
  chipTexto: { fontSize: 13, color: cores.texto, fontWeight: "600" },
  chipTextoAtivo: { color: cores.branco },
  contagem: { fontSize: 13, color: cores.textoClaro, marginTop: 4, marginBottom: 12 },
  carregando: { textAlign: "center", color: cores.textoClaro, marginTop: 30 },
  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modal: { backgroundColor: cores.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: cores.texto },
  modalSecao: { fontSize: 14, fontWeight: "800", color: cores.texto, marginTop: 18, marginBottom: 10 },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalBotoes: { flexDirection: "row", gap: 12, marginTop: 24 },
});
