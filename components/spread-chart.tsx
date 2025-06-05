"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar, Activity, Target } from "lucide-react"
import { generateSpreadData, calculateSpreadStats } from "@/lib/spread-data"

// Importar Plotly dinamicamente
import dynamic from "next/dynamic"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface SpreadData {
  date: string
  altbgPrice: number
  btcPrice: number
  altbgPriceUSD: number
  spread: number
  spreadChange: number
  ratio: number
}

export function SpreadChart() {
  const [spreadData, setSpreadData] = useState<SpreadData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"all" | "recent" | "year">("all")

  useEffect(() => {
    setTimeout(() => {
      const data = generateSpreadData()

      // Filtrar dados baseado no timeframe
      let filteredData = data
      if (timeframe === "recent") {
        filteredData = data.slice(-30) // Últimos 30 dias
      } else if (timeframe === "year") {
        filteredData = data.slice(-365) // Último ano
      }

      setSpreadData(filteredData)
      setLoading(false)
    }, 1000)
  }, [timeframe])

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Carregando dados do spread...</p>
        </CardContent>
      </Card>
    )
  }

  const stats = calculateSpreadStats(spreadData)
  const currentSpread = spreadData[spreadData.length - 1]?.spread || 0
  const previousSpread = spreadData[spreadData.length - 2]?.spread || 0
  const spreadChange = currentSpread - previousSpread
  const spreadChangePercent = previousSpread !== 0 ? (spreadChange / previousSpread) * 100 : 0

  // Preparar dados para o gráfico principal (spread)
  const mainPlotData = [
    {
      x: spreadData.map((d) => d.date),
      y: spreadData.map((d) => d.spread),
      type: "scatter" as const,
      mode: "lines" as const,
      name: "ALTBG/BTCUSD Spread",
      line: {
        color: "#8B5CF6",
        width: 2,
      },
      fill: "tonexty" as const,
      fillcolor: "rgba(139, 92, 246, 0.1)",
      hovertemplate:
        "<b>%{x}</b><br>" +
        "Spread: %{y:.4f}<br>" +
        "ALTBG: $%{customdata[0]}<br>" +
        "BTC: $%{customdata[1]}<br>" +
        "<extra></extra>",
      customdata: spreadData.map((d) => [d.altbgPriceUSD.toFixed(2), d.btcPrice.toLocaleString()]),
    },
  ]

  // Adicionar linha de média
  if (stats) {
    mainPlotData.push({
      x: spreadData.map((d) => d.date),
      y: Array(spreadData.length).fill(stats.average),
      type: "scatter" as const,
      mode: "lines" as const,
      name: "Média",
      line: {
        color: "#F59E0B",
        width: 1,
        dash: "dash" as const,
      },
      hovertemplate: "<b>Média:</b> %{y:.4f}<extra></extra>",
    })
  }

  const layout = {
    title: {
      text: "Spread ALTBG/BTCUSD (×10,000)",
      font: { color: "#F3F4F6", size: 18 },
    },
    xaxis: {
      title: "Data",
      color: "#9CA3AF",
      gridcolor: "#374151",
      showgrid: true,
    },
    yaxis: {
      title: "Spread (ALTBG_USD / BTC_USD × 10,000)",
      color: "#9CA3AF",
      gridcolor: "#374151",
      showgrid: true,
    },
    plot_bgcolor: "#1F2937",
    paper_bgcolor: "#1F2937",
    font: { color: "#F3F4F6" },
    hovermode: "x unified" as const,
    legend: {
      orientation: "h" as const,
      y: -0.2,
    },
  }

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
    displaylogo: false,
    responsive: true,
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center text-gray-100">
            <Activity className="h-6 w-6 mr-2 text-purple-400" />
            Spread ALTBG/BTCUSD
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTimeframe("recent")}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === "recent" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setTimeframe("year")}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === "year" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              1 Ano
            </button>
            <button
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === "all" ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Desde Out/2023
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Estatísticas do spread */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Spread Atual</p>
            <p className="text-xl font-bold text-purple-400">{currentSpread.toFixed(4)}</p>
            <div
              className={`flex items-center justify-center mt-1 ${spreadChange >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {spreadChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="text-sm">
                {spreadChange >= 0 ? "+" : ""}
                {spreadChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {stats && (
            <>
              <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Média</p>
                <p className="text-lg font-bold text-yellow-400">{stats.average.toFixed(4)}</p>
                <p className="text-xs text-gray-400">Período selecionado</p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Min / Max</p>
                <p className="text-sm font-bold text-red-400">{stats.min.toFixed(4)}</p>
                <p className="text-sm font-bold text-green-400">{stats.max.toFixed(4)}</p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Tendência</p>
                <div className="flex items-center justify-center">
                  <Target className="h-4 w-4 mr-1 text-blue-400" />
                  <Badge
                    variant="outline"
                    className={`${
                      stats.trend === "Alta"
                        ? "text-green-400 border-green-600"
                        : stats.trend === "Baixa"
                          ? "text-red-400 border-red-600"
                          : "text-gray-400 border-gray-600"
                    }`}
                  >
                    {stats.trend}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">Volatilidade: {stats.volatility.toFixed(4)}</p>
              </div>
            </>
          )}
        </div>

        {/* Gráfico */}
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <Plot data={mainPlotData} layout={layout} config={config} style={{ width: "100%", height: "400px" }} />
        </div>

        {/* Informações explicativas */}
        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-600/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-purple-400 font-semibold mb-1">Análise do Spread</h3>
              <p className="text-purple-200 text-sm mb-2">
                O spread ALTBG/BTCUSD mostra a relação proporcional entre os preços dos dois ativos ao longo do tempo.
              </p>
              <ul className="text-purple-200 text-xs space-y-1">
                <li>
                  • <strong>Spread = (ALTBG_USD / BTC_USD) × 10,000</strong> para melhor visualização
                </li>
                <li>• Valores maiores indicam que ALTBG está relativamente mais caro em relação ao BTC</li>
                <li>• Valores menores indicam que ALTBG está relativamente mais barato em relação ao BTC</li>
                <li>• Período: Outubro 2023 até hoje</li>
                <li>• Linha tracejada amarela mostra a média do período</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
