import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface CityResult {
  id: number;
  name: string;
  country: string;
  admin1?: string; // State/Province
}

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, country?: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search city...",
  className = ""
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!query || query.length < 2 || query === value) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
        const data = await response.json();
        
        if (data.results) {
          setResults(data.results.map((r: any) => ({
            id: r.id,
            name: r.name,
            country: r.country,
            admin1: r.admin1
          })));
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, value]);

  const handleSelect = (city: CityResult) => {
    setQuery(city.name);
    onChange(city.name, city.country);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value !== value) {
              onChange(e.target.value); // Update parent with raw text too
            }
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#635BFF]/50 transition-all text-xs ${className}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {results.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white">{city.name}</div>
                <div className="text-xs text-gray-400">
                  {[city.admin1, city.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
