import { type NextRequest, NextResponse } from "next/server"

// Função para gerar dados mock realistas para ALTBG.PA
function generateRealisticStockData(symbol: string) {
  // Simular dados baseados em uma sessão de trading real
  const now = new Date()
  const basePrice = 12.45

  // Simular variação baseada no horário (mais volatilidade durante horário de mercado)
  const isMarketHours = now.getHours() >= 9 && now.getHours() <= 17
  const volatilityFactor = isMarketHours ? 1.5 : 0.5

  // Gerar mudança de preço realista
  const randomChange = (Math.random() - 0.5) * 2 * volatilityFactor
  const newPrice = Math.max(0.01, basePrice + randomChange)
  const change = newPrice - basePrice
  const changePercent = (change / basePrice) * 100

  // Simular volume baseado no horário
  const baseVolume = isMarketHours ? 50000 : 10000
  const volumeVariation = Math.floor(Math.random() * baseVolume) + baseVolume

  return {
    symbol: symbol.toUpperCase(),
    price: Number(newPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    previousClose: Number(basePrice.toFixed(2)),
    volume: volumeVariation,
    marketCap: 850000000, // ~850M EUR (valor realista)
    dayHigh: Number((newPrice + Math.random() * 0.8).toFixed(2)),
    dayLow: Number((newPrice - Math.random() * 0.8).toFixed(2)),
    fiftyTwoWeekHigh: Number((basePrice + 3.2).toFixed(2)), // 15.65
    fiftyTwoWeekLow: Number((basePrice - 2.8).toFixed(2)), // 9.65
    lastUpdated: now.toISOString(),
    currency: "EUR",
    exchangeName: "Euronext Paris",
    marketStatus: isMarketHours ? "OPEN" : "CLOSED",
    isDemo: true,
    demoReason: "Dados simulados em tempo real para ALTBG.PA (Euronext Paris)",
  }
}

// Função para tentar diferentes métodos de busca
async function attemptYahooFinanceFetch(symbol: string) {
  const methods = [
    // Método 1: API de quote padrão
    {
      url: `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://finance.yahoo.com/",
        Origin: "https://finance.yahoo.com",
      },
    },
    // Método 2: API alternativa
    {
      url: `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "*/*",
      },
    },
    // Método 3: Chart API
    {
      url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    },
  ]

  for (const method of methods) {
    try {
      console.log(`Tentando método: ${method.url}`)

      const response = await fetch(method.url, {
        headers: method.headers,
        next: { revalidate: 300 },
      })

      if (response.ok) {
        const data = await response.json()
        return { data, success: true }
      } else {
        console.log(`Método falhou com status: ${response.status}`)
      }
    } catch (error) {
      console.log(`Método falhou com erro:`, error)
    }
  }

  return { data: null, success: false }
}

// Função principal para buscar dados
async function fetchStockData(symbol: string) {
  try {
    console.log(`Iniciando busca para: ${symbol}`)

    const result = await attemptYahooFinanceFetch(symbol)

    if (!result.success || !result.data) {
      throw new Error("Todos os métodos de API falharam")
    }

    const data = result.data

    // Processar resposta de quote
    if (data.quoteResponse?.result?.[0]) {
      const quote = data.quoteResponse.result[0]

      const currentPrice = quote.regularMarketPrice || quote.previousClose || 0
      const previousClose = quote.previousClose || currentPrice
      const change = quote.regularMarketChange || currentPrice - previousClose
      const changePercent =
        quote.regularMarketChangePercent || (previousClose !== 0 ? (change / previousClose) * 100 : 0)

      return {
        symbol: quote.symbol,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || null,
        dayHigh: quote.regularMarketDayHigh || null,
        dayLow: quote.regularMarketDayLow || null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        lastUpdated: new Date().toISOString(),
        currency: quote.currency || "EUR",
        exchangeName: quote.fullExchangeName || "Euronext Paris",
        marketStatus: quote.marketState || "UNKNOWN",
        isDemo: false,
      }
    }

    // Processar resposta de chart
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0]
      const meta = result.meta

      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
      const previousClose = meta.previousClose || currentPrice
      const change = currentPrice - previousClose
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0

      return {
        symbol: meta.symbol,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        volume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap || null,
        dayHigh: meta.regularMarketDayHigh || null,
        dayLow: meta.regularMarketDayLow || null,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
        lastUpdated: new Date().toISOString(),
        currency: meta.currency || "EUR",
        exchangeName: meta.exchangeName || "Euronext Paris",
        marketStatus: "UNKNOWN",
        isDemo: false,
      }
    }

    throw new Error("Formato de resposta não reconhecido")
  } catch (error) {
    console.error(`Erro ao buscar dados reais para ${symbol}:`, error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedSymbol = searchParams.get("symbol") || "ALTBG.PA"

  console.log(`=== Buscando dados para: ${requestedSymbol} ===`)

  try {
    // Tentar buscar dados reais
    const stockData = await fetchStockData(requestedSymbol)
    console.log("✅ Dados reais obtidos com sucesso")
    return NextResponse.json(stockData)
  } catch (error) {
    console.log("❌ Falha ao obter dados reais, usando simulação")
    console.error("Erro:", error)

    // Usar dados simulados realistas
    const mockData = generateRealisticStockData(requestedSymbol)

    // Personalizar mensagem baseada no erro
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    if (errorMessage.includes("401")) {
      mockData.demoReason = "Yahoo Finance bloqueou o acesso. Exibindo dados simulados realistas para ALTBG.PA"
    } else if (errorMessage.includes("404")) {
      mockData.demoReason = "Símbolo não encontrado na API. Exibindo dados simulados para ALTBG.PA"
    } else {
      mockData.demoReason = "API temporariamente indisponível. Exibindo dados simulados em tempo real para ALTBG.PA"
    }

    return NextResponse.json(mockData)
  }
}
