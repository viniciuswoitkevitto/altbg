import { type NextRequest, NextResponse } from "next/server"

// Função para buscar dados históricos do Yahoo Finance
async function fetchHistoricalData(symbol: string, startDate: string, endDate: string) {
  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

  const methods = [
    {
      url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://finance.yahoo.com/",
      },
    },
    {
      url: `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "*/*",
      },
    },
  ]

  for (const method of methods) {
    try {
      console.log(`Buscando dados históricos para ${symbol}: ${method.url}`)

      const response = await fetch(method.url, {
        headers: method.headers,
        next: { revalidate: 3600 }, // Cache por 1 hora
      })

      if (response.ok) {
        const data = await response.json()

        if (data.chart?.result?.[0]) {
          const result = data.chart.result[0]
          const timestamps = result.timestamp || []
          const prices = result.indicators?.quote?.[0]?.close || []

          const historicalData = timestamps
            .map((timestamp: number, index: number) => ({
              date: new Date(timestamp * 1000).toISOString().split("T")[0],
              price: prices[index] || null,
              timestamp: timestamp,
            }))
            .filter((item: any) => item.price !== null)

          return { data: historicalData, success: true }
        }
      }
    } catch (error) {
      console.log(`Método falhou para ${symbol}:`, error)
    }
  }

  return { data: null, success: false }
}

// Função para gerar dados históricos simulados
function generateHistoricalMockData(symbol: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data = []

  // Preços base
  const basePrice = symbol === "BTC-USD" ? 35000 : 12.45
  let currentPrice = basePrice

  const current = new Date(start)
  while (current <= end) {
    // Simular variação diária realista
    const dailyChange = (Math.random() - 0.5) * 0.05 // ±5% variação máxima
    currentPrice = Math.max(basePrice * 0.5, currentPrice * (1 + dailyChange))

    data.push({
      date: current.toISOString().split("T")[0],
      price: Number(currentPrice.toFixed(2)),
      timestamp: Math.floor(current.getTime() / 1000),
    })

    current.setDate(current.getDate() + 1)
  }

  return data
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate") || "2024-10-01"
  const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

  console.log(`=== Buscando dados históricos desde ${startDate} até ${endDate} ===`)

  try {
    // Buscar dados históricos do Bitcoin e ALTBG em paralelo
    const [bitcoinResult, altbgResult] = await Promise.all([
      fetchHistoricalData("BTC-USD", startDate, endDate),
      fetchHistoricalData("ALTBG.PA", startDate, endDate),
    ])

    let bitcoinData, altbgData

    if (bitcoinResult.success && altbgResult.success) {
      bitcoinData = bitcoinResult.data
      altbgData = altbgResult.data
      console.log("✅ Dados históricos reais obtidos")
    } else {
      console.log("❌ Falha ao obter dados históricos reais, usando simulação")
      bitcoinData = generateHistoricalMockData("BTC-USD", startDate, endDate)
      altbgData = generateHistoricalMockData("ALTBG.PA", startDate, endDate)
    }

    // Combinar dados e calcular razão
    const combinedData = []
    const bitcoinMap = new Map(bitcoinData.map((item: any) => [item.date, item.price]))
    const altbgMap = new Map(altbgData.map((item: any) => [item.date, item.price]))

    // Obter todas as datas únicas
    const allDates = new Set([...bitcoinData.map((item: any) => item.date), ...altbgData.map((item: any) => item.date)])

    for (const date of Array.from(allDates).sort()) {
      const bitcoinPrice = bitcoinMap.get(date)
      const altbgPrice = altbgMap.get(date)

      if (bitcoinPrice && altbgPrice && altbgPrice > 0) {
        const sharesPerBitcoin = bitcoinPrice / altbgPrice

        combinedData.push({
          date,
          bitcoinPrice: Number(bitcoinPrice.toFixed(2)),
          altbgPrice: Number(altbgPrice.toFixed(4)),
          sharesPerBitcoin: Number(sharesPerBitcoin.toFixed(4)),
          timestamp: Math.floor(new Date(date).getTime() / 1000),
        })
      }
    }

    // Ordenar por data
    combinedData.sort((a, b) => a.timestamp - b.timestamp)

    const response = {
      data: combinedData,
      summary: {
        totalDays: combinedData.length,
        startDate,
        endDate,
        currentRatio: combinedData[combinedData.length - 1]?.sharesPerBitcoin || 0,
        minRatio: Math.min(...combinedData.map((d) => d.sharesPerBitcoin)),
        maxRatio: Math.max(...combinedData.map((d) => d.sharesPerBitcoin)),
        avgRatio: combinedData.reduce((sum, d) => sum + d.sharesPerBitcoin, 0) / combinedData.length,
        isDemo: !bitcoinResult.success || !altbgResult.success,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar dados históricos:", error)

    // Retornar dados simulados em caso de erro
    const bitcoinData = generateHistoricalMockData("BTC-USD", startDate, endDate)
    const altbgData = generateHistoricalMockData("ALTBG.PA", startDate, endDate)

    const combinedData = bitcoinData.map((btc: any, index: number) => {
      const altbg = altbgData[index]
      const sharesPerBitcoin = btc.price / altbg.price

      return {
        date: btc.date,
        bitcoinPrice: btc.price,
        altbgPrice: altbg.price,
        sharesPerBitcoin: Number(sharesPerBitcoin.toFixed(4)),
        timestamp: btc.timestamp,
      }
    })

    return NextResponse.json({
      data: combinedData,
      summary: {
        totalDays: combinedData.length,
        startDate,
        endDate,
        currentRatio: combinedData[combinedData.length - 1]?.sharesPerBitcoin || 0,
        minRatio: Math.min(...combinedData.map((d) => d.sharesPerBitcoin)),
        maxRatio: Math.max(...combinedData.map((d) => d.sharesPerBitcoin)),
        avgRatio: combinedData.reduce((sum, d) => sum + d.sharesPerBitcoin, 0) / combinedData.length,
        isDemo: true,
      },
    })
  }
}
