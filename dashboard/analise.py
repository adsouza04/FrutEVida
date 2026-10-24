"""Leitura e análise dos dados exportados pelo app Frut & Vida (item 2.2 -> 2.5).

Separado da interface (dashboard.py) para poder ser testado e reutilizado.
"""
import json
from pathlib import Path
from urllib.request import urlopen

import pandas as pd

ARQUIVO_PADRAO = Path(__file__).resolve().parent.parent / "backend" / "exportacoes" / "dados_frut_e_vida.json"
DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def carregar_json(origem=ARQUIVO_PADRAO):
    """Aceita o caminho do arquivo JSON ou a URL da API (ex.: http://localhost:3000/exportar)."""
    origem = str(origem)
    if origem.startswith("http"):
        with urlopen(origem, timeout=10) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    with open(origem, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def montar_tabelas(dados):
    """Transforma o JSON aninhado em duas tabelas: pedidos (1 linha por pedido) e itens (1 linha por item)."""
    linhas_pedidos, linhas_itens = [], []
    for p in dados.get("pedidos", []):
        # Pedidos cancelados ou ainda sem pagamento não entram nas vendas.
        if p.get("status") in ("cancelado", "aguardando_pagamento"):
            continue
        data = pd.to_datetime(p["data_pedido"], utc=True).tz_convert("America/Sao_Paulo")
        agendamento = p.get("agendamento") or {}
        pagamento = p.get("pagamento") or {}
        linhas_pedidos.append({
            "pedido_id": p["id"],
            "cliente_id": p["usuario_id"],
            "data": data,
            "dia": data.date(),
            "dia_semana": DIAS_SEMANA[data.weekday()],
            "valor": float(p["valor_total"]),
            "qtd_itens": sum(i["quantidade"] for i in p["itens"]),
            "pagamento": pagamento.get("forma_pagamento", "—"),
            "horario_entrega": f'{agendamento.get("horario_inicio", "")[:2]}h–{agendamento.get("horario_fim", "")[:2]}h',
            "offline": bool(p.get("origem_offline")),
        })
        for i in p["itens"]:
            linhas_itens.append({
                "pedido_id": p["id"],
                "dia": data.date(),
                "produto": i["nome"],
                "categoria": i["categoria"],
                "quantidade": i["quantidade"],
                "subtotal": float(i["subtotal"]),
            })

    pedidos = pd.DataFrame(linhas_pedidos)
    itens = pd.DataFrame(linhas_itens)
    return pedidos, itens


def indicadores(pedidos, itens):
    if pedidos.empty:
        return {"faturamento": 0.0, "pedidos": 0, "ticket_medio": 0.0, "clientes_ativos": 0, "itens_vendidos": 0}
    # Usa a soma dos itens: assim o filtro de categoria também afeta o faturamento.
    faturamento = float(itens["subtotal"].sum()) if not itens.empty else 0.0
    return {
        "faturamento": round(faturamento, 2),
        "pedidos": int(len(pedidos)),
        "ticket_medio": round(faturamento / len(pedidos), 2),
        "clientes_ativos": int(pedidos["cliente_id"].nunique()),
        "itens_vendidos": int(itens["quantidade"].sum()) if not itens.empty else 0,
    }


def faturamento_diario(pedidos):
    """Faturamento por dia com média móvel de 7 dias (suaviza a oscilação dos fins de semana)."""
    serie = pedidos.groupby("dia", as_index=False).agg(faturamento=("valor", "sum"), pedidos=("pedido_id", "count"))
    serie["media_movel_7d"] = serie["faturamento"].rolling(7, min_periods=1).mean().round(2)
    return serie


def por_categoria(itens):
    return (itens.groupby("categoria", as_index=False)
            .agg(faturamento=("subtotal", "sum"), quantidade=("quantidade", "sum"))
            .sort_values("faturamento", ascending=False))


def ranking_produtos(itens, n=10):
    return (itens.groupby(["produto", "categoria"], as_index=False)
            .agg(quantidade=("quantidade", "sum"), faturamento=("subtotal", "sum"))
            .sort_values("quantidade", ascending=False).head(n))


def contagem(pedidos, coluna, ordem=None):
    tabela = pedidos[coluna].value_counts().rename_axis(coluna).reset_index(name="pedidos")
    if ordem:
        tabela[coluna] = pd.Categorical(tabela[coluna], categories=ordem, ordered=True)
        tabela = tabela.sort_values(coluna)
    return tabela


def estatistica_descritiva(pedidos):
    """Medidas de tendência central e dispersão do valor dos pedidos."""
    v = pedidos["valor"]
    q1, q3 = v.quantile(0.25), v.quantile(0.75)
    return {
        "Média": v.mean(),
        "Mediana": v.median(),
        "Moda (arred.)": v.round(0).mode().iloc[0],
        "Desvio padrão": v.std(),
        "Coef. de variação (%)": v.std() / v.mean() * 100,
        "Mínimo": v.min(),
        "1º quartil (Q1)": q1,
        "3º quartil (Q3)": q3,
        "Máximo": v.max(),
        "Amplitude interquartil": q3 - q1,
    }