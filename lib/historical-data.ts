// Função para gerar dados históricos simulados de ALTBG vs BTC com valores mais precisos
export function generateHistoricalData() {
  const data = []
  const startDate = new Date("2024-08-01")
  const endDate = new Date()

  // Preços reais aproximados em agosto 2024
  let altbgPrice = 8.75 // EUR - valor mais realista para ALTBG.PA
  let btcPrice = 60000 // USD - valor aproximado em agosto 2024

  // Preços atuais aproximados (maio 2025)
  const currentAltbgPrice = 12.45 // EUR
  const currentBtcPrice = 95000 // USD

  // Calcular taxa de crescimento diária para atingir os valores atuais
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const btcDailyGrowthRate = Math.pow(currentBtcPrice / btcPrice, 1 / totalDays)
  const altbgDailyGrowthRate = Math.pow(currentAltbgPrice / altbgPrice, 1 / totalDays)

  // Taxa de câmbio EUR/USD aproximada
  const eurToUsd = 1.08

  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Adicionar variação aleatória em torno da tendência geral
    const btcRandomFactor = 1 + (Math.random() - 0.5) * 0.04 // ±2% variação diária
    const altbgRandomFactor = 1 + (Math.random() - 0.5) * 0.02 // ±1% variação diária

    // Aplicar crescimento tendencial + variação aleatória
    btcPrice = btcPrice * btcDailyGrowthRate * btcRandomFactor
    altbgPrice = altbgPrice * altbgDailyGrowthRate * altbgRandomFactor

    // Converter ALTBG para USD para comparação
    const altbgPriceUSD = altbgPrice * eurToUsd

    // Calcular quantas ações ALTBG equivalem a 1 BTC
    const altbgPerBtc = btcPrice / altbgPriceUSD

    data.push({
      date: new Date(currentDate).toISOString().split("T")[0],
      altbgPrice: Number(altbgPrice.toFixed(2)),
      btcPrice: Number(btcPrice.toFixed(0)),
      altbgPriceUSD: Number(altbgPriceUSD.toFixed(2)),
      altbgPerBtc: Number(altbgPerBtc.toFixed(0)),
      ratio: Number((btcPrice / altbgPriceUSD).toFixed(2)),
    })

    // Avançar um dia
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

// Função para obter dados mais recentes (últimos 30 dias com mais detalhes)
export function getRecentDetailedData() {
  const data = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30)

  // Preços atuais reais aproximados
  let altbgPrice = 12.45 // EUR
  let btcPrice = 95000 // USD
  const eurToUsd = 1.08

  // Retroceder 30 dias para o início do período
  const historicalAltbgPrice = altbgPrice * 0.95 // 5% menor há 30 dias
  const historicalBtcPrice = btcPrice * 0.9 // 10% menor há 30 dias

  // Calcular taxa de crescimento diária
  const totalDays = 30
  const btcDailyGrowthRate = Math.pow(btcPrice / historicalBtcPrice, 1 / totalDays)
  const altbgDailyGrowthRate = Math.pow(altbgPrice / historicalAltbgPrice, 1 / totalDays)

  // Resetar para valores históricos para começar a simulação
  btcPrice = historicalBtcPrice
  altbgPrice = historicalAltbgPrice

  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Variações diárias mais detalhadas para dados recentes
    const btcRandomFactor = 1 + (Math.random() - 0.5) * 0.03
    const altbgRandomFactor = 1 + (Math.random() - 0.5) * 0.015

    // Aplicar crescimento tendencial + variação aleatória
    btcPrice = btcPrice * btcDailyGrowthRate * btcRandomFactor
    altbgPrice = altbgPrice * altbgDailyGrowthRate * altbgRandomFactor

    const altbgPriceUSD = altbgPrice * eurToUsd
    const altbgPerBtc = btcPrice / altbgPriceUSD

    data.push({
      date: new Date(currentDate).toISOString().split("T")[0],
      altbgPrice: Number(altbgPrice.toFixed(2)),
      btcPrice: Number(btcPrice.toFixed(0)),
      altbgPriceUSD: Number(altbgPriceUSD.toFixed(2)),
      altbgPerBtc: Number(altbgPerBtc.toFixed(0)),
      ratio: Number((btcPrice / altbgPriceUSD).toFixed(2)),
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}
