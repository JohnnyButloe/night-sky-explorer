'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchLocationSuggestions, fetchReverseGeocode } from '@/app/utils/api';
import type { LocationSuggestion } from '@/app/types';

interface LocationAutocompleteProps {
  onLocationSelect: (
    latitude: number,
    longitude: number,
    displayName: string,
  ) => void;
  onDone?: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    displayName: string;
  };
}

export default function LocationAutocomplete({
  onLocationSelect,
  onDone,
  initialLocation,
}: LocationAutocompleteProps) {
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

  // Try to parse coordinates directly from input
  const tryParseCoordinates = (
    input: string,
  ): { lat: number; lon: number } | null => {
    // Match formats like "40.7128, -74.0060", "40.7128,-74.0060", or "40.7128 -74.0060"
    const coordPattern = /^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/;
    const match = input.match(coordPattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);

      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
    return null;
  };

  // Parse postal/zip codes
  const isPostalCode = (input: string): boolean => {
    // Simple patterns for common postal code formats
    // US: 5 digits or 5+4
    const usPattern = /^\d{5}(-\d{4})?$/;
    // UK: Alphanumeric format
    const ukPattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    // Canadian: Letter Number Letter Number Letter Number
    const caPattern = /^[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]$/i;

    return (
      usPattern.test(input) || ukPattern.test(input) || caPattern.test(input)
    );
  };

  // Fetch suggestions as the user types (with debounce)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check if input appears to be coordinates
    const coordsInput = tryParseCoordinates(query);
    if (coordsInput) {
      // Skip debounce for direct coordinate input
      handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
      return;
    }

    // If input looks like a postal code, don't wait as long to search
    const debounceTime = isPostalCode(query) ? 100 : 300;

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchLocationSuggestions(query);

        // Check if data is valid
        if (!Array.isArray(data)) {
          throw new Error(
            `Invalid response format: ${JSON.stringify(data).substring(0, 100)}`,
          );
        }

        setSuggestions(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('Suggestion fetch error:', error);
        setError(`Failed to fetch suggestions: ${errorMessage}`);
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
      // Get place name for these coordinates
      const locationData = await fetchReverseGeocode(lat, lon);

      setSelectedLocation(locationData);
      setQuery(locationData.display_name);
      onLocationSelect(lat, lon, locationData.display_name);
      setSuggestions([]);
    } catch (error) {
      // If reverse geocoding fails, still use the coordinates but with a generic name
      const genericName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      const manualLocation = {
        display_name: genericName,
        lat: lat.toString(),
        lon: lon.toString(),
      };

      setSelectedLocation(manualLocation);
      setQuery(genericName);
      onLocationSelect(lat, lon, genericName);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    onLocationSelect(
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon),
      suggestion.display_name,
    );
    setQuery(suggestion.display_name);
    setSuggestions([]);
  };

  const handleDone = () => {
    if (onDone && selectedLocation) {
      onDone();
    } else if (!selectedLocation) {
      // Try to extract coordinates or do a search with what we have
      const coordsInput = tryParseCoordinates(query);
      if (coordsInput) {
        handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
        return;
      }

      // If query is non-empty, automatically search
      if (query.length >= 2) {
        handleManualSearch();
      } else {
        // Only alert if truly nothing to work with
        alert('Please enter a location');
      }
    }
  };

  const handleManualSearch = async () => {
    if (query.length < 2) {
      return;
    }

    // Check for direct coordinates first
    const coordsInput = tryParseCoordinates(query);
    if (coordsInput) {
      handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchLocationSuggestions(query);

      if (!Array.isArray(data)) {
        throw new Error(
          `Invalid response format: ${JSON.stringify(data).substring(0, 100)}`,
        );
      }

      // If we got exactly one result, auto-select it
      if (data.length === 1) {
        handleSelect(data[0]);
        return;
      }

      // Otherwise show all suggestions
      setSuggestions(data);

      // If no results, show a helpful error
      if (data.length === 0) {
        setError(
          `No locations found for "${query}". Try a city name or coordinates.`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Manual search error:', error);
      setError(`Failed to search: ${errorMessage}`);
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
          onLocationSelect(latitude, longitude, locationData.display_name);
        } catch (error) {
          // If reverse geocoding fails, use coordinates directly
          const genericName = `My Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          const manualLocation = {
            display_name: genericName,
            lat: latitude.toString(),
            lon: longitude.toString(),
          };

          setSelectedLocation(manualLocation);
          setQuery(genericName);
          onLocationSelect(latitude, longitude, genericName);
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

  // Handle query changes
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Only clear selection if substantially different
    if (
      selectedLocation &&
      !newQuery.includes(selectedLocation.display_name) &&
      !selectedLocation.display_name.includes(newQuery)
    ) {
      setSelectedLocation(null);
    }
  };

  // Handle pressing Enter in the input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // If suggestions are showing and we have some, select the first one
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        // Otherwise trigger a search
        handleManualSearch();
      }
    }
  };

  return (
    <div className="relative w-full">
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
        <Button onClick={handleManualSearch} variant="primary">
          Search
        </Button>
        <Button onClick={handleUseMyLocation} variant="secondary">
          My Location
        </Button>
      </div>

      {loading && <p className="text-gray-400 text-sm mt-2">Searching...</p>}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {/* Show suggestions */}
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

      {selectedLocation && (
        <div className="mt-2 p-2 bg-gray-800 border border-gray-600 rounded-md">
          <p className="text-sm text-green-400">
            Selected: {selectedLocation.display_name}
          </p>
          <p className="text-xs text-gray-400">
            Coordinates: {parseFloat(selectedLocation.lat).toFixed(4)},{' '}
            {parseFloat(selectedLocation.lon).toFixed(4)}
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleDone}
          variant="primary"
          disabled={loading}
          className={loading ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {selectedLocation ? 'Done' : 'Search & Continue'}
        </Button>
      </div>
    </div>
  );
}
