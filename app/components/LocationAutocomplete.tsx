'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [query, setQuery] = useState(initialLocation?.displayName || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
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
      setGeoError(null);
      try {
        const data = await fetchLocationSuggestions(query);
        if (!Array.isArray(data)) {
          throw new Error(
            `Invalid response format: ${JSON.stringify(data).substring(
              0,
              100,
            )}`,
          );
        }
        setSuggestions(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
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
    setGeoError(null);
    try {
      const locationData = await fetchReverseGeocode(lat, lon);
      handleSelect(locationData);
    } catch (error) {
      const genericName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      const manualLocation = {
        display_name: genericName,
        lat: lat.toString(),
        lon: lon.toString(),
      };
      handleSelect(manualLocation);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (query.length < 2) {
      return;
    }
    const coordsInput = tryParseCoordinates(query);
    if (coordsInput) {
      handleDirectCoordinates(coordsInput.lat, coordsInput.lon);
      return;
    }
    setLoading(true);
    setError(null);
    setGeoError(null);
    try {
      const data = await fetchLocationSuggestions(query);
      if (!Array.isArray(data)) {
        throw new Error(
          `Invalid response format: ${JSON.stringify(data).substring(0, 100)}`,
        );
      }
      if (data.length === 1) {
        handleSelect(data[0]);
        return;
      }
      setSuggestions(data);
      if (data.length === 0) {
        setError(
          `No locations found for "${query}". Try a city name or coordinates.`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to search: ${errorMessage}`);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: LocationSuggestion | null) => {
    if (suggestion) {
      setSelectedLocation(suggestion);
      onLocationSelect(
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon),
        suggestion.display_name,
      );
      setQuery(suggestion.display_name);
      setSuggestions([]);
      inputRef.current?.blur();
    }
  };

  const handleUseMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    const cached = sessionStorage.getItem('userLocation');
    if (cached) {
      try {
        const { latitude, longitude, displayName } = JSON.parse(cached);
        const cachedLocation = {
          display_name: displayName,
          lat: latitude.toString(),
          lon: longitude.toString(),
        };
        handleSelect(cachedLocation);
        return;
      } catch {
        sessionStorage.removeItem('userLocation');
      }
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const locationData = await fetchReverseGeocode(latitude, longitude);
          handleSelect(locationData);
          sessionStorage.setItem(
            'userLocation',
            JSON.stringify({
              latitude,
              longitude,
              displayName: locationData.display_name,
            }),
          );
        } catch (error) {
          const genericName = `My Location (${latitude.toFixed(
            4,
          )}, ${longitude.toFixed(4)})`;
          const manualLocation = {
            display_name: genericName,
            lat: latitude.toString(),
            lon: longitude.toString(),
          };
          handleSelect(manualLocation);
          sessionStorage.setItem(
            'userLocation',
            JSON.stringify({
              latitude,
              longitude,
              displayName: genericName,
            }),
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Permission denied. Please allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setGeoError('The request to get your location timed out.');
            break;
          default:
            setGeoError('An unknown error occurred while fetching location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 600000 },
    );
  };

  return (
    <div className="relative w-full">
      <Combobox value={selectedLocation} onChange={handleSelect}>
        <div className="flex gap-2 mb-2">
          <Combobox.Input
            as={Input}
            ref={inputRef}
            onChange={(event) => setQuery(event.target.value)}
            displayValue={(location: LocationSuggestion) =>
              location?.display_name || query
            }
            placeholder="City, address, postal code, or coordinates (lat, lon)"
            className="bg-gray-800 text-white border border-gray-600 rounded-md px-4 py-2 flex-1"
            autoComplete="off"
          />
          <Button onClick={handleManualSearch} variant="default">
            Search
          </Button>
          <Button onClick={handleUseMyLocation} variant="secondary">
            Use My Location
          </Button>
        </div>

        {loading && <p className="text-gray-400 text-sm mt-2">Searching...</p>}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {geoError && <p className="text-yellow-400 text-sm mt-2">{geoError}</p>}

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery(query)}
        >
          <Combobox.Options className="absolute z-50 w-full bg-gray-900 border border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-y-auto">
            {suggestions.length === 0 && query.length > 1 && !loading ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                Nothing found.
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <Combobox.Option
                  key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 px-4 text-white ${
                      active ? 'bg-blue-600' : ''
                    }`
                  }
                  value={suggestion}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {suggestion.display_name}
                      </span>
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>

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
      </Combobox>
    </div>
  );
}
