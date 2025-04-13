'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DatePicker from './ui/DatePicker';
import { fetchLocationSuggestions, fetchReverseGeocode } from '@/app/utils/api';
import type { LocationSuggestion } from '@/app/types';

interface LocationAutocompleteProps {
  onLocationSelect: (
    latitude: number,
    longitude: number,
    displayName: string,
  ) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    displayName: string;
  };
}

export default function LocationAutocomplete({
  onLocationSelect,
  initialLocation,
}: LocationAutocompleteProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [query, setQuery] = useState(initialLocation?.displayName || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(
      initialLocation
        ? {
            display_name: initialLocation.displayName,
            lat: initialLocation.latitude.toString(),
            lon: initialLocation.longitude.toString(),
          }
        : null,
    );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryParseCoordinates = (
    input: string,
  ): { lat: number; lon: number } | null => {
    const coordPattern = /^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/;
    const match = input.match(coordPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
    return null;
  };

  const isPostalCode = (input: string): boolean => {
    const usPattern = /^\d{5}(-\d{4})?$/;
    const ukPattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    const caPattern = /^[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]$/i;
    return (
      usPattern.test(input) || ukPattern.test(input) || caPattern.test(input)
    );
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const coordsInput = tryParseCoordinates(query);
    if (coordsInput) {
      handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
      return;
    }
    const debounceTime = isPostalCode(query) ? 100 : 300;
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLocationSuggestions(query);
        const filteredData = Array.isArray(data)
          ? data.filter((loc) => {
              const lowerCaseName = loc.display_name.toLowerCase();
              return (
                lowerCaseName.includes('united states') ||
                lowerCaseName.includes('usa')
              );
            })
          : data;
        setSuggestions(filteredData);
      } catch (_error) {
        setError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceTime);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleDirectCoordinates = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const locationData = await fetchReverseGeocode(lat, lon);
      setSelectedLocation(locationData);
      setQuery(locationData.display_name);
      setSuggestions([]);
    } catch (_error) {
      const genericName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      const manualLocation = {
        display_name: genericName,
        lat: lat.toString(),
        lon: lon.toString(),
      };
      setSelectedLocation(manualLocation);
      setQuery(genericName);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // When a suggestion is clicked, update only the search bar and hide the dropdown.
  const handleSelect = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.display_name);
    setSelectedLocation(suggestion);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleManualSearch = async () => {
    if (query.length < 2) return;
    const coordsInput = tryParseCoordinates(query);
    if (coordsInput) {
      handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocationSuggestions(query);
      const filteredData = Array.isArray(data)
        ? data.filter((loc) => {
            const lowerCaseName = loc.display_name.toLowerCase();
            return (
              lowerCaseName.includes('united states') ||
              lowerCaseName.includes('usa')
            );
          })
        : data;
      if (filteredData.length === 1) {
        handleSelect(filteredData[0]);
        onLocationSelect(
          parseFloat(filteredData[0].lat),
          parseFloat(filteredData[0].lon),
          filteredData[0].display_name,
        );
        return;
      }
      setSuggestions(filteredData);
      if (filteredData.length === 0) {
        setError(
          `No locations found for "${query}". Try a city name or coordinates.`,
        );
      }
    } catch (_error) {
      setError('Failed to search');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const locationData = await fetchReverseGeocode(latitude, longitude);
          setQuery(locationData.display_name);
          setSelectedLocation(locationData);
        } catch (_error) {
          const genericName = `My Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          const manualLocation = {
            display_name: genericName,
            lat: latitude.toString(),
            lon: longitude.toString(),
          };
          setSelectedLocation(manualLocation);
          setQuery(genericName);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error('Error getting location:', error);
        alert(
          'Could not get your location. Please allow access or enter it manually.',
        );
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 600000 },
    );
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (
      selectedLocation &&
      !newQuery.includes(selectedLocation.display_name) &&
      !selectedLocation.display_name.includes(newQuery)
    ) {
      setSelectedLocation(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        handleManualSearch();
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* DatePicker integrated from the UI folder */}
      <div className="mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 mb-2">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="City, address, postal code, or coordinates (lat, lon)"
          className="bg-gray-800 text-white border border-gray-600 rounded-md px-4 py-2 flex-1"
          autoComplete="off"
        />
        <Button onClick={handleManualSearch} variant="default">
          Search
        </Button>
        <Button onClick={handleUseMyLocation} variant="secondary">
          My Location
        </Button>
      </div>

      {loading && <p className="text-gray-400 text-sm mt-2">Searching...</p>}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {suggestions.length > 0 && (
        <Card className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 shadow-lg rounded-md z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-2 space-y-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                onClick={() => handleSelect(suggestion)}
                className="cursor-pointer p-2 hover:bg-gray-700 rounded-md text-white"
              >
                {suggestion.display_name}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
