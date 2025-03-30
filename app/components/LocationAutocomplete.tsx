'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchLocationSuggestions, fetchReverseGeocode } from '@/app/utils/api';
import type { LocationSuggestion } from '@/app/types';

interface LocationAutocompleteProps {
  onLocationSelect: (latitude: number, longitude: number) => void;
}

export default function LocationAutocomplete({
  onLocationSelect,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchLocationSuggestions(query);
        setSuggestions(data);
      } catch (error) {
        console.error(error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (suggestion: LocationSuggestion) => {
    onLocationSelect(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setQuery(suggestion.display_name);
    setSuggestions([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const locationData = await fetchReverseGeocode(latitude, longitude);
          setQuery(locationData.display_name);
          onLocationSelect(latitude, longitude);
        } catch (error) {
          console.error(error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your location. Please allow access.');
      },
    );
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2 mb-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a location..."
          className="bg-gray-800 text-white border border-gray-600 rounded-md px-4 py-2 flex-1"
        />
        <Button onClick={handleUseMyLocation} variant="secondary">
          Use My Location
        </Button>
      </div>
      {loading && <p className="text-gray-400 text-sm mt-2">Searching...</p>}
      {suggestions.length > 0 && (
        <Card className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 shadow-lg rounded-md z-50 mt-1">
          <CardContent className="p-2 space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.display_name}
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
