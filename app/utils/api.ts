// Constants and environment variables
const ASTRONOMY_API_URL = "https://api.astronomyapi.com/api/v2"
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
  // Get API key from environment, with more specific error handling
  const apiKey = process.env.NEXT_PUBLIC_ASTRONOMY_API_KEY
  
  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_ASTRONOMY_API_KEY environment variable')
    throw new Error('API key not configured. Please check your environment setup.')
  }

  const date = new Date().toISOString().split("T")[0]
  const time = new Date().toISOString().split("T")[1].split(".")[0]

  try {
    const response = await fetch(
      `${ASTRONOMY_API_URL}/bodies/positions?latitude=${latitude}&longitude=${longitude}&from_date=${date}&to_date=${date}&time=${time}&elevation=1`,
      {
        headers: {
          // Client-side only needs the public key
          Authorization: "Basic " + btoa(`${apiKey}:`),
          Origin: ORIGIN_URL,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
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
  } catch (error: any) {
    console.error('Error in getCelestialData:', error)
    throw new Error(`Failed to fetch celestial data: ${error.message}`)
  }
}