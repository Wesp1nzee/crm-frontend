// src/entities/dadata/api.ts
import { api } from "../../shared/api/axios";
import type {
  DadataLookupResponse,
  AddressLookupResult,
  AddressSuggestParams,
  CourtLookupResult,
  CourtSuggestParams,
  PartyLookupResult,
  PartySuggestParams,
} from "./types";

const API_PREFIX = "/dadata";

export const dadataApi = {
  /**
   * Поиск организации по ИНН
   * @param inn - ИНН организации (10 или 12 цифр)
   * @returns данные организации
   */
  lookupByInn: (inn: string) => {
    console.log("[DADATA_API] Запрос данных по ИНН:", {
      endpoint: `${API_PREFIX}/lookup/${inn}`,
    });

    return api
      .get<DadataLookupResponse>(`${API_PREFIX}/lookup/${inn}`)
      .then((res) => {
        console.log("[DADATA_API] Данные получены:", {
          inn: res.data.inn,
          name: res.data.full_name,
          status: res.data.status,
        });
        return res;
      })
      .catch((error) => {
        console.error("[DADATA_API] Ошибка получения данных:", {
          inn,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        throw error;
      });
  },

  /**
   * Подсказки адресов при вводе (автодополнение)
   * @param params - параметры запроса (query, count, from_bound, to_bound)
   * @returns список подсказок адресов
   */
  suggestAddress: (params: AddressSuggestParams) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    );

    console.log("[DADATA_API] Запрос подсказок адресов:", {
      endpoint: `${API_PREFIX}/suggest/address`,
      params: cleanParams,
    });

    return api
      .get<AddressLookupResult>(`${API_PREFIX}/suggest/address`, {
        params: cleanParams,
      })
      .then((res) => {
        console.log("[DADATA_API] Подсказки адресов получены:", {
          count: res.data.suggestions.length,
        });
        return res;
      })
      .catch((error) => {
        console.error("[DADATA_API] Ошибка получения подсказок адресов:", {
          query: params.query,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        throw error;
      });
  },

  /**
   * Подсказки судов при вводе (автодополнение)
   * @param params - параметры запроса (query, count)
   * @returns список подсказок судов
   */
  suggestCourt: (params: CourtSuggestParams) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    );

    console.log("[DADATA_API] Запрос подсказок судов:", {
      endpoint: `${API_PREFIX}/suggest/court`,
      params: cleanParams,
    });

    return api
      .get<CourtLookupResult>(`${API_PREFIX}/suggest/court`, {
        params: cleanParams,
      })
      .then((res) => {
        console.log("[DADATA_API] Подсказки судов получены:", {
          count: res.data.suggestions.length,
        });
        return res;
      })
      .catch((error) => {
        console.error("[DADATA_API] Ошибка получения подсказок судов:", {
          query: params.query,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        throw error;
      });
  },

  /**
   * Подсказки организаций при вводе (автодополнение)
   * @param params - параметры запроса (query, count, party_type, status, okved)
   * @returns список подсказок организаций
   */
  suggestParty: (params: PartySuggestParams) => {
    const cleanParams: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value) && value.length > 0) {
        cleanParams[key] = value.join(",");
      } else if (!Array.isArray(value)) {
        cleanParams[key] = value;
      }
    }

    console.log("[DADATA_API] Запрос подсказок организаций:", {
      endpoint: `${API_PREFIX}/suggest/party`,
      params: cleanParams,
    });

    return api
      .get<PartyLookupResult>(`${API_PREFIX}/suggest/party`, {
        params: cleanParams,
      })
      .then((res) => {
        console.log("[DADATA_API] Подсказки организаций получены:", {
          count: res.data.suggestions.length,
        });
        return res;
      })
      .catch((error) => {
        console.error("[DADATA_API] Ошибка получения подсказок организаций:", {
          query: params.query,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        throw error;
      });
  },
};
