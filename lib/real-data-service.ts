// Serviço para buscar dados reais de ALTBG e BTC com fallbacks robustos
export interface RealTimeData {
  altbgPrice: number
  altbgPriceUSD: number
  btcPrice: number
  timestamp: string
  isDemo: boolean
  demoReason?: string
}

export interface HistoricalDataPoint {
  date: string
  altbgPrice: number
  altbgPriceUSD: number
  btcPrice: number
  altbgPerBtc: number
  spread: number
}

// Cache simples para evitar muitas chamadas à API
let dataCache: { data: RealTimeData; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Função para buscar preço atual do BTC com fallback robusto
async function fetchBTCPrice(): Promise<{ price: number; isDemo: boolean; demoReason?: string }> {
  try {
    console.log("🔍 Buscando preço do BTC...")
    const response = await fetch("/api/crypto?symbol=BTC-USD")

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✅ Preço BTC obtido:", data.price)

    return {
      price: data.price,
      isDemo: data.isDemo || false,
      demoReason: data.demoReason,
    }
  } catch (error) {
    console.error("❌ Erro ao buscar preço BTC:", error)

    // Fallback para preço simulado realista
    const basePrice = 95000
    const variation = (Math.random() - 0.5) * 0.04 // ±2%
    const simulatedPrice = basePrice * (1 + variation)

    return {
      price: Number(simulatedPrice.toFixed(0)),
      isDemo: true,
      demoReason: "Erro na API do BTC. Usando dados simulados baseados em preços de mercado atuais.",
    }
  }
}

// Função para buscar preço atual do ALTBG com fallback robusto
async function fetchALTBGPrice(): Promise<{ price: number; priceUSD: number; isDemo: boolean; demoReason?: string }> {
  try {
    console.log("🔍 Buscando preço do ALTBG...")
    const response = await fetch("/api/stock?symbol=ALTBG.PA")

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const eurToUsd = 1.08

    console.log("✅ Preço ALTBG obtido:", data.price)

    return {
      price: data.price,
      priceUSD: data.price * eurToUsd,
      isDemo: data.isDemo || false,
      demoReason: data.demoReason,
    }
  } catch (error) {
    console.error("❌ Erro ao buscar preço ALTBG:", error)

    // Fallback para preço simulado realista
    const basePrice = 12.45
    const variation = (Math.random() - 0.5) * 0.02 // ±1%
    const simulatedPrice = basePrice * (1 + variation)
    const eurToUsd = 1.08

    return {
      price: Number(simulatedPrice.toFixed(2)),
      priceUSD: Number((simulatedPrice * eurToUsd).toFixed(2)),
      isDemo: true,
      demoReason: "Erro na API do ALTBG. Usando dados simulados baseados em preços de mercado atuais.",
    }
  }
}

// Função para buscar dados em tempo real com cache
export async function fetchRealTimeData(): Promise<RealTimeData> {
  // Verificar cache
  if (dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION) {
    console.log("📦 Usando dados do cache")
    return dataCache.data
  }

  console.log("🔄 Buscando novos dados em tempo real...")

  try {
    // Buscar dados em paralelo
    const [btcData, altbgData] = await Promise.all([fetchBTCPrice(), fetchALTBGPrice()])

    const result: RealTimeData = {
      altbgPrice: altbgData.price,
      altbgPriceUSD: altbgData.priceUSD,
      btcPrice: btcData.price,
      timestamp: new Date().toISOString(),
      isDemo: btcData.isDemo || altbgData.isDemo,
      demoReason: btcData.demoReason || altbgData.demoReason,
    }

    // Atualizar cache
    dataCache = {
      data: result,
      timestamp: Date.now(),
    }

    console.log("✅ Dados em tempo real obtidos:", {
      ALTBG: `€${result.altbgPrice} ($${result.altbgPriceUSD})`,
      BTC: `$${result.btcPrice}`,
      isDemo: result.isDemo,
    })

    return result
  } catch (error) {
    console.error("❌ Erro crítico ao buscar dados:", error)

    // Fallback completo
    const fallbackData: RealTimeData = {
      altbgPrice: 12.45,
      altbgPriceUSD: 13.45,
      btcPrice: 95000,
      timestamp: new Date().toISOString(),
      isDemo: true,
      demoReason: "Erro crítico nas APIs. Usando dados simulados de fallback.",
    }

    return fallbackData
  }
}

// Função para gerar dados históricos baseados em dados reais atuais
export async function generateRealBasedHistoricalData(startDate: Date, endDate: Date): Promise<HistoricalDataPoint[]> {
  console.log(
    `📊 Gerando dados históricos de ${startDate.toISOString().split("T")[0]} até ${endDate.toISOString().split("T")[0]}`,
  )

  try {
    // Buscar dados atuais reais
    const currentData = await fetchRealTimeData()

    const data: HistoricalDataPoint[] = []
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calcular preços históricos baseados nos atuais
    const isOct2023 = startDate.getFullYear() === 2023 && startDate.getMonth() === 9
    const historicalBtcPrice = isOct2023 ? 27000 : 60000 // Out 2023 vs Ago 2024
    const historicalAltbgPrice = isOct2023 ? 6.8 : 8.75 // Out 2023 vs Ago 2024

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

    console.log(`✅ Dados históricos gerados: ${data.length} pontos`)
    return data
  } catch (error) {
    console.error("❌ Erro ao gerar dados históricos:", error)

    // Retornar dados vazios em caso de erro crítico
    return []
  }
}

// Função para limpar cache (útil para forçar atualização)
export function clearCache() {
  dataCache = null
  console.log("🗑️ Cache limpo")
}
