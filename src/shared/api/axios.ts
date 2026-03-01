import axios from "axios";
import { notificationService } from "../services/notifications";
import { getApiErrorMessage } from "../utils/errorMessages";

const baseURL = "/api";

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;

    if (status === 401) {
      notificationService.warning(
        "Сессия истекла. Перенаправляем на страницу входа...",
      );
      window.location.href = "/login";
      return Promise.reject(error);
    }

    const message = getApiErrorMessage(error);
    notificationService.error(message);

    return Promise.reject(error);
  },
);
