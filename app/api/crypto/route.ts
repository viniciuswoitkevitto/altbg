import { type NextRequest, NextResponse } from "next/server"

// Função para buscar dados de criptomoedas do Yahoo Finance
async function fetchCryptoData(symbol: string) {
  try {
    console.log(`Buscando dados de crypto para: ${symbol}`)

    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://finance.yahoo.com/",
      },
      next: { revalidate: 300 }, // Cache por 5 minutos
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.quoteResponse?.result || data.quoteResponse.result.length === 0) {
      throw new Error(`Símbolo ${symbol} não encontrado`)
    }

    const quote = data.quoteResponse.result[0]
    const currentPrice = quote.regularMarketPrice || quote.previousClose || 0

    return {
      symbol: quote.symbol,
      price: Number(currentPrice.toFixed(2)),
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      lastUpdated: new Date().toISOString(),
      currency: quote.currency || "USD",
    }
  } catch (error) {
    console.error(`Erro ao buscar dados de crypto para ${symbol}:`, error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedSymbol = searchParams.get("symbol") || "BTC-USD"

  try {
    const cryptoData = await fetchCryptoData(requestedSymbol)
    return NextResponse.json(cryptoData)
  } catch (error) {
    console.error("Erro ao buscar dados de crypto:", error)

    // Fallback para dados simulados
    const mockData = {
      symbol: requestedSymbol,
      price: requestedSymbol.includes("BTC") ? 95000 : 3500,
      change: (Math.random() - 0.5) * 1000,
      changePercent: (Math.random() - 0.5) * 5,
      lastUpdated: new Date().toISOString(),
      currency: "USD",
      isDemo: true,
    }

    return NextResponse.json(mockData)
  }
}
