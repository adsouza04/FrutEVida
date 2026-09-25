import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import cores from "../tema/cores";
import { CATEGORIAS } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";

export default function TelaAdmin({ navigation }) {
  const { produtos, adicionarProduto, editarProduto, excluirProduto } = useProdutos();
  const [modalVisivel, setModalVisivel] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);

  function abrirNovo() {
    setProdutoEmEdicao(null);
    setNome("");
    setPreco("");
    setCategoria(CATEGORIAS[0]);
    setModalVisivel(true);
  }

  function abrirEdicao(produto) {
    setProdutoEmEdicao(produto);
    setNome(produto.nome);
    setPreco(String(produto.preco).replace(".", ","));
    setCategoria(produto.categoria);
    setModalVisivel(true);
  }

  function handleSalvar() {
    const precoNumerico = parseFloat(preco.replace(",", "."));
    if (!nome || isNaN(precoNumerico)) {
      alert("Preencha o nome e um valor válido para o produto.");
      return;
    }
    const dados = { nome, preco: precoNumerico, categoria };
    if (produtoEmEdicao) {
      editarProduto(produtoEmEdicao.id, dados);
    } else {
      adicionarProduto(dados);
    }
    setModalVisivel(false);
  }

  function handleExcluir(produto) {
    excluirProduto(produto.id);
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={estilos.voltar}>←</Text>
        </TouchableOpacity>
        <Text style={estilos.titulo}>Administrar Produtos</Text>
        <TouchableOpacity onPress={abrirNovo}>
          <Text style={estilos.adicionar}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.linha}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.linhaNome}>{item.nome}</Text>
              <Text style={estilos.linhaCategoria}>{item.categoria}</Text>
            </View>
            <Text style={estilos.linhaPreco}>R$ {item.preco.toFixed(2)}</Text>
            <TouchableOpacity style={estilos.acaoBotao} onPress={() => abrirEdicao(item)}>
              <Text style={estilos.acaoTexto}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.acaoBotao} onPress={() => handleExcluir(item)}>
              <Text style={estilos.acaoTexto}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={estilos.modalFundo}>
          <View style={estilos.modalConteudo}>
            <Text style={estilos.modalTitulo}>
              {produtoEmEdicao ? "Editar Produto" : "Novo Produto"}
            </Text>

            <Text style={estilos.rotulo}>Nome do produto</Text>
            <TextInput style={estilos.campo} value={nome} onChangeText={setNome} />

            <Text style={estilos.rotulo}>Valor (R$)</Text>
            <TextInput
              style={estilos.campo}
              value={preco}
              onChangeText={setPreco}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />

            <Text style={estilos.rotulo}>Categoria</Text>
            <View style={estilos.categoriaLinha}>
              {CATEGORIAS.map((c) => {
                const ativo = c === categoria;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[estilos.categoriaChip, ativo && estilos.categoriaChipAtivo]}
                    onPress={() => setCategoria(c)}
                  >
                    <Text style={[estilos.categoriaChipTexto, ativo && estilos.categoriaChipTextoAtivo]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={estilos.modalBotoes}>
              <TouchableOpacity
                style={estilos.botaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.botaoSalvar} onPress={handleSalvar}>
                <Text style={estilos.botaoSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  voltar: { fontSize: 20, color: cores.texto },
  titulo: { fontSize: 16, fontWeight: "bold", color: cores.texto },
  adicionar: { fontSize: 22, color: cores.primaria, fontWeight: "bold" },
  lista: { paddingHorizontal: 20, paddingBottom: 20 },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  linhaNome: { fontSize: 13, fontWeight: "bold", color: cores.texto },
  linhaCategoria: { fontSize: 11, color: cores.textoClaro, marginTop: 2 },
  linhaPreco: { fontSize: 13, color: cores.primaria, fontWeight: "bold", marginRight: 12 },
  acaoBotao: { paddingHorizontal: 6 },
  acaoTexto: { fontSize: 16 },
  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalConteudo: {
    backgroundColor: cores.branco,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalTitulo: { fontSize: 16, fontWeight: "bold", color: cores.texto, marginBottom: 16 },
  rotulo: { fontSize: 12, color: cores.textoClaro, marginBottom: 6, marginTop: 10 },
  campo: {
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: cores.texto,
  },
  categoriaLinha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoriaChip: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoriaChipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  categoriaChipTexto: { fontSize: 12, color: cores.texto },
  categoriaChipTextoAtivo: { color: cores.branco, fontWeight: "bold" },
  modalBotoes: { flexDirection: "row", gap: 12, marginTop: 24 },
  botaoCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  botaoCancelarTexto: { color: cores.texto, fontWeight: "bold" },
  botaoSalvar: {
    flex: 1,
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  botaoSalvarTexto: { color: cores.branco, fontWeight: "bold" },
});
