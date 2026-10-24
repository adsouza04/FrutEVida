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
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import cores from "../tema/cores";
import { CATEGORIAS } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import { api } from "../servicos/api";
import { formatarPreco } from "../utils/validacoes";

function horaCurta(iso) {
  if (!iso) return "nunca";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TelaAdmin({ navigation }) {
  const {
    produtos, status, sincronizando, sincronizar,
    adicionarProduto, editarProduto, excluirProduto,
  } = useProdutos();
  const [modalVisivel, setModalVisivel] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  function abrirNovo() {
    setProdutoEmEdicao(null);
    setNome("");
    setPreco("");
    setEstoque("");
    setCategoria(CATEGORIAS[0]);
    setModalVisivel(true);
  }

  function abrirEdicao(produto) {
    setProdutoEmEdicao(produto);
    setNome(produto.nome);
    setPreco(String(produto.preco).replace(".", ","));
    setEstoque(String(produto.estoque ?? 0));
    setCategoria(produto.categoria);
    setModalVisivel(true);
  }

  function mensagemErro(erro) {
    return erro.semConexao
      ? "Sem conexão com o servidor. Alterações de produtos precisam de internet."
      : erro.message;
  }

  async function handleSalvar() {
    const precoNumerico = parseFloat(preco.replace(",", "."));
    if (!nome.trim() || isNaN(precoNumerico)) {
      alert("Preencha o nome e um valor válido para o produto.");
      return;
    }
    const dados = { nome: nome.trim(), preco: precoNumerico, categoria };
    if (estoque !== "") dados.estoque = parseInt(estoque, 10) || 0;

    setSalvando(true);
    try {
      if (produtoEmEdicao) {
        await editarProduto(produtoEmEdicao.id, dados);
      } else {
        await adicionarProduto(dados);
      }
      setModalVisivel(false);
    } catch (erro) {
      alert(mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir(produto) {
    Alert.alert("Excluir produto", `Deseja excluir "${produto.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await excluirProduto(produto.id);
          } catch (erro) {
            alert(mensagemErro(erro));
          }
        },
      },
    ]);
  }

  async function handleSincronizar() {
    const r = await sincronizar();
    if (!r.ok) {
      alert("Não foi possível sincronizar: " + r.erro);
      return;
    }
    let msg = `Catálogo atualizado (${r.alterados} alteração(ões) recebida(s)).`;
    if (r.enviados) msg += `\n${r.enviados} pedido(s) offline enviado(s).`;
    if (r.recusados.length) msg += `\nRecusados pelo servidor: ${r.recusados.join(" | ")}`;
    alert(msg);
  }

  // Item 2.2 — gera os dados em JSON para o dashboard (Análise de Dados e Estatística).
  async function handleGerarJson() {
    setExportando(true);
    try {
      const dados = await api.exportarJson();
      const { resumo } = dados;
      Alert.alert(
        "JSON gerado!",
        `Arquivo salvo no servidor: backend/exportacoes/${dados.arquivo}\n\n` +
          `Produtos: ${resumo.total_produtos}\nClientes: ${resumo.total_clientes}\n` +
          `Pedidos: ${resumo.total_pedidos}\nFaturamento: ${formatarPreco(resumo.faturamento_total)}`,
        [
          { text: "OK" },
          {
            text: "Compartilhar",
            onPress: () => {
              const { arquivo, ...conteudo } = dados;
              Share.share({ title: arquivo, message: JSON.stringify(conteudo, null, 2) });
            },
          },
        ]
      );
    } catch (erro) {
      alert(mensagemErro(erro));
    } finally {
      setExportando(false);
    }
  }

  const textoStatus =
    status.online === false
      ? "Offline · mostrando dados salvos no celular"
      : `Online · sincronizado às ${horaCurta(status.sincronizadoEm)}`;

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

      <View style={estilos.statusBox}>
        <View style={[estilos.statusPonto, { backgroundColor: status.online === false ? cores.perigo : cores.primaria }]} />
        <Text style={estilos.statusTexto}>
          {textoStatus}
          {status.pendentes > 0 ? ` · ${status.pendentes} pedido(s) na fila` : ""}
        </Text>
      </View>

      <View style={estilos.acoesLinha}>
        <TouchableOpacity style={estilos.acaoSecundaria} onPress={handleSincronizar} disabled={sincronizando}>
          {sincronizando ? (
            <ActivityIndicator size="small" color={cores.primaria} />
          ) : (
            <Text style={estilos.acaoSecundariaTexto}>⟳ Sincronizar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={estilos.acaoPrimaria} onPress={handleGerarJson} disabled={exportando}>
          {exportando ? (
            <ActivityIndicator size="small" color={cores.branco} />
          ) : (
            <Text style={estilos.acaoPrimariaTexto}>{"{ }"} Gerar JSON</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        refreshing={sincronizando}
        onRefresh={sincronizar}
        ListEmptyComponent={
          <Text style={estilos.vazio}>Nenhum produto. Verifique a conexão com o servidor.</Text>
        }
        renderItem={({ item }) => (
          <View style={estilos.linha}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.linhaNome}>{item.nome}</Text>
              <Text style={estilos.linhaCategoria}>
                {item.categoria} · estoque {item.estoque ?? 0}
              </Text>
            </View>
            <Text style={estilos.linhaPreco}>{formatarPreco(item.preco)}</Text>
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

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.rotulo}>Valor (R$)</Text>
                <TextInput
                  style={estilos.campo}
                  value={preco}
                  onChangeText={setPreco}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.rotulo}>Estoque</Text>
                <TextInput
                  style={estilos.campo}
                  value={estoque}
                  onChangeText={setEstoque}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>

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
              <TouchableOpacity style={estilos.botaoSalvar} onPress={handleSalvar} disabled={salvando}>
                {salvando ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={estilos.botaoSalvarTexto}>Salvar</Text>
                )}
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
  statusBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 10 },
  statusPonto: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTexto: { fontSize: 11, color: cores.textoClaro, flex: 1 },
  acoesLinha: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  acaoSecundaria: {
    flex: 1, borderWidth: 1, borderColor: cores.primaria, borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
  },
  acaoSecundariaTexto: { color: cores.primaria, fontWeight: "bold", fontSize: 13 },
  acaoPrimaria: {
    flex: 1, backgroundColor: cores.secundaria, borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
  },
  acaoPrimariaTexto: { color: cores.branco, fontWeight: "bold", fontSize: 13 },
  vazio: { textAlign: "center", color: cores.textoClaro, marginTop: 30 },
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