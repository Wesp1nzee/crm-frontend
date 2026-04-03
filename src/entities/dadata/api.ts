// src/entities/dadata/api.ts
import { api } from "../../shared/api/axios";
import type { DadataLookupResponse } from "./types";

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
};
