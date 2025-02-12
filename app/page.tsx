"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import NightSkyMap from "./components/NightSkyMap"
import LocationAutocomplete from "./components/LocationAutocomplete"
import { getCelestialData } from "./utils/api"

export default function Home() {
  const [celestialData, setCelestialData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLocationSelect = async (latitude: number, longitude: number) => {
    setLoading(true)
    setError(null)

    try {
      const data = await getCelestialData(latitude, longitude)
      setCelestialData(data)
    } catch (err) {
      console.error("Error fetching celestial data:", err)
      setError("Failed to fetch celestial data. Please check your API credentials and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Night Sky Explorer</h1>
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>Enter Your Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationAutocomplete onLocationSelect={handleLocationSelect} />
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>
      {loading && <p>Loading celestial data...</p>}
      {celestialData && (
        <div className="w-full max-w-4xl">
          <NightSkyMap data={celestialData} />
        </div>
      )}
    </main>
  )
}