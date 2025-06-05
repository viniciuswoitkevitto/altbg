// Função para gerar dados históricos do spread ALTBG/BTCUSD desde outubro 2023
export function generateSpreadData() {
  const data = []
  const startDate = new Date("2023-10-01")
  const endDate = new Date()

  // Preços base em outubro 2023
  let altbgPrice = 6.8 // EUR - valor inicial mais baixo
  let btcPrice = 27000 // USD - BTC estava mais baixo em outubro 2023

  // Preços atuais (maio 2025)
  const currentAltbgPrice = 12.45 // EUR
  const currentBtcPrice = 95000 // USD

  // Calcular taxa de crescimento diária para atingir os valores atuais
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const btcDailyGrowthRate = Math.pow(currentBtcPrice / btcPrice, 1 / totalDays)
  const altbgDailyGrowthRate = Math.pow(currentAltbgPrice / altbgPrice, 1 / totalDays)

  // Taxa de câmbio EUR/USD
  const eurToUsd = 1.08

  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Adicionar variação aleatória mais realista
    const btcRandomFactor = 1 + (Math.random() - 0.5) * 0.06 // ±3% variação diária para BTC
    const altbgRandomFactor = 1 + (Math.random() - 0.5) * 0.025 // ±1.25% variação diária para ALTBG

    // Aplicar crescimento tendencial + variação aleatória
    btcPrice = btcPrice * btcDailyGrowthRate * btcRandomFactor
    altbgPrice = altbgPrice * altbgDailyGrowthRate * altbgRandomFactor

    // Converter ALTBG para USD
    const altbgPriceUSD = altbgPrice * eurToUsd

    // Calcular o spread (diferença percentual normalizada)
    // Spread = (ALTBG_USD / BTC_USD) * 10000 para melhor visualização
    const spread = (altbgPriceUSD / btcPrice) * 10000

    // Calcular variação percentual do spread em relação ao dia anterior
    const previousSpread = data.length > 0 ? data[data.length - 1].spread : spread
    const spreadChange = ((spread - previousSpread) / previousSpread) * 100

    data.push({
      date: new Date(currentDate).toISOString().split("T")[0],
      altbgPrice: Number(altbgPrice.toFixed(2)),
      btcPrice: Number(btcPrice.toFixed(0)),
      altbgPriceUSD: Number(altbgPriceUSD.toFixed(2)),
      spread: Number(spread.toFixed(4)),
      spreadChange: Number(spreadChange.toFixed(2)),
      ratio: Number((altbgPriceUSD / btcPrice).toFixed(6)),
    })

    // Avançar um dia
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

// Função para calcular estatísticas do spread
export function calculateSpreadStats(data: any[]) {
  if (data.length === 0) return null

  const spreads = data.map((d) => d.spread)
  const min = Math.min(...spreads)
  const max = Math.max(...spreads)
  const current = spreads[spreads.length - 1]
  const average = spreads.reduce((a, b) => a + b, 0) / spreads.length

  // Calcular volatilidade (desvio padrão)
  const variance = spreads.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / spreads.length
  const volatility = Math.sqrt(variance)

  // Calcular tendência (correlação com tempo)
  const n = spreads.length
  const sumX = (n * (n - 1)) / 2 // soma de 0 a n-1
  const sumY = spreads.reduce((a, b) => a + b, 0)
  const sumXY = spreads.reduce((acc, val, idx) => acc + idx * val, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6 // soma de quadrados de 0 a n-1

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const trend = slope > 0 ? "Alta" : slope < 0 ? "Baixa" : "Lateral"

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    current: Number(current.toFixed(4)),
    average: Number(average.toFixed(4)),
    volatility: Number(volatility.toFixed(4)),
    trend,
    trendValue: Number((slope * 100).toFixed(6)),
  }
}
