"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

interface LocationAutocompleteProps {
  onLocationSelect: (latitude: number, longitude: number) => void
}

export default function LocationAutocomplete({ onLocationSelect }: LocationAutocompleteProps) {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) return
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`,
      )
      if (!response.ok) throw new Error("Failed to fetch suggestions")
      const data: any[] = await response.json()
      const filteredData = data
        .filter((item) => item.type === "city" || item.type === "administrative")
        .map((item) => ({
          display_name: `${item.address.city || item.address.town || item.address.village || item.address.state || ""}, ${item.address.country}`,
          lat: item.lat,
          lon: item.lon,
        }))
      setSuggestions(filteredData)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    debouncedFetchSuggestions(value)
  }

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setInput(suggestion.display_name)
    setShowSuggestions(false)
    onLocationSelect(Number.parseFloat(suggestion.lat), Number.parseFloat(suggestion.lon))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestions.length > 0) {
      const firstSuggestion = suggestions[0]
      handleSuggestionClick(firstSuggestion)
    }
  }

  return (
    <div ref={autocompleteRef} className="relative">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter city or country"
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Explore"}
        </Button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}