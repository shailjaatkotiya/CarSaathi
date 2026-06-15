import axios from "axios";

const DEFAULT_ERROR_MESSAGE = "Could not continue. Please check your details and try again.";

export function apiErrorMessage(err: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  const detail = err.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(". ") || fallback;
  }
  if (err.code === "ERR_NETWORK") {
    return "Could not reach the backend. Please make sure the API server is running on port 8000.";
  }
  return fallback;
}
