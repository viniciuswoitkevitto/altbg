"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Info, Globe, Clock } from "lucide-react"
import { AltbgBtcChart } from "@/components/altbg-btc-chart"
import { SpreadChart } from "@/components/spread-chart"

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  volume: number
  marketCap?: number | null
  dayHigh?: number | null
  dayLow?: number | null
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  lastUpdated: string
  currency: string
  exchangeName: string
  marketStatus?: string
  isDemo?: boolean
  demoReason?: string
}

export default function Component() {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchStockPrice = async (): Promise<StockData> => {
    const response = await fetch(`/api/stock?symbol=ALTBG.PA`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Falha ao buscar dados da ação")
    }

    const data = await response.json()
    return data
  }

  const updateStockData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchStockPrice()
      setStockData(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError("Falha ao buscar dados da ação")
      console.error("Erro ao buscar dados da ação:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Busca inicial
    updateStockData()

    // Configurar intervalo para atualizar a cada 10 minutos (600.000 ms)
    const interval = setInterval(updateStockData, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatCurrency = (value: number | null | undefined, currency = "EUR") => {
    if (value === null || value === undefined) return "N/A"

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatLargeNumber = (value: number | null | undefined, currency = "EUR") => {
    if (value === null || value === undefined) return "N/A"

    const symbol = currency === "EUR" ? "€" : "$"

    if (value >= 1e12) {
      return `${symbol}${(value / 1e12).toFixed(2)}T`
    } else if (value >= 1e9) {
      return `${symbol}${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `${symbol}${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `${symbol}${(value / 1e3).toFixed(2)}K`
    }
    return `${symbol}${value.toLocaleString()}`
  }

  const getMarketStatusColor = (status?: string) => {
    switch (status) {
      case "OPEN":
        return "text-green-400 border-green-600"
      case "CLOSED":
        return "text-red-400 border-red-600"
      default:
        return "text-gray-400 border-gray-600"
    }
  }

  const isPositive = stockData ? stockData.change >= 0 : false

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="bg-gray-800 border-gray-700 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-4">
                <Globe className="inline-block h-8 w-8 mr-2" />
                ALTBG - Euronext Paris
              </h1>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-gray-300 border-gray-600 text-lg px-3 py-1">
                  {stockData?.symbol || "ALTBG.PA"}
                </Badge>
                {stockData?.currency && (
                  <Badge variant="outline" className="text-blue-400 border-blue-600">
                    {stockData.currency}
                  </Badge>
                )}
                {stockData?.marketStatus && (
                  <Badge variant="outline" className={getMarketStatusColor(stockData.marketStatus)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {stockData.marketStatus === "OPEN" ? "MERCADO ABERTO" : "MERCADO FECHADO"}
                  </Badge>
                )}
                {stockData?.isDemo && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-600">
                    SIMULAÇÃO
                  </Badge>
                )}
                {stockData && !stockData.isDemo && (
                  <Badge variant="outline" className="text-green-400 border-green-600">
                    DADOS REAIS
                  </Badge>
                )}
              </div>
            </div>

            {/* Aviso sobre dados simulados */}
            {stockData?.isDemo && stockData.demoReason && (
              <Card className="bg-blue-900/20 border-blue-600/50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-blue-400 font-semibold mb-1">Dados Simulados</h3>
                      <p className="text-blue-200 text-sm">{stockData.demoReason}</p>
                      <p className="text-blue-300 text-xs mt-2">
                        💡 Os dados são atualizados a cada 10 minutos com variações realistas baseadas no horário de
                        mercado.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && !stockData ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-300">Carregando dados da ação...</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 text-lg mb-4">{error}</p>
                <button
                  onClick={updateStockData}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : stockData ? (
              <div className="space-y-8">
                {/* Exibição Principal do Preço */}
                <div className="text-center">
                  <div className="text-6xl md:text-8xl font-bold text-white mb-4">
                    {formatCurrency(stockData.price, stockData.currency)}
                  </div>

                  {/* Indicador de Mudança */}
                  <div
                    className={`flex items-center justify-center space-x-3 text-2xl ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                    <span className="font-semibold">
                      {isPositive ? "+" : ""}
                      {formatCurrency(stockData.change, stockData.currency)}
                    </span>
                    <span className="font-semibold">
                      ({isPositive ? "+" : ""}
                      {stockData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Informações Detalhadas da Ação */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Fechamento Anterior</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(stockData.previousClose, stockData.currency)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Volume</p>
                    <p className="text-white font-semibold">{stockData.volume.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Máxima do Dia</p>
                    <p className="text-white font-semibold">{formatCurrency(stockData.dayHigh, stockData.currency)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Mínima do Dia</p>
                    <p className="text-white font-semibold">{formatCurrency(stockData.dayLow, stockData.currency)}</p>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Valor de Mercado</p>
                    <p className="text-white font-semibold">
                      {formatLargeNumber(stockData.marketCap, stockData.currency)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Máxima 52 Semanas</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(stockData.fiftyTwoWeekHigh, stockData.currency)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Mínima 52 Semanas</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(stockData.fiftyTwoWeekLow, stockData.currency)}
                    </p>
                  </div>
                </div>

                {/* Informações de Atualização */}
                <div className="pt-6 border-t border-gray-700 text-center">
                  <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm mb-2">
                    <div className="flex items-center space-x-1">
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      <span>Última atualização: {formatTime(lastUpdate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-gray-500 text-xs">
                    <span>Bolsa: {stockData.exchangeName}</span>
                    <span className="hidden md:inline">•</span>
                    <span>Moeda: {stockData.currency}</span>
                    <span className="hidden md:inline">•</span>
                    <span>Atualiza automaticamente a cada 10 minutos</span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Gráfico ALTBG vs BTC */}
        <div className="mt-8">
          <AltbgBtcChart />
        </div>

        {/* Gráfico de Spread ALTBG/BTCUSD */}
        <div className="mt-8">
          <SpreadChart />
        </div>
      </div>
    </div>
  )
}
