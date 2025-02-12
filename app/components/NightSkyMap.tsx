"use client"

import { useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface CelestialObject {
  name: string
  rightAscension: string
  declination: string
  altitude: number
  azimuth: number
}

interface NightSkyMapProps {
  data: {
    planets: CelestialObject[]
  }
}

export default function NightSkyMap({ data }: NightSkyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw sky background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, "#000033")
        gradient.addColorStop(1, "#000011")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw stars
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          const radius = Math.random() * 1.5
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fillStyle = "white"
          ctx.fill()
        }

        // Draw planets
        data.planets.forEach((planet) => {
          const x = (planet.azimuth / 360) * canvas.width
          const y = canvas.height - (planet.altitude / 90) * canvas.height

          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = getPlanetColor(planet.name)
          ctx.fill()

          ctx.font = "14px Arial"
          ctx.fillStyle = "white"
          ctx.fillText(planet.name, x + 10, y)
        })
      }
    }
  }, [data])

  function getPlanetColor(planetName: string): string {
    switch (planetName.toLowerCase()) {
      case "mercury":
        return "#8C7853"
      case "venus":
        return "#FFA500"
      case "mars":
        return "#FF4500"
      case "jupiter":
        return "#FFA07A"
      case "saturn":
        return "#F4C2C2"
      case "uranus":
        return "#00FFFF"
      case "neptune":
        return "#4169E1"
      default:
        return "white"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Night Sky Map</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width={800} height={400} className="w-full" />
      </CardContent>
    </Card>
  )
}