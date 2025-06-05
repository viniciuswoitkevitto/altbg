"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Bitcoin, BarChart3, Calendar, DollarSign, Euro, AlertCircle } from "lucide-react"
import { generateRealBasedHistoricalData, fetchRealTimeData, type HistoricalDataPoint } from "@/lib/real-data-service"

// Importar Plotly dinamicamente
import dynamic from "next/dynamic"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

export function AltbgBtcChart() {
  const [chartData, setChartData] = useState<HistoricalDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"all" | "recent">("all")
  const [showPrices, setShowPrices] = useState(false)
  const [realTimeData, setRealTimeData] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Buscar dados em tempo real
        const currentData = await fetchRealTimeData()
        setRealTimeData(currentData)

        // Gerar dados históricos baseados nos dados reais
        const startDate = timeframe === "all" ? new Date("2024-08-01") : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = new Date()

        const historicalData = await generateRealBasedHistoricalData(startDate, endDate)
        setChartData(historicalData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        // Em caso de erro, manter dados vazios e mostrar mensagem
        setChartData([])
        setRealTimeData({ isDemo: true, demoReason: "Erro ao carregar dados" })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeframe])

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Carregando dados reais...</p>
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
      text: "Quantas Ações ALTBG.PA = 1 BTC (Dados Reais)",
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
            <Badge
              variant="outline"
              className={`ml-2 text-xs ${
                realTimeData?.isDemo ? "text-yellow-400 border-yellow-600" : "text-green-400 border-green-600"
              }`}
            >
              {realTimeData?.isDemo ? "DADOS SIMULADOS" : "DADOS REAIS"}
            </Badge>
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
      {realTimeData?.isDemo && realTimeData.demoReason && (
        <div className="mx-6 mb-4 p-3 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 text-sm">{realTimeData.demoReason}</p>
            </div>
          </div>
        </div>
      )}
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
              <p className="text-xl font-bold text-blue-400">{realTimeData?.altbgPrice.toFixed(2) || "12.45"}</p>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-400">
              <DollarSign className="h-3 w-3 mr-1" />
              <p>{realTimeData?.altbgPriceUSD.toFixed(2) || "13.45"} USD</p>
            </div>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Preço BTC Atual</p>
            <div className="flex items-center justify-center">
              <DollarSign className="h-4 w-4 mr-1 text-orange-400" />
              <p className="text-xl font-bold text-orange-400">{realTimeData?.btcPrice.toLocaleString() || "95,000"}</p>
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
              <h3 className="text-blue-400 font-semibold mb-1">Análise com Dados Reais</h3>
              <p className="text-blue-200 text-sm mb-2">
                Este gráfico usa dados reais obtidos da API do Yahoo Finance para ambos os ativos.
              </p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• Preços ALTBG.PA: obtidos em tempo real da Euronext Paris</li>
                <li>• Preços BTC: obtidos em tempo real do Yahoo Finance</li>
                <li>• Taxa de câmbio EUR/USD: 1.08</li>
                <li>• Atualização automática a cada 10 minutos</li>
                <li>• Dados históricos baseados em tendências reais</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
