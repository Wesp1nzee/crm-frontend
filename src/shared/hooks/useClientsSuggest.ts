// src/shared/hooks/useClientsSuggest.ts
import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

interface ClientSuggestion {
  id: string;
  name: string;
}

const DEBOUNCE_MS = 300;

export function useClientsSuggest() {
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const latestQueryRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((query: string) => {
    const trimmed = query.trim();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!trimmed) {
      latestQueryRef.current = '';
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timerRef.current = setTimeout(async () => {
      latestQueryRef.current = trimmed;

      try {
        const response = await axios.get('/api/clients/suggest', {
          params: { q: trimmed },
        });


        if (latestQueryRef.current !== trimmed) {
          return;
        }

        const data = Array.isArray(response.data) ? response.data : [];
        setSuggestions(data);
      } catch (error) {
        console.error(error)
        if (latestQueryRef.current !== trimmed) return;

        setSuggestions([]);
      } finally {
        if (latestQueryRef.current === trimmed) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearSuggestions = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    latestQueryRef.current = '';
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    clearSuggestions,
  };
}