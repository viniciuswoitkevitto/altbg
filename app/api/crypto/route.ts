import { type NextRequest, NextResponse } from "next/server"

// Função para gerar dados de crypto simulados realistas
function generateRealisticCryptoData(symbol: string) {
  const now = new Date()

  // Preços base realistas para diferentes cryptos
  const basePrices: { [key: string]: number } = {
    "BTC-USD": 95000,
    "ETH-USD": 3500,
    "BNB-USD": 650,
  }

  const basePrice = basePrices[symbol] || basePrices["BTC-USD"]

  // Simular variação baseada no horário (crypto opera 24/7)
  const volatilityFactor = 1.2 // Crypto é mais volátil

  // Gerar mudança de preço realista
  const randomChange = (Math.random() - 0.5) * 2 * volatilityFactor
  const changePercent = (Math.random() - 0.5) * 8 // ±4% variação
  const newPrice = Math.max(0.01, basePrice * (1 + changePercent / 100))
  const change = newPrice - basePrice

  return {
    symbol: symbol.toUpperCase(),
    price: Number(newPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    lastUpdated: now.toISOString(),
    currency: "USD",
    isDemo: true,
    demoReason: `Yahoo Finance bloqueou acesso para ${symbol}. Exibindo dados simulados realistas baseados em preços de mercado atuais.`,
  }
}

// Função para tentar diferentes métodos de busca de crypto
async function attemptCryptoFetch(symbol: string) {
  const methods = [
    // Método 1: API padrão do Yahoo Finance
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
        "Cache-Control": "no-cache",
      },
    },
    // Método 3: Chart API
    {
      url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  ]

  for (const method of methods) {
    try {
      console.log(`Tentando buscar ${symbol} via: ${method.url}`)

      const response = await fetch(method.url, {
        headers: method.headers,
        next: { revalidate: 300 }, // Cache por 5 minutos
      })

      if (response.ok) {
        const data = await response.json()
        return { data, success: true, method: method.url }
      } else {
        console.log(`Método falhou com status: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.log(`Método falhou com erro:`, error)
    }
  }

  return { data: null, success: false }
}

// Função principal para buscar dados de crypto
async function fetchCryptoData(symbol: string) {
  try {
    console.log(`=== Iniciando busca de crypto para: ${symbol} ===`)

    const result = await attemptCryptoFetch(symbol)

    if (!result.success || !result.data) {
      throw new Error("Todos os métodos de API falharam")
    }

    const data = result.data
    console.log(`✅ Dados obtidos via: ${result.method}`)

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
        lastUpdated: new Date().toISOString(),
        currency: quote.currency || "USD",
        marketCap: quote.marketCap || null,
        volume: quote.regularMarketVolume || 0,
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
        lastUpdated: new Date().toISOString(),
        currency: meta.currency || "USD",
        marketCap: meta.marketCap || null,
        volume: meta.regularMarketVolume || 0,
        isDemo: false,
      }
    }

    throw new Error("Formato de resposta não reconhecido")
  } catch (error) {
    console.error(`❌ Erro ao buscar dados reais para ${symbol}:`, error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedSymbol = searchParams.get("symbol") || "BTC-USD"

  console.log(`=== API Crypto: Buscando dados para: ${requestedSymbol} ===`)

  try {
    // Tentar buscar dados reais
    const cryptoData = await fetchCryptoData(requestedSymbol)
    console.log("✅ Dados de crypto reais obtidos com sucesso")
    return NextResponse.json(cryptoData)
  } catch (error) {
    console.log("❌ Falha ao obter dados reais de crypto, usando simulação")
    console.error("Erro:", error)

    // Usar dados simulados realistas
    const mockData = generateRealisticCryptoData(requestedSymbol)

    // Personalizar mensagem baseada no erro
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    if (errorMessage.includes("401")) {
      mockData.demoReason = `Yahoo Finance bloqueou acesso para ${requestedSymbol}. Exibindo dados simulados realistas baseados em preços atuais de mercado.`
    } else if (errorMessage.includes("404")) {
      mockData.demoReason = `Símbolo ${requestedSymbol} não encontrado. Exibindo dados simulados.`
    } else {
      mockData.demoReason = `API temporariamente indisponível para ${requestedSymbol}. Exibindo dados simulados em tempo real.`
    }

    return NextResponse.json(mockData)
  }
}
