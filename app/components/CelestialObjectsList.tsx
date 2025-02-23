"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Star } from "lucide-react"
import TimeSlider from "./TimeSlider"
import type { CelestialData, CelestialObject } from "../types"

interface CelestialObjectsListProps {
  data: CelestialData
  currentTime: Date
  onObjectSelect: (object: CelestialObject | null) => void
}

function getVisibilityInfo(altitude: number, azimuth: number): { visible: boolean; direction: string } {
  const visible = altitude > 0
  let direction = ""

  if (azimuth >= 315 || azimuth < 45) direction = "North"
  else if (azimuth >= 45 && azimuth < 135) direction = "East"
  else if (azimuth >= 135 && azimuth < 225) direction = "South"
  else if (azimuth >= 225 && azimuth < 315) direction = "West"

  return { visible, direction }
}

function VisibilityIndicator({ visible, altitude }: { visible: boolean; altitude: number }) {
  if (!visible) return null
  const easyToSee = altitude > 50

  return (
    <span title={easyToSee ? "Easily visible" : "Visible"} className="ml-1">
      {easyToSee ? "🔭" : "👁️"}
    </span>
  )
}

function CelestialObjectCard({
  object,
  currentTime,
  weather,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: {
  object: CelestialObject
  currentTime: Date
  weather: CelestialData["weather"]
  isFavorite: boolean
  onToggleFavorite: (objectName: string) => void
  onSelect: (object: CelestialObject) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const currentHourData =
    object.hourlyData.find((data) => data.time.getTime() === currentTime.getTime()) || object.hourlyData[0]
  const { visible, direction } = getVisibilityInfo(currentHourData.altitude, currentHourData.azimuth)

  const isBestViewing =
    object.additionalInfo.bestViewingTime &&
    Math.abs(object.additionalInfo.bestViewingTime.getTime() - currentTime.getTime()) < 30 * 60 * 1000 // within 30 minutes

  const cloudCoverAtTime =
    weather.hourlyForecast.find((forecast) => new Date(forecast.time).getTime() === currentTime.getTime())
      ?.cloudCover || weather.currentCloudCover

  const isGoodViewing = visible && currentHourData.altitude > 30 && cloudCoverAtTime < 50

  return (
    <Card className={`mb-2 bg-card/50 backdrop-blur-sm ${isBestViewing ? "border border-yellow-400" : ""}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm flex items-center">
              {object.name} ({object.type})
              <VisibilityIndicator visible={visible} altitude={currentHourData.altitude} />
              <button onClick={() => onToggleFavorite(object.name)} className="ml-2 focus:outline-none">
                <Star className={`w-4 h-4 ${isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
              </button>
            </h3>
            <p className="text-xs text-gray-600">
              Alt: {currentHourData.altitude.toFixed(1)}°, Az: {currentHourData.azimuth.toFixed(1)}°
            </p>
          </div>
          <div className="text-right text-xs">
            {visible ? (
              <p className="text-green-600 font-medium">Visible</p>
            ) : (
              <p className="text-red-600 font-medium">Not visible</p>
            )}
            {visible && <p>{direction}</p>}
            <p className="text-blue-500">
              Best Time:{" "}
              {object.additionalInfo.bestViewingTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        {isGoodViewing && <p className="mt-1 text-xs text-green-600">Good viewing conditions</p>}
        <div className="flex justify-between items-center mt-1">
          <button
            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Show Details
              </>
            )}
          </button>
          <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => onSelect(object)}>
            Show Best Time
          </button>
        </div>
        {isExpanded && (
          <div className="mt-2 p-2 bg-secondary/30 rounded-md text-xs">
            <p>Rise: {object.additionalInfo.riseDirection}</p>
            <p>Max Alt: {object.additionalInfo.maxAltitude.toFixed(1)}°</p>
            {object.additionalInfo.phase && <p>Moon Phase: {object.additionalInfo.phase}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CelestialObjectsList({ data, currentTime, onObjectSelect }: CelestialObjectsListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [sortedObjects, setSortedObjects] = useState<CelestialObject[]>([])

  useEffect(() => {
    const sorted = [...data.objects].sort((a, b) => {
      if (favorites.has(a.name) && !favorites.has(b.name)) return -1
      if (!favorites.has(a.name) && favorites.has(b.name)) return 1
      return 0
    })
    setSortedObjects(sorted)
  }, [data.objects, favorites])

  const toggleFavorite = (objectName: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(objectName)) {
        newFavorites.delete(objectName)
      } else {
        newFavorites.add(objectName)
      }
      return newFavorites
    })
  }

  // Handle case where data or data.objects is undefined
  if (!data || !data.objects || data.objects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visible Celestial Objects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">No celestial objects data available.</p>
        </CardContent>
      </Card>
    )
  }

  // Example TimeSlider integration (adjust start/end times as needed)
  const startTime = data.nightStart // Use nightStart from mock data
  const endTime = data.nightEnd // Use nightEnd from mock data

  const handleTimeChange = (newTime: Date) => {
    // Update currentTime or handle time change logic here
    console.log("Time changed to:", newTime)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-primary">Celestial Objects</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {sortedObjects.map((object, index) => (
              <CelestialObjectCard
                key={object.name}
                object={object}
                currentTime={currentTime}
                weather={data.weather}
                isFavorite={favorites.has(object.name)}
                onToggleFavorite={toggleFavorite}
                onSelect={onObjectSelect}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add TimeSlider with celestialObjects */}
      <TimeSlider
        startTime={startTime}
        endTime={endTime}
        currentTime={currentTime}
        onTimeChange={handleTimeChange}
        selectedObject={/* Pass selected object if applicable */}
        celestialObjects={data.objects} // Pass the celestial objects here
      />
    </div>
  )
}