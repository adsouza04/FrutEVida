import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import cores from "../tema/cores";
import Icone from "./Icone";
import { useCarrinho } from "../contexto/ContextoCarrinho";

export const ABAS = [
  { rota: "Inicio", rotulo: "Início", icone: "home" },
  { rota: "Buscar", rotulo: "Buscar", icone: "search" },
  { rota: "Carrinho", rotulo: "Carrinho", icone: "basket" },
  { rota: "Pedidos", rotulo: "Pedidos", icone: "receipt" },
  { rota: "Perfil", rotulo: "Perfil", icone: "person" },
];

const ALTURA = 62;

export function useAlturaAbas() {
  const insets = useSafeAreaInsets();
  return ALTURA + Math.max(insets.bottom, 8);
}

export default function BarraAbas({ rotaAtual, navigation }) {
  const insets = useSafeAreaInsets();
  const { quantidadeTotal } = useCarrinho();

  return (
    <View style={[s.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ABAS.map((aba) => {
        const ativo = aba.rota === rotaAtual;
        const cor = ativo ? cores.primaria : cores.textoClaro;
        return (
          <TouchableOpacity
            key={aba.rota}
            style={s.item}
            onPress={() => !ativo && navigation.navigate(aba.rota)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={aba.rotulo}
          >
            <View>
              <Icone nome={ativo ? aba.icone : `${aba.icone}-outline`} tamanho={23} cor={cor} />
              {aba.rota === "Carrinho" && quantidadeTotal > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeTexto}>{quantidadeTotal > 99 ? "99+" : quantidadeTotal}</Text>
                </View>
              )}
            </View>
            <Text style={[s.rotulo, { color: cor }, ativo && s.rotuloAtivo]}>{aba.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row",
    backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 8,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", height: ALTURA - 8 },
  rotulo: { fontSize: 11, marginTop: 3 },
  rotuloAtivo: { fontWeight: "800" },
  badge: {
    position: "absolute", right: -11, top: -5, backgroundColor: cores.secundaria, minWidth: 18,
    height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeTexto: { fontSize: 10, color: cores.branco, fontWeight: "900" },
});
