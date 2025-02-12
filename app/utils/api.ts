const ASTRONOMY_API_URL = "https://api.astronomyapi.com/api/v2"
const ASTRONOMY_API_KEY = process.env.NEXT_PUBLIC_ASTRONOMY_API_KEY
const ASTRONOMY_API_SECRET = process.env.ASTRONOMY_API_SECRET
const ORIGIN_URL = "http://localhost:3000"

interface CelestialObject {
  name: string
  rightAscension: string
  declination: string
  altitude: number
  azimuth: number
}

interface CelestialData {
  planets: CelestialObject[]
}

export async function getCelestialData(latitude: number, longitude: number): Promise<CelestialData> {
  if (!ASTRONOMY_API_KEY || !ASTRONOMY_API_SECRET) {
    throw new Error("API credentials not set in environment variables")
  }

  const date = new Date().toISOString().split("T")[0]
  const time = new Date().toISOString().split("T")[1].split(".")[0]

  const response = await fetch(
    `${ASTRONOMY_API_URL}/bodies/positions?latitude=${latitude}&longitude=${longitude}&from_date=${date}&to_date=${date}&time=${time}&elevation=1`,
    {
      headers: {
        Authorization: "Basic " + btoa(`${ASTRONOMY_API_KEY}:${ASTRONOMY_API_SECRET}`),
        Origin: ORIGIN_URL,
      },
    },
  )

  if (!response.ok) {
    console.error("API Error:", await response.text())
    throw new Error(`Failed to fetch celestial data: ${response.statusText}`)
  }

  const data = await response.json()

  const planets = data.data.table.rows
    .filter((row: any) => row.entry.name !== "Earth" && row.entry.type === "Planet")
    .map((row: any) => ({
      name: row.entry.name,
      rightAscension: row.cells[0].position.equatorial.rightAscension.hours,
      declination: row.cells[0].position.equatorial.declination.degrees,
      altitude: row.cells[0].position.horizontal.altitude.degrees,
      azimuth: row.cells[0].position.horizontal.azimuth.degrees,
    }))

  return { planets }
}

