export const API_CONFIG = {
  // Alpha Vantage API configuration
  ALPHA_VANTAGE: {
    BASE_URL: "https://www.alphavantage.co/query",
    RATE_LIMIT: 5, // requests per minute for free tier
    CACHE_DURATION: 300, // 5 minutes in seconds
  },

  // Stock symbols configuration
  STOCKS: {
    ALTBG: {
      name: "Altabancorp",
      exchange: "NASDAQ",
      description: "Altabancorp Common Stock",
    },
  },
}
