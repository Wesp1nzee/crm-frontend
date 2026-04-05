// src/shared/hooks/useAddressSuggest.ts
import { useState, useCallback, useRef } from "react";
import { dadataApi } from "../../entities/dadata/api";
import type {
  AddressSuggestion,
  AddressBound,
} from "../../entities/dadata/types";

const DEBOUNCE_MS = 300;
const DEFAULT_COUNT = 10;
const MIN_QUERY_LENGTH = 3;

interface UseAddressSuggestOptions {
  count?: number;
  minQueryLength?: number;
  fromBound?: AddressBound;
  toBound?: AddressBound;
}

export function useAddressSuggest(options?: UseAddressSuggestOptions) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const latestQueryRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = options?.count ?? DEFAULT_COUNT;
  const minQueryLength = options?.minQueryLength ?? MIN_QUERY_LENGTH;

  const fetchSuggestions = useCallback(
    (query: string) => {
      const trimmed = query.trim();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!trimmed || trimmed.length < minQueryLength) {
        latestQueryRef.current = "";
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      timerRef.current = setTimeout(async () => {
        latestQueryRef.current = trimmed;

        try {
          const response = await dadataApi.suggestAddress({
            query: trimmed,
            count,
            from_bound: options?.fromBound,
            to_bound: options?.toBound,
          });

          if (latestQueryRef.current !== trimmed) {
            return;
          }

          setSuggestions(response.data.suggestions);
        } catch (error) {
          console.error("[useAddressSuggest] Error fetching suggestions:", error);
          if (latestQueryRef.current !== trimmed) return;

          setSuggestions([]);
        } finally {
          if (latestQueryRef.current === trimmed) {
            setIsLoading(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    [count, options?.fromBound, options?.toBound, minQueryLength]
  );

  const clearSuggestions = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    latestQueryRef.current = "";
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
