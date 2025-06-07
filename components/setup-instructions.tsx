import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, Info } from "lucide-react"

export function SetupInstructions({ isDemo }: { isDemo?: boolean }) {
  if (isDemo) {
    return (
      <Card className="bg-blue-900/20 border-blue-600/50 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-400">
            <Info className="h-5 w-5 mr-2" />
            Demo Mode Active
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-200">
          <p className="mb-3">You're currently viewing simulated stock data. To get real-time data:</p>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li>
              Get a free API key from{" "}
              <a
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                Alpha Vantage <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </li>
            <li>
              Set the environment variable <code className="bg-gray-800 px-1 rounded">ALPHA_VANTAGE_API_KEY</code>
            </li>
            <li>Restart your application</li>
          </ol>
          <p className="text-sm">
            <strong>Note:</strong> Demo data updates with realistic price movements for testing.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-yellow-900/20 border-yellow-600/50 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          API Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="text-yellow-200">
        <p className="mb-3">To display real stock data, you need to configure an Alpha Vantage API key:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>
            Visit{" "}
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center"
            >
              Alpha Vantage <ExternalLink className="h-3 w-3 ml-1" />
            </a>{" "}
            to get a free API key
          </li>
          <li>
            Add your API key to environment variables as{" "}
            <code className="bg-gray-800 px-1 rounded">ALPHA_VANTAGE_API_KEY</code>
          </li>
          <li>Restart your development server</li>
        </ol>
        <p className="text-sm">
          <strong>Note:</strong> Free tier allows 5 API calls per minute and 500 calls per day.
        </p>
      </CardContent>
    </Card>
  )
}
