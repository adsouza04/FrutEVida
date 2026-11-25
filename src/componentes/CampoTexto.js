import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import cores from "../tema/cores";

export default function CampoTexto({ rotulo, erro, ajuda, senha, direita, estilo, editable = true, onFocus, onBlur, style, ...props }) {
  const [focado, setFocado] = useState(false);
  const [visivel, setVisivel] = useState(false);

  return (
    <View style={[s.bloco, estilo]}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <View style={[s.caixa, focado && s.caixaFocada, erro && s.caixaErro, !editable && s.caixaInativa]}>
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={cores.placeholder}
          secureTextEntry={senha && !visivel}
          editable={editable}
          onFocus={(e) => { setFocado(true); onFocus?.(e); }}
          onBlur={(e) => { setFocado(false); onBlur?.(e); }}
          {...props}
        />
        {senha ? (
          <TouchableOpacity onPress={() => setVisivel(!visivel)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.acao}>{visivel ? "Ocultar" : "Mostrar"}</Text>
          </TouchableOpacity>
        ) : null}
        {direita}
      </View>
      {erro ? <Text style={s.erro}>{erro}</Text> : ajuda ? <Text style={s.ajuda}>{ajuda}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  bloco: { marginBottom: 14 },
  rotulo: { fontSize: 13, fontWeight: "700", color: cores.texto, marginBottom: 6 },
  caixa: {
    flexDirection: "row", alignItems: "center", minHeight: 52, borderRadius: 12, borderWidth: 1.5,
    borderColor: cores.borda, backgroundColor: cores.superficie, paddingHorizontal: 14,
  },
  caixaFocada: { borderColor: cores.primaria },
  caixaErro: { borderColor: cores.perigo },
  caixaInativa: { backgroundColor: cores.fundo },
  input: { flex: 1, fontSize: 15, color: cores.texto, paddingVertical: 12 },
  acao: { fontSize: 13, fontWeight: "800", color: cores.primaria, marginLeft: 8 },
  erro: { fontSize: 12, color: cores.perigo, marginTop: 5 },
  ajuda: { fontSize: 12, color: cores.textoClaro, marginTop: 5 },
});
