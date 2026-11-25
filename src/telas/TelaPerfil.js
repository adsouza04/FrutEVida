import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import TituloAba from "../componentes/TituloAba";
import Icone from "../componentes/Icone";
import Botao from "../componentes/Botao";
import { useAlturaAbas } from "../componentes/BarraAbas";
import { mascararTelefone, ocultarCpf } from "../utils/mascaras";

export default function TelaPerfil({ navigation }) {
  const { usuario, favoritos, sair } = useUsuario();
  const { limparCarrinho } = useCarrinho();
  const alturaAbas = useAlturaAbas();

  if (!usuario) return null;
  const ehAdmin = usuario.perfil === "admin";
  const iniciais = usuario.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const end = usuario.endereco;

  function confirmarSaida() {
    Alert.alert("Sair da conta", "Deseja sair? Os itens do carrinho serão descartados.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          limparCarrinho();
          sair();
          navigation.reset([{ nome: "Login" }]);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <TituloAba titulo="Perfil" />
      <ScrollView contentContainerStyle={[s.conteudo, { paddingBottom: alturaAbas + 20 }]}>
        <View style={s.cabecalho}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>{iniciais}</Text>
          </View>
          <Text style={s.nome}>{usuario.nome}</Text>
          <Text style={s.email}>{usuario.email}</Text>
          {ehAdmin && (
            <View style={s.seloAdmin}><Text style={s.seloAdminTexto}>Administrador</Text></View>
          )}
        </View>

        <View style={s.cartao}>
          <Dado rotulo="CPF" valor={ocultarCpf(usuario.cpf) || "Não informado"} />
          <Dado rotulo="Telefone" valor={usuario.telefone ? mascararTelefone(usuario.telefone) : "Não informado"} />
          <Dado
            rotulo="Endereço de entrega"
            valor={end ? `${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}` : "Informe na primeira compra"}
            ultimo
          />
        </View>

        <View style={s.cartao}>
          <ItemMenu icone="receipt-outline" titulo="Meus pedidos" onPress={() => navigation.navigate("Pedidos")} />
          <ItemMenu
            icone="heart-outline"
            titulo="Favoritos"
            detalhe={favoritos.length ? String(favoritos.length) : null}
            onPress={() => navigation.navigate("Favoritos")}
          />
          <ItemMenu icone="location-outline" titulo="Endereço de entrega" onPress={() => navigation.navigate("Endereco")} />
          <ItemMenu
            icone="pricetags-outline"
            titulo="Cupons disponíveis"
            onPress={() =>
              Alert.alert(
                "Cupons disponíveis",
                "FRUTA10: 10% de desconto nos produtos\nFRETEGRATIS: frete grátis\nBEMVINDO5: R$ 5,00 off em compras a partir de R$ 30"
              )
            }
            ultimo={!ehAdmin}
          />
          {ehAdmin && (
            <ItemMenu icone="settings-outline" titulo="Administração da loja" onPress={() => navigation.navigate("Admin")} ultimo />
          )}
        </View>

        <Botao titulo="Sair da conta" icone="log-out-outline" variante="perigo" onPress={confirmarSaida} />
        <Text style={s.versao}>Frut & Vida, versão 2.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Dado({ rotulo, valor, ultimo }) {
  return (
    <View style={[s.dado, !ultimo && s.separador]}>
      <Text style={s.dadoRotulo}>{rotulo}</Text>
      <Text style={s.dadoValor}>{valor}</Text>
    </View>
  );
}

function ItemMenu({ icone, titulo, detalhe, onPress, ultimo }) {
  return (
    <TouchableOpacity style={[s.item, !ultimo && s.separador]} onPress={onPress}>
      <View style={s.itemIcone}><Icone nome={icone} tamanho={20} cor={cores.primaria} /></View>
      <Text style={s.itemTitulo}>{titulo}</Text>
      {detalhe ? <Text style={s.itemDetalhe}>{detalhe}</Text> : null}
      <Icone nome="chevron-forward" tamanho={18} cor={cores.textoClaro} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16 },
  cabecalho: { backgroundColor: cores.primariaEscura, borderRadius: 22, alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
  avatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: cores.superficie,
    alignItems: "center", justifyContent: "center",
  },
  avatarTexto: { fontSize: 26, fontWeight: "900", color: cores.primariaEscura },
  nome: { fontSize: 20, fontWeight: "800", color: cores.branco, marginTop: 12, textAlign: "center" },
  email: { fontSize: 14, color: "#C9DCCB", marginTop: 2 },
  seloAdmin: { backgroundColor: cores.secundaria, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  seloAdminTexto: { color: cores.branco, fontSize: 12, fontWeight: "800" },
  cartao: {
    backgroundColor: cores.superficie, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1,
    borderColor: cores.borda, marginTop: 14,
  },
  separador: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  dado: { paddingVertical: 12 },
  dadoRotulo: { fontSize: 12, color: cores.textoClaro },
  dadoValor: { fontSize: 15, color: cores.texto, fontWeight: "600", marginTop: 2 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  itemIcone: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: cores.primariaClara,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  itemTitulo: { flex: 1, fontSize: 15, fontWeight: "700", color: cores.texto },
  itemDetalhe: { fontSize: 13, color: cores.textoClaro, marginRight: 6 },
  versao: { fontSize: 12, color: cores.textoClaro, textAlign: "center", marginTop: 16 },
});
