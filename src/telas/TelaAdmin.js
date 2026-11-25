import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert, Share, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { CATEGORIAS } from "../dados/produtos";
import { useProdutos } from "../contexto/ContextoProdutos";
import { useUsuario } from "../contexto/ContextoUsuario";
import { api } from "../servicos/api";
import Cabecalho from "../componentes/Cabecalho";
import ImagemProduto from "../componentes/ImagemProduto";
import CampoTexto from "../componentes/CampoTexto";
import SeloSituacao from "../componentes/SeloSituacao";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import { formatarPreco } from "../utils/validacoes";
import { formatarData, textoEntrega, emAndamento } from "../utils/pedidos";
import { proximoStatus, ETAPAS_PEDIDO } from "../utils/regrasPedido";

function horaCurta(iso) {
  if (!iso) return "nunca";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function mensagemErro(erro) {
  return erro.semConexao ? "Sem conexão com o servidor. Alterações precisam de internet." : erro.message;
}

export default function TelaAdmin({ navigation }) {
  const { usuario } = useUsuario();
  const [aba, setAba] = useState("produtos");

  if (usuario?.perfil !== "admin") {
    return (
      <SafeAreaView style={s.container}>
        <Cabecalho titulo="Administração" onVoltar={() => navigation.goBack()} />
        <View style={s.bloqueio}>
          <Text style={s.bloqueioTitulo}>Área restrita</Text>
          <Text style={s.bloqueioTexto}>Entre com uma conta de administrador para gerenciar a loja.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Administração" onVoltar={() => navigation.goBack()} />
      <View style={s.abas}>
        {[["produtos", "Produtos"], ["pedidos", "Pedidos"]].map(([id, rotulo]) => (
          <TouchableOpacity key={id} style={[s.aba, aba === id && s.abaAtiva]} onPress={() => setAba(id)}>
            <Text style={[s.abaTexto, aba === id && s.abaTextoAtiva]}>{rotulo}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {aba === "produtos" ? <PainelProdutos /> : <PainelPedidos />}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------- Produtos (CRUD)
const FORM_VAZIO = { nome: "", preco: "", precoAntigo: "", estoque: "", unidade: "", descricao: "", imagem: "", categoria: CATEGORIAS[0] };
const paraTexto = (n) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

function PainelProdutos() {
  const { produtos, status, sincronizando, sincronizar, adicionarProduto, editarProduto, excluirProduto } = useProdutos();
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? produtos.filter((p) => p.nome.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t)) : produtos;
  }, [produtos, busca]);

  const mudar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  function abrirNovo() {
    setProdutoEmEdicao(null);
    setForm(FORM_VAZIO);
    setModalVisivel(true);
  }

  function abrirEdicao(p) {
    setProdutoEmEdicao(p);
    setForm({
      nome: p.nome, preco: paraTexto(p.preco), precoAntigo: paraTexto(p.preco_antigo), estoque: String(p.estoque ?? 0),
      unidade: p.unidade || "", descricao: p.descricao || "", imagem: p.imagem || "", categoria: p.categoria,
    });
    setModalVisivel(true);
  }

  async function handleSalvar() {
    const preco = parseFloat(form.preco.replace(",", "."));
    if (!form.nome.trim() || isNaN(preco)) {
      Alert.alert("Produto", "Preencha o nome e um valor válido.");
      return;
    }
    const dados = {
      nome: form.nome.trim(),
      preco,
      preco_antigo: form.precoAntigo.trim() ? form.precoAntigo.replace(",", ".") : null,
      categoria: form.categoria,
      unidade: form.unidade.trim() || null,
      descricao: form.descricao.trim() || null,
      imagem: form.imagem.trim() || null,
    };
    if (form.estoque !== "") dados.estoque = parseInt(form.estoque, 10) || 0;

    setSalvando(true);
    try {
      if (produtoEmEdicao) await editarProduto(produtoEmEdicao.id, dados);
      else await adicionarProduto(dados);
      setModalVisivel(false);
    } catch (erro) {
      Alert.alert("Não foi possível salvar", mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir(p) {
    Alert.alert("Excluir produto", `Deseja excluir "${p.nome}" do catálogo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await excluirProduto(p.id);
          } catch (erro) {
            Alert.alert("Não foi possível excluir", mensagemErro(erro));
          }
        },
      },
    ]);
  }

  async function handleSincronizar() {
    const r = await sincronizar();
    if (!r.ok) {
      Alert.alert("Sincronização", "Não foi possível sincronizar: " + r.erro);
      return;
    }
    let msg = `Catálogo atualizado (${r.alterados} alteração(ões) recebida(s)).`;
    if (r.enviados) msg += `\n${r.enviados} pedido(s) offline enviado(s).`;
    if (r.recusados.length) msg += `\nRecusados pelo servidor: ${r.recusados.join(" | ")}`;
    Alert.alert("Sincronização", msg);
  }

  // Item 2.2: gera os dados em JSON para o dashboard (Análise de Dados e Estatística).
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
      Alert.alert("Exportação", mensagemErro(erro));
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={s.statusBox}>
        <View style={[s.statusPonto, { backgroundColor: status.online === false ? cores.perigo : cores.primaria }]} />
        <Text style={s.statusTexto}>
          {status.online === false ? "Offline, mostrando dados salvos no celular" : `Online, sincronizado às ${horaCurta(status.sincronizadoEm)}`}
          {status.pendentes > 0 ? `. ${status.pendentes} pedido(s) na fila` : ""}
        </Text>
      </View>

      <View style={s.acoesLinha}>
        <TouchableOpacity style={s.acaoSecundaria} onPress={handleSincronizar} disabled={sincronizando}>
          {sincronizando ? <ActivityIndicator size="small" color={cores.primaria} /> : (
            <><Icone nome="sync" tamanho={16} cor={cores.primaria} /><Text style={s.acaoSecundariaTexto}>Sincronizar</Text></>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.acaoPrimaria} onPress={handleGerarJson} disabled={exportando}>
          {exportando ? <ActivityIndicator size="small" color={cores.branco} /> : (
            <><Icone nome="code-download-outline" tamanho={16} cor={cores.branco} /><Text style={s.acaoPrimariaTexto}>Gerar JSON</Text></>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.buscaLinha}>
        <View style={s.busca}>
          <Icone nome="search" tamanho={18} cor={cores.textoClaro} />
          <TextInput
            style={s.buscaInput}
            value={busca}
            onChangeText={setBusca}
            placeholder={`Buscar entre ${produtos.length} produtos`}
            placeholderTextColor={cores.placeholder}
          />
        </View>
        <TouchableOpacity style={s.novoBotao} onPress={abrirNovo} accessibilityLabel="Novo produto">
          <Icone nome="add" tamanho={24} cor={cores.branco} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.lista}
        refreshing={sincronizando}
        onRefresh={sincronizar}
        ListEmptyComponent={<Text style={s.vazio}>Nenhum produto encontrado.</Text>}
        renderItem={({ item }) => (
          <View style={s.linha}>
            <ImagemProduto produto={item} estilo={s.miniatura} tamanhoEmoji={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.linhaNome} numberOfLines={1}>{item.nome}</Text>
              <Text style={s.linhaCategoria}>
                {item.categoria}, estoque {item.estoque ?? 0}{item.preco_antigo ? ", em oferta" : ""}
              </Text>
            </View>
            <Text style={s.linhaPreco}>{formatarPreco(item.preco)}</Text>
            <TouchableOpacity style={s.acaoBotao} onPress={() => abrirEdicao(item)} accessibilityLabel={`Editar ${item.nome}`}>
              <Icone nome="create-outline" tamanho={20} cor={cores.primaria} />
            </TouchableOpacity>
            <TouchableOpacity style={s.acaoBotao} onPress={() => handleExcluir(item)} accessibilityLabel={`Excluir ${item.nome}`}>
              <Icone nome="trash-outline" tamanho={20} cor={cores.perigo} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent onRequestClose={() => setModalVisivel(false)}>
        <KeyboardAvoidingView style={s.modalFundo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.modalConteudo}>
            <Text style={s.modalTitulo}>{produtoEmEdicao ? "Editar produto" : "Novo produto"}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <CampoTexto rotulo="Nome do produto" value={form.nome} onChangeText={mudar("nome")} />
              <View style={s.duasColunas}>
                <CampoTexto rotulo="Preço (R$)" value={form.preco} onChangeText={mudar("preco")} keyboardType="decimal-pad" placeholder="0,00" estilo={{ flex: 1 }} />
                <CampoTexto
                  rotulo="Preço antigo"
                  value={form.precoAntigo}
                  onChangeText={mudar("precoAntigo")}
                  keyboardType="decimal-pad"
                  placeholder="Só se em oferta"
                  estilo={{ flex: 1 }}
                />
              </View>
              <View style={s.duasColunas}>
                <CampoTexto rotulo="Estoque" value={form.estoque} onChangeText={mudar("estoque")} keyboardType="number-pad" placeholder="0" estilo={{ flex: 1 }} />
                <CampoTexto rotulo="Unidade" value={form.unidade} onChangeText={mudar("unidade")} placeholder="1 kg, maço..." estilo={{ flex: 1 }} />
              </View>

              <Text style={s.rotulo}>Categoria</Text>
              <View style={s.categoriaLinha}>
                {CATEGORIAS.map((c) => {
                  const ativo = c === form.categoria;
                  return (
                    <TouchableOpacity key={c} style={[s.categoriaChip, ativo && s.categoriaChipAtivo]} onPress={() => mudar("categoria")(c)}>
                      <Text style={[s.categoriaChipTexto, ativo && s.categoriaChipTextoAtivo]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <CampoTexto
                rotulo="Descrição"
                value={form.descricao}
                onChangeText={mudar("descricao")}
                multiline
                placeholder="Como o cliente vê na tela do produto"
                style={{ minHeight: 70, textAlignVertical: "top" }}
              />

              <Text style={s.rotulo}>Foto (link https://... ou /imagens/arquivo.jpg)</Text>
              <View style={s.fotoLinha}>
                <ImagemProduto produto={{ imagem: form.imagem.trim(), categoria: form.categoria, nome: form.nome }} estilo={s.previa} tamanhoEmoji={22} />
                <CampoTexto value={form.imagem} onChangeText={mudar("imagem")} autoCapitalize="none" autoCorrect={false} placeholder="Opcional" estilo={{ flex: 1, marginBottom: 0 }} />
              </View>

              <View style={s.modalBotoes}>
                <Botao titulo="Cancelar" variante="secundario" onPress={() => setModalVisivel(false)} estilo={{ flex: 1 }} />
                <Botao titulo="Salvar" onPress={handleSalvar} carregando={salvando} estilo={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------- Pedidos (etapas da entrega)
function PainelPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [soAndamento, setSoAndamento] = useState(true);
  const [avancando, setAvancando] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPedidos(await api.listarTodosPedidos());
    } catch (erro) {
      Alert.alert("Pedidos", mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function avancar(pedido) {
    setAvancando(pedido.id);
    try {
      const atualizado = await api.avancarPedido(pedido.id);
      setPedidos((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)));
    } catch (erro) {
      Alert.alert("Pedido", mensagemErro(erro));
    } finally {
      setAvancando(null);
    }
  }

  const lista = soAndamento ? pedidos.filter((p) => emAndamento(p.status)) : pedidos;
  const tituloEtapa = (status) => ETAPAS_PEDIDO.find((e) => e.status === status)?.titulo;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.filtroLinha}>
        <TouchableOpacity style={[s.filtroChip, soAndamento && s.filtroChipAtivo]} onPress={() => setSoAndamento(true)}>
          <Text style={[s.filtroChipTexto, soAndamento && { color: cores.branco }]}>Em andamento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.filtroChip, !soAndamento && s.filtroChipAtivo]} onPress={() => setSoAndamento(false)}>
          <Text style={[s.filtroChipTexto, !soAndamento && { color: cores.branco }]}>Todos ({pedidos.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={s.lista}
        refreshing={carregando}
        onRefresh={carregar}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={!carregando ? <Text style={s.vazio}>Nenhum pedido em andamento.</Text> : null}
        renderItem={({ item }) => {
          const proximo = proximoStatus(item.status);
          return (
            <View style={s.pedido}>
              <View style={s.pedidoTopo}>
                <Text style={s.pedidoCodigo}>{item.codigo}</Text>
                <SeloSituacao status={item.status} />
              </View>
              <Text style={s.pedidoInfo}>{item.cliente || "Cliente"}, {formatarData(item.data_pedido)}</Text>
              <Text style={s.pedidoInfo}>{textoEntrega(item)}</Text>
              {item.endereco_entrega && (
                <Text style={s.pedidoInfo} numberOfLines={1}>
                  {item.endereco_entrega.rua}, {item.endereco_entrega.numero} - {item.endereco_entrega.bairro}
                </Text>
              )}
              <View style={s.pedidoRodape}>
                <Text style={s.pedidoTotal}>{formatarPreco(item.valor_total)}</Text>
                {proximo ? (
                  <TouchableOpacity style={s.avancar} onPress={() => avancar(item)} disabled={avancando === item.id}>
                    {avancando === item.id ? <ActivityIndicator color={cores.branco} size="small" /> : (
                      <Text style={s.avancarTexto}>Marcar: {tituloEtapa(proximo)}</Text>
                    )}
                  </TouchableOpacity>
                ) : item.status === "aguardando_pagamento" ? (
                  <Text style={s.pedidoAviso}>Aguardando pagamento</Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  bloqueio: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  bloqueioTitulo: { fontSize: 18, fontWeight: "800", color: cores.texto },
  bloqueioTexto: { fontSize: 14, color: cores.textoClaro, textAlign: "center", marginTop: 6, lineHeight: 20 },
  abas: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 12, backgroundColor: cores.superficie,
    borderRadius: 14, padding: 4, borderWidth: 1, borderColor: cores.borda,
  },
  aba: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  abaAtiva: { backgroundColor: cores.primariaEscura },
  abaTexto: { fontSize: 14, fontWeight: "700", color: cores.texto },
  abaTextoAtiva: { color: cores.branco },
  statusBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 10 },
  statusPonto: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTexto: { fontSize: 12, color: cores.textoClaro, flex: 1 },
  acoesLinha: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  acaoSecundaria: {
    flex: 1, flexDirection: "row", gap: 6, borderWidth: 1.5, borderColor: cores.primaria, borderRadius: 12,
    height: 42, alignItems: "center", justifyContent: "center",
  },
  acaoSecundariaTexto: { color: cores.primaria, fontWeight: "800", fontSize: 13 },
  acaoPrimaria: {
    flex: 1, flexDirection: "row", gap: 6, backgroundColor: cores.secundaria, borderRadius: 12,
    height: 42, alignItems: "center", justifyContent: "center",
  },
  acaoPrimariaTexto: { color: cores.branco, fontWeight: "800", fontSize: 13 },
  buscaLinha: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 6 },
  busca: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8,
  },
  buscaInput: { flex: 1, fontSize: 14, color: cores.texto },
  novoBotao: { width: 46, height: 46, borderRadius: 12, backgroundColor: cores.primaria, alignItems: "center", justifyContent: "center" },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  vazio: { textAlign: "center", color: cores.textoClaro, marginTop: 30 },
  linha: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.borda },
  miniatura: { width: 48, height: 48, borderRadius: 10 },
  linhaNome: { fontSize: 14, fontWeight: "800", color: cores.texto },
  linhaCategoria: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  linhaPreco: { fontSize: 14, color: cores.primariaEscura, fontWeight: "800", marginHorizontal: 8 },
  acaoBotao: { padding: 6 },
  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalConteudo: {
    backgroundColor: cores.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 28, maxHeight: "90%",
  },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: cores.texto, marginBottom: 14 },
  duasColunas: { flexDirection: "row", gap: 12 },
  rotulo: { fontSize: 13, fontWeight: "700", color: cores.texto, marginBottom: 8 },
  categoriaLinha: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  categoriaChip: { borderWidth: 1.5, borderColor: cores.borda, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  categoriaChipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  categoriaChipTexto: { fontSize: 13, color: cores.texto },
  categoriaChipTextoAtivo: { color: cores.branco, fontWeight: "800" },
  fotoLinha: { flexDirection: "row", alignItems: "center", gap: 10 },
  previa: { width: 52, height: 52, borderRadius: 12 },
  modalBotoes: { flexDirection: "row", gap: 12, marginTop: 22 },
  filtroLinha: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filtroChip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: cores.superficie,
    borderWidth: 1, borderColor: cores.borda, justifyContent: "center",
  },
  filtroChipAtivo: { backgroundColor: cores.primariaEscura, borderColor: cores.primariaEscura },
  filtroChipTexto: { fontSize: 13, fontWeight: "700", color: cores.texto },
  pedido: { backgroundColor: cores.superficie, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: cores.borda },
  pedidoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pedidoCodigo: { fontSize: 16, fontWeight: "900", color: cores.texto },
  pedidoInfo: { fontSize: 13, color: cores.textoClaro, marginTop: 3 },
  pedidoRodape: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  pedidoTotal: { fontSize: 16, fontWeight: "900", color: cores.primariaEscura },
  avancar: { backgroundColor: cores.primaria, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, minWidth: 120, alignItems: "center" },
  avancarTexto: { color: cores.branco, fontWeight: "800", fontSize: 13 },
  pedidoAviso: { fontSize: 12, color: "#6B5418", fontWeight: "700" },
});
