"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Info } from "lucide-react"

interface HistoricalData {
  date: string
  bitcoinPrice: number
  altbgPrice: number
  sharesPerBitcoin: number
  timestamp: number
}

interface HistoricalResponse {
  data: HistoricalData[]
  summary: {
    totalDays: number
    startDate: string
    endDate: string
    currentRatio: number
    minRatio: number
    maxRatio: number
    avgRatio: number
    isDemo: boolean
  }
}

interface HistoricalChartProps {
  refreshTrigger?: number
}

export function HistoricalChart({ refreshTrigger }: HistoricalChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plotlyLoaded, setPlotlyLoaded] = useState(false)

  // Carregar Plotly dinamicamente
  useEffect(() => {
    const loadPlotly = async () => {
      try {
        // Carregar Plotly via CDN
        if (!(window as any).Plotly) {
          const script = document.createElement("script")
          script.src = "https://cdn.plot.ly/plotly-2.26.0.min.js"
          script.onload = () => setPlotlyLoaded(true)
          script.onerror = () => console.error("Erro ao carregar Plotly")
          document.head.appendChild(script)
        } else {
          setPlotlyLoaded(true)
        }
      } catch (error) {
        console.error("Erro ao carregar Plotly:", error)
      }
    }

    loadPlotly()
  }, [])

  const fetchHistoricalData = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = "2024-10-01" // Outubro de 2024 (assumindo que foi um erro de digitação)
      const endDate = new Date().toISOString().split("T")[0]

      const response = await fetch(`/api/historical?startDate=${startDate}&endDate=${endDate}`)

      if (!response.ok) {
        throw new Error("Falha ao buscar dados históricos")
      }

      const data = await response.json()
      setHistoricalData(data)
    } catch (err) {
      setError("Erro ao carregar dados históricos")
      console.error("Erro:", err)
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados quando o componente monta ou quando há refresh
  useEffect(() => {
    fetchHistoricalData()
  }, [refreshTrigger])

  // Criar gráfico quando Plotly carrega e dados estão disponíveis
  useEffect(() => {
    if (plotlyLoaded && historicalData && plotRef.current && !loading) {
      createChart()
    }
  }, [plotlyLoaded, historicalData, loading])

  const createChart = () => {
    if (!plotRef.current || !historicalData || !(window as any).Plotly) return

    const Plotly = (window as any).Plotly

    const trace1 = {
      x: historicalData.data.map((d) => d.date),
      y: historicalData.data.map((d) => d.sharesPerBitcoin),
      type: "scatter",
      mode: "lines",
      name: "Ações ALTBG por 1 BTC",
      line: {
        color: "#f59e0b",
        width: 3,
      },
      hovertemplate: "<b>%{x}</b><br>" + "Ações por BTC: %{y:.2f}<br>" + "<extra></extra>",
    }

    const layout = {
      title: {
        text: "Histórico: Ações ALTBG necessárias para 1 Bitcoin",
        font: { color: "#f3f4f6", size: 18 },
      },
      xaxis: {
        title: "Data",
        color: "#9ca3af",
        gridcolor: "#374151",
        showgrid: true,
      },
      yaxis: {
        title: "Número de Ações ALTBG",
        color: "#9ca3af",
        gridcolor: "#374151",
        showgrid: true,
      },
      plot_bgcolor: "#1f2937",
      paper_bgcolor: "#1f2937",
      font: { color: "#f3f4f6" },
      hovermode: "x unified",
      showlegend: true,
      legend: {
        font: { color: "#f3f4f6" },
        orientation: "h",
        x: 0.5,
        xanchor: "center",
        y: 1.02,
        yanchor: "bottom",
      },
      margin: { t: 80, r: 30, b: 60, l: 80 },
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
      displaylogo: false,
    }

    Plotly.newPlot(plotRef.current, [trace1], layout, config)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 text-blue-400 animate-spin mr-3" />
            <span className="text-gray-300">Carregando dados históricos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchHistoricalData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!historicalData) return null

  const trend = historicalData.summary.currentRatio > historicalData.summary.avgRatio
  const trendPercent =
    ((historicalData.summary.currentRatio - historicalData.summary.avgRatio) / historicalData.summary.avgRatio) * 100

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {historicalData.summary.totalDays} dias de dados
            </Badge>
            {historicalData.summary.isDemo && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-600">
                Dados Simulados
              </Badge>
            )}
          </div>

          {historicalData.summary.isDemo && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-200 text-sm">
                  Dados históricos simulados com variações realistas. Para dados reais, configure acesso às APIs
                  financeiras.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Atual</p>
            <p className="text-white font-semibold">{formatNumber(historicalData.summary.currentRatio)}</p>
          </div>
          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Mínimo</p>
            <p className="text-white font-semibold">{formatNumber(historicalData.summary.minRatio)}</p>
          </div>
          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Máximo</p>
            <p className="text-white font-semibold">{formatNumber(historicalData.summary.maxRatio)}</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div ref={plotRef} style={{ width: "100%", height: "400px" }} />
        </div>
      </CardContent>
    </Card>
  )
}
