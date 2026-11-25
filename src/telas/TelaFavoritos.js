import React, { useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";
import { useProdutos } from "../contexto/ContextoProdutos";
import Cabecalho from "../componentes/Cabecalho";
import CartaoProduto from "../componentes/CartaoProduto";
import EstadoVazio from "../componentes/EstadoVazio";

export default function TelaFavoritos({ navigation }) {
  const { favoritos } = useUsuario();
  const { produtos } = useProdutos();

  // Mantém a ordem em que foram favoritados (mais recentes primeiro).
  const lista = useMemo(
    () => favoritos.map((id) => produtos.find((p) => String(p.id) === id)).filter(Boolean),
    [favoritos, produtos]
  );

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Favoritos" subtitulo={lista.length ? `${lista.length} produto(s)` : null} onVoltar={() => navigation.goBack()} />
      <FlatList
        data={lista}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={s.lista}
        renderItem={({ item }) => (
          <CartaoProduto produto={item} onPress={() => navigation.navigate("Produto", { produtoId: item.id })} />
        )}
        ListEmptyComponent={
          <EstadoVazio
            icone="heart-outline"
            titulo="Nenhum favorito ainda"
            texto="Toque no coração de um produto para guardá-lo aqui."
            acao="Ver produtos"
            onAcao={() => navigation.navigate("Buscar")}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
});
