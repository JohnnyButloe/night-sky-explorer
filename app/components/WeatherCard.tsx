import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Cloud, Eye, Droplet } from "lucide-react"
import type { WeatherData } from "../types"

interface WeatherCardProps {
  weather: WeatherData
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Cloud className="w-5 h-5 mr-2" />
              <span>Current Cloud Cover: {weather.currentCloudCover}%</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              <span>Current Visibility: {(weather.currentVisibility / 1000).toFixed(1)} km</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Hourly Forecast</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weather.hourlyForecast.map((forecast, index) => (
                <div key={index} className="bg-secondary p-2 rounded-md text-sm">
                  <p className="font-medium">{forecast.time}</p>
                  <div className="flex items-center">
                    <Cloud className="w-4 h-4 mr-1" />
                    <span>{forecast.cloudCover}%</span>
                  </div>
                  <div className="flex items-center">
                    <Droplet className="w-4 h-4 mr-1" />
                    <span>{forecast.rainProbability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-sm">
            {weather.currentCloudCover < 30 ? (
              <p className="text-green-600">Great conditions for stargazing!</p>
            ) : weather.currentCloudCover < 70 ? (
              <p className="text-yellow-600">Fair conditions for stargazing.</p>
            ) : (
              <p className="text-red-600">Poor conditions for stargazing.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}