import axios from "axios";

const statusErrorMap: Record<number, string> = {
  400: "Некорректный запрос. Проверьте заполненные данные.",
  401: "Сессия истекла. Выполните вход повторно.",
  403: "Недостаточно прав для выполнения операции.",
  404: "Запрошенный ресурс не найден.",
  409: "Конфликт данных. Обновите страницу и повторите попытку.",
  422: "Ошибка валидации. Проверьте введённые данные.",
  429: "Слишком много запросов. Попробуйте позже.",
  500: "Ошибка сервера. Попробуйте позже.",
  502: "Сервис временно недоступен (502).",
  503: "Сервис временно недоступен (503).",
  504: "Превышено время ожидания ответа сервера.",
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Произошла ошибка. Попробуйте позже.",
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data as
      | { message?: string; detail?: string | Array<{ type?: string; loc?: string[]; msg?: string; input?: unknown }> }
      | undefined;

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.detail) {
      // Handle FastAPI validation errors (array of error objects)
      if (Array.isArray(responseData.detail)) {
        return responseData.detail
          .map((err) => {
            const field = err.loc?.slice(1).join(".") ?? "field";
            const msg = err.msg ?? "Validation error";
            return `${field}: ${msg}`;
          })
          .join("; ");
      }
      // Handle string detail
      if (typeof responseData.detail === "string") {
        return responseData.detail;
      }
    }

    if (!error.response) {
      return "Не удалось подключиться к серверу. Проверьте интернет-соединение.";
    }

    if (status && statusErrorMap[status]) {
      return statusErrorMap[status];
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
