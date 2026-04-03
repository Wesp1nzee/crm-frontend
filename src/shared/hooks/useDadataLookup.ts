// src/shared/hooks/useDadataLookup.ts
import { useState } from "react";
import { dadataApi } from "../../entities/dadata/api";
import type { DadataLookupResponse } from "../../entities/dadata/types";

/**
 * Хук для поиска организации по ИНН через DaData API
 */
export const useManualDadataLookup = () => {
  const [data, setData] = useState<DadataLookupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lookup = async (inn: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dadataApi.lookupByInn(inn);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    data,
    isLoading,
    error,
    lookup,
    reset,
  };
};
