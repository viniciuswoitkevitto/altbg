"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Bitcoin, BarChart3, Calendar, DollarSign, Euro } from "lucide-react"
import { generateHistoricalData, getRecentDetailedData } from "@/lib/historical-data"

// Importar Plotly dinamicamente para evitar problemas de SSR
import dynamic from "next/dynamic"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface ChartData {
  date: string
  altbgPrice: number
  btcPrice: number
  altbgPriceUSD: number
  altbgPerBtc: number
  ratio: number
}

export function AltbgBtcChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"all" | "recent">("all")
  const [showPrices, setShowPrices] = useState(false)

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      const data = timeframe === "all" ? generateHistoricalData() : getRecentDetailedData()
      setChartData(data)
      setLoading(false)
    }, 1000)
  }, [timeframe])

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Carregando dados históricos...</p>
        </CardContent>
      </Card>
    )
  }

  const currentRatio = chartData[chartData.length - 1]?.altbgPerBtc || 0
  const previousRatio = chartData[chartData.length - 2]?.altbgPerBtc || 0
  const ratioChange = currentRatio - previousRatio
  const ratioChangePercent = previousRatio !== 0 ? (ratioChange / previousRatio) * 100 : 0

  // Preparar dados para o gráfico
  const plotData = [
    {
      x: chartData.map((d) => d.date),
      y: chartData.map((d) => d.altbgPerBtc),
      type: "scatter" as const,
      mode: "lines" as const,
      name: "ALTBG por BTC",
      line: {
        color: "#3B82F6",
        width: 3,
      },
      hovertemplate:
        "<b>%{x}</b><br>" +
        "Ações ALTBG necessárias: %{y}<br>" +
        "BTC: $%{customdata[0]}<br>" +
        "ALTBG: €%{customdata[1]} (≈ $%{customdata[2]})<br>" +
        "<extra></extra>",
      customdata: chartData.map((d) => [
        d.btcPrice.toLocaleString(),
        d.altbgPrice.toFixed(2),
        d.altbgPriceUSD.toFixed(2),
      ]),
    },
  ]

  // Adicionar gráficos de preço se solicitado
  if (showPrices) {
    plotData.push({
      x: chartData.map((d) => d.date),
      y: chartData.map((d) => d.btcPrice / 10000), // Escala para caber no gráfico
      type: "scatter" as const,
      mode: "lines" as const,
      name: "BTC (÷10k)",
      line: {
        color: "#F59E0B",
        width: 2,
        dash: "dot" as const,
      },
      yaxis: "y2" as const,
      hovertemplate: "<b>%{x}</b><br>BTC: $%{customdata[0]}<br><extra></extra>",
      customdata: chartData.map((d) => [d.btcPrice.toLocaleString()]),
    })

    plotData.push({
      x: chartData.map((d) => d.date),
      y: chartData.map((d) => d.altbgPrice),
      type: "scatter" as const,
      mode: "lines" as const,
      name: "ALTBG (€)",
      line: {
        color: "#10B981",
        width: 2,
        dash: "dash" as const,
      },
      yaxis: "y2" as const,
      hovertemplate: "<b>%{x}</b><br>ALTBG: €%{y:.2f}<br><extra></extra>",
    })
  }

  const layout = {
    title: {
      text: "Quantas Ações ALTBG.PA = 1 BTC",
      font: { color: "#F3F4F6", size: 18 },
    },
    xaxis: {
      title: "Data",
      color: "#9CA3AF",
      gridcolor: "#374151",
      showgrid: true,
    },
    yaxis: {
      title: "Número de Ações ALTBG",
      color: "#9CA3AF",
      gridcolor: "#374151",
      showgrid: true,
    },
    yaxis2: showPrices
      ? {
          title: "Preço",
          titlefont: { color: "#10B981" },
          tickfont: { color: "#10B981" },
          overlaying: "y",
          side: "right",
          showgrid: false,
        }
      : {},
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
            <Bitcoin className="h-6 w-6 mr-2 text-orange-400" />
            Relação ALTBG vs Bitcoin
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowPrices(!showPrices)}
              className={`px-3 py-1 text-xs rounded ${
                showPrices ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {showPrices ? "Ocultar Preços" : "Mostrar Preços"}
            </button>
            <button
              onClick={() => setTimeframe("recent")}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === "recent" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === "all" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Desde Ago/2024
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Estatísticas atuais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Ações ALTBG por 1 BTC</p>
            <p className="text-2xl font-bold text-white">{currentRatio.toLocaleString()}</p>
            <div
              className={`flex items-center justify-center mt-1 ${ratioChange >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              <TrendingUp className={`h-4 w-4 mr-1 ${ratioChange < 0 ? "rotate-180" : ""}`} />
              <span className="text-sm">
                {ratioChange >= 0 ? "+" : ""}
                {ratioChangePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Preço ALTBG Atual</p>
            <div className="flex items-center justify-center">
              <Euro className="h-4 w-4 mr-1 text-blue-400" />
              <p className="text-xl font-bold text-blue-400">
                {chartData[chartData.length - 1]?.altbgPrice.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-400">
              <DollarSign className="h-3 w-3 mr-1" />
              <p>{chartData[chartData.length - 1]?.altbgPriceUSD.toFixed(2)} USD</p>
            </div>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Preço BTC Atual</p>
            <div className="flex items-center justify-center">
              <DollarSign className="h-4 w-4 mr-1 text-orange-400" />
              <p className="text-xl font-bold text-orange-400">
                {chartData[chartData.length - 1]?.btcPrice.toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="text-orange-300 border-orange-600 mt-1">
              <Bitcoin className="h-3 w-3 mr-1" />
              BTC
            </Badge>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <Plot data={plotData} layout={layout} config={config} style={{ width: "100%", height: "400px" }} />
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-1">Análise Histórica</h3>
              <p className="text-blue-200 text-sm mb-2">
                Este gráfico mostra quantas ações da ALTBG.PA são necessárias para equivaler ao valor de 1 Bitcoin ao
                longo do tempo.
              </p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• Preços BTC: $60,000 (Ago/2024) → $95,000 (atual)</li>
                <li>• Preços ALTBG: €8.75 (Ago/2024) → €12.45 (atual)</li>
                <li>• Taxa de câmbio EUR/USD: 1.08</li>
                <li>• Atualização automática a cada 10 minutos</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
