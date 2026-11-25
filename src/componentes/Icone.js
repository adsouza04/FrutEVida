import React from "react";
import { Ionicons } from "@expo/vector-icons";
import cores from "../tema/cores";

export default function Icone({ nome, tamanho = 22, cor = cores.texto, estilo }) {
  return <Ionicons name={nome} size={tamanho} color={cor} style={estilo} />;
}
