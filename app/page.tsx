"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import CelestialObjectsList from "./components/CelestialObjectsList"
import LocationAutocomplete from "./components/LocationAutocomplete"
import TimeSlider from "./components/TimeSlider"
import SkyConditions from "./components/SkyConditions"
import { getCelestialData } from "./utils/api"
import type { CelestialData, CelestialObject } from "./types"

export default function Home() {
  const [celestialData, setCelestialData] = useState<CelestialData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null)

  const handleLocationSelect = async (latitude: number, longitude: number, time: string) => {
    setLoading(true)

    try {
      const data = await getCelestialData(latitude, longitude, time)
      setCelestialData(data)
      setCurrentTime(data.nightStart) // Set to nightStart as the initial time
    } catch (error) {
      console.error("Error fetching celestial data:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (newTime: Date) => {
    setCurrentTime(newTime)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">Night Sky Explorer</h1>
      <div className="w-full max-w-7xl grid grid-cols-12 gap-4">
        <Card className="col-span-12 mb-4 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">Enter Your Location and Time</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationAutocomplete onLocationSelect={handleLocationSelect} />
          </CardContent>
        </Card>

        {loading && <p className="col-span-12 text-center text-primary">Loading celestial data...</p>}

        {celestialData && currentTime && (
          <>
            <Card className="col-span-12 mb-4 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary">Night Sky Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TimeSlider
                  startTime={celestialData.nightStart}
                  endTime={celestialData.nightEnd}
                  currentTime={currentTime}
                  onTimeChange={handleTimeChange}
                  selectedObject={selectedObject}
                  celestialObjects={celestialData.objects} // Add this prop
                />
              </CardContent>
            </Card>

            <div className="col-span-12 md:col-span-8 lg:col-span-9">
              <CelestialObjectsList data={celestialData} currentTime={currentTime} onObjectSelect={setSelectedObject} />
            </div>
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
              <SkyConditions data={celestialData} currentTime={currentTime} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}