"""Dashboard Frut & Vida — Análise de Dados e Estatística (item 2.5).

Como rodar (na pasta dashboard/):
    py -m pip install -r requirements.txt
    py -m streamlit run dashboard.py
"""
import plotly.express as px
import streamlit as st

import analise

VERDE = "#2F6B3B"
PALETA = ["#2F6B3B", "#F3A83B", "#6FA86B", "#C94A4A", "#8FB9A8", "#1E4A2A"]

# Cada categoria tem sempre a mesma cor em todos os gráficos.
CORES_CATEGORIA = {
    "Frutas": "#2F6B3B",
    "Legumes": "#F3A83B",
    "Verduras": "#6FA86B",
    "Sucos": "#C94A4A",
    "Temperos": "#8FB9A8",
}

moeda = lambda v: f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

st.set_page_config(page_title="Dashboard Frut & Vida", page_icon="🌿", layout="wide")

# ---------- Fonte dos dados ----------
st.sidebar.title("🌿 Frut & Vida")
fonte = st.sidebar.radio("Fonte dos dados", ["Arquivo JSON (gerado pelo app)", "API ao vivo"])
if fonte.startswith("Arquivo"):
    origem = st.sidebar.text_input("Caminho do arquivo", str(analise.ARQUIVO_PADRAO))
else:
    origem = st.sidebar.text_input("URL da API", "http://localhost:3000/exportar")


@st.cache_data(ttl=30)
def carregar(origem):
    return analise.carregar_json(origem)


try:
    dados = carregar(origem)
except Exception as erro:
    st.error(f"Não foi possível carregar os dados: {erro}")
    st.info("No app, entre em **Admin → Gerar JSON** (com o backend rodando) e recarregue esta página.")
    st.stop()

pedidos, itens = analise.montar_tabelas(dados)
if pedidos.empty:
    st.warning("O JSON ainda não tem pedidos. Faça compras no app ou rode `npm run seed` no backend.")
    st.stop()

# ---------- Filtros ----------
inicio, fim = pedidos["dia"].min(), pedidos["dia"].max()
periodo = st.sidebar.date_input("Período", (inicio, fim), min_value=inicio, max_value=fim)
if isinstance(periodo, tuple) and len(periodo) == 2:
    inicio, fim = periodo
categorias = sorted(itens["categoria"].unique())
escolhidas = st.sidebar.multiselect("Categorias", categorias, default=categorias)

pedidos = pedidos[(pedidos["dia"] >= inicio) & (pedidos["dia"] <= fim)]
itens = itens[itens["pedido_id"].isin(pedidos["pedido_id"]) & itens["categoria"].isin(escolhidas)]
pedidos = pedidos[pedidos["pedido_id"].isin(itens["pedido_id"])]

st.sidebar.caption(f"JSON gerado em {dados.get('gerado_em', '—')[:16].replace('T', ' ')} (UTC)")
if st.sidebar.button("Recarregar dados"):
    carregar.clear()
    st.rerun()

# ---------- Cabeçalho e KPIs ----------
st.title("Dashboard de Vendas · Frut & Vida")
st.caption(f"Período: {inicio:%d/%m/%Y} a {fim:%d/%m/%Y} · {len(escolhidas)} categoria(s)")

k = analise.indicadores(pedidos, itens)
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Faturamento", moeda(k["faturamento"]))
c2.metric("Pedidos", k["pedidos"])
c3.metric("Ticket médio", moeda(k["ticket_medio"]))
c4.metric("Clientes ativos", k["clientes_ativos"])
c5.metric("Itens vendidos", k["itens_vendidos"])

# ---------- Evolução ----------
st.subheader("Evolução do faturamento")
serie = analise.faturamento_diario(pedidos)
fig = px.bar(serie, x="dia", y="faturamento", labels={"dia": "Dia", "faturamento": "Faturamento (R$)"},
             color_discrete_sequence=["#B9D8B4"])
fig.add_scatter(x=serie["dia"], y=serie["media_movel_7d"], mode="lines", name="Média móvel 7 dias",
                line=dict(color=VERDE, width=3))
fig.update_layout(legend=dict(orientation="h", y=1.1), margin=dict(t=10))
st.plotly_chart(fig, width="stretch")

# ---------- Categorias e produtos ----------
col_a, col_b = st.columns(2)
with col_a:
    st.subheader("Faturamento por categoria")
    cat = analise.por_categoria(itens)
    st.plotly_chart(px.pie(cat, names="categoria", values="faturamento", hole=0.45,
                           color="categoria", color_discrete_map=CORES_CATEGORIA), width="stretch")
with col_b:
    st.subheader("Top 10 produtos (unidades)")
    top = analise.ranking_produtos(itens)
    fig = px.bar(top, x="quantidade", y="produto", color="categoria", orientation="h",
                 color_discrete_map=CORES_CATEGORIA, labels={"quantidade": "Unidades", "produto": ""})
    fig.update_layout(yaxis=dict(categoryorder="total ascending"))
    st.plotly_chart(fig, width="stretch")

# ---------- Comportamento de compra ----------
col_c, col_d, col_e = st.columns(3)
with col_c:
    st.subheader("Pedidos por dia da semana")
    st.plotly_chart(px.bar(analise.contagem(pedidos, "dia_semana", analise.DIAS_SEMANA), x="dia_semana", y="pedidos",
                           color_discrete_sequence=[VERDE], labels={"dia_semana": ""}), width="stretch")
with col_d:
    st.subheader("Horário de entrega")
    st.plotly_chart(px.bar(analise.contagem(pedidos, "horario_entrega", ["08h–10h", "10h–12h", "14h–16h", "16h–18h"]),
                           x="horario_entrega", y="pedidos", color_discrete_sequence=["#F3A83B"],
                           labels={"horario_entrega": ""}), width="stretch")
with col_e:
    st.subheader("Formas de pagamento")
    st.plotly_chart(px.pie(analise.contagem(pedidos, "pagamento"), names="pagamento", values="pedidos",
                           color_discrete_sequence=PALETA), width="stretch")

# ---------- Estatística ----------
st.subheader("Estatística descritiva do valor dos pedidos")
col_f, col_g = st.columns([1, 2])
with col_f:
    est = analise.estatistica_descritiva(pedidos)
    st.dataframe(
        {"Medida": list(est), "Valor": [f"{v:.1f}%" if "%" in m else moeda(v) for m, v in est.items()]},
        hide_index=True, width="stretch",
    )
with col_g:
    fig = px.histogram(pedidos, x="valor", nbins=20, marginal="box", color_discrete_sequence=[VERDE],
                       labels={"valor": "Valor do pedido (R$)", "count": "Pedidos"})
    fig.update_layout(yaxis_title="Pedidos", margin=dict(t=10))
    st.plotly_chart(fig, width="stretch")

with st.expander("Ver dados brutos dos pedidos"):
    st.dataframe(pedidos.drop(columns=["data"]), hide_index=True, width="stretch")