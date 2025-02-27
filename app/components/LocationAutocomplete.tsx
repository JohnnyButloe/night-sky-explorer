'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocationSuggestions } from '../utils/api';
import type { LocationSuggestion } from '../types';

interface LocationAutocompleteProps {
  onLocationSelect: (latitude: number, longitude: number, time: string) => void;
}

export default function LocationAutocomplete({
  onLocationSelect,
}: LocationAutocompleteProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTime, setSelectedTime] = useState('now');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value.length >= 3) {
      const suggestions = await getLocationSuggestions(value);
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setInput(suggestion.display_name);
    setShowSuggestions(false);
    onLocationSelect(
      Number.parseFloat(suggestion.lat),
      Number.parseFloat(suggestion.lon),
      selectedTime,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const firstSuggestion = suggestions[0];
      handleSuggestionClick(firstSuggestion);
    }
  };

  return (
    <div ref={autocompleteRef} className="relative">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter city or country"
            className="flex-grow"
          />
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Now</SelectItem>
              <SelectItem value="tonight">Tonight (9 PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Explore
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
  );
}
