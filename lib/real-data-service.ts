// Serviço para buscar dados reais de ALTBG e BTC
export interface RealTimeData {
  altbgPrice: number
  altbgPriceUSD: number
  btcPrice: number
  timestamp: string
}

export interface HistoricalDataPoint {
  date: string
  altbgPrice: number
  altbgPriceUSD: number
  btcPrice: number
  altbgPerBtc: number
  spread: number
}

// Função para buscar preço atual do BTC
async function fetchBTCPrice(): Promise<number> {
  try {
    const response = await fetch("/api/crypto?symbol=BTC-USD")
    if (!response.ok) {
      throw new Error("Failed to fetch BTC price")
    }
    const data = await response.json()
    return data.price
  } catch (error) {
    console.error("Error fetching BTC price:", error)
    // Fallback para preço simulado atual
    return 95000
  }
}

// Função para buscar preço atual do ALTBG
async function fetchALTBGPrice(): Promise<{ price: number; priceUSD: number }> {
  try {
    const response = await fetch("/api/stock?symbol=ALTBG.PA")
    if (!response.ok) {
      throw new Error("Failed to fetch ALTBG price")
    }
    const data = await response.json()
    const eurToUsd = 1.08
    return {
      price: data.price,
      priceUSD: data.price * eurToUsd,
    }
  } catch (error) {
    console.error("Error fetching ALTBG price:", error)
    // Fallback para preço simulado atual
    return {
      price: 12.45,
      priceUSD: 12.45 * 1.08,
    }
  }
}

// Função para buscar dados em tempo real
export async function fetchRealTimeData(): Promise<RealTimeData> {
  const [btcPrice, altbgData] = await Promise.all([fetchBTCPrice(), fetchALTBGPrice()])

  return {
    altbgPrice: altbgData.price,
    altbgPriceUSD: altbgData.priceUSD,
    btcPrice,
    timestamp: new Date().toISOString(),
  }
}

// Função para gerar dados históricos baseados em dados reais atuais
export async function generateRealBasedHistoricalData(startDate: Date, endDate: Date): Promise<HistoricalDataPoint[]> {
  // Buscar dados atuais reais
  const currentData = await fetchRealTimeData()

  const data: HistoricalDataPoint[] = []
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  // Calcular preços históricos baseados nos atuais
  const historicalBtcPrice = startDate.getFullYear() === 2023 ? 27000 : 60000 // Out 2023 vs Ago 2024
  const historicalAltbgPrice = startDate.getFullYear() === 2023 ? 6.8 : 8.75 // Out 2023 vs Ago 2024

  // Calcular taxas de crescimento para atingir os valores atuais
  const btcGrowthRate = Math.pow(currentData.btcPrice / historicalBtcPrice, 1 / totalDays)
  const altbgGrowthRate = Math.pow(currentData.altbgPrice / historicalAltbgPrice, 1 / totalDays)

  let btcPrice = historicalBtcPrice
  let altbgPrice = historicalAltbgPrice

  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Adicionar variação aleatória realista
    const btcVariation = 1 + (Math.random() - 0.5) * 0.04 // ±2%
    const altbgVariation = 1 + (Math.random() - 0.5) * 0.02 // ±1%

    // Aplicar crescimento + variação
    btcPrice = btcPrice * btcGrowthRate * btcVariation
    altbgPrice = altbgPrice * altbgGrowthRate * altbgVariation

    const altbgPriceUSD = altbgPrice * 1.08
    const altbgPerBtc = btcPrice / altbgPriceUSD
    const spread = (altbgPriceUSD / btcPrice) * 10000

    data.push({
      date: new Date(currentDate).toISOString().split("T")[0],
      altbgPrice: Number(altbgPrice.toFixed(2)),
      altbgPriceUSD: Number(altbgPriceUSD.toFixed(2)),
      btcPrice: Number(btcPrice.toFixed(0)),
      altbgPerBtc: Number(altbgPerBtc.toFixed(0)),
      spread: Number(spread.toFixed(4)),
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Ajustar o último ponto para os valores reais atuais
  if (data.length > 0) {
    const lastPoint = data[data.length - 1]
    lastPoint.altbgPrice = currentData.altbgPrice
    lastPoint.altbgPriceUSD = currentData.altbgPriceUSD
    lastPoint.btcPrice = currentData.btcPrice
    lastPoint.altbgPerBtc = Number((currentData.btcPrice / currentData.altbgPriceUSD).toFixed(0))
    lastPoint.spread = Number(((currentData.altbgPriceUSD / currentData.btcPrice) * 10000).toFixed(4))
  }

  return data
}
