import React from "react";
import { Ionicons } from "@expo/vector-icons";
import cores from "../tema/cores";

// Ícones do app (biblioteca Ionicons, que acompanha o Expo).
export default function Icone({ nome, tamanho = 22, cor = cores.texto, estilo }) {
  return <Ionicons name={nome} size={tamanho} color={cor} style={estilo} />;
}
