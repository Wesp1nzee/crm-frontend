// src/shared/hooks/useCourtSuggest.ts
import { useState, useCallback, useRef } from "react";
import { dadataApi } from "../../entities/dadata/api";
import type { CourtSuggestion } from "../../entities/dadata/types";

const DEBOUNCE_MS = 300;
const DEFAULT_COUNT = 10;
const MIN_QUERY_LENGTH = 3;

interface UseCourtSuggestOptions {
  count?: number;
  minQueryLength?: number;
}

export function useCourtSuggest(options?: UseCourtSuggestOptions) {
  const [suggestions, setSuggestions] = useState<CourtSuggestion[]>([]);
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
          const response = await dadataApi.suggestCourt({
            query: trimmed,
            count,
          });

          if (latestQueryRef.current !== trimmed) {
            return;
          }

          setSuggestions(response.data.suggestions);
        } catch (error) {
          console.error("[useCourtSuggest] Error fetching suggestions:", error);
          if (latestQueryRef.current !== trimmed) return;

          setSuggestions([]);
        } finally {
          if (latestQueryRef.current === trimmed) {
            setIsLoading(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    [count, minQueryLength],
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
