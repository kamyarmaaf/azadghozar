const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^(?:https?:|blob:|data:)/.test(value)) return value;
  try {
    return new URL(value, new URL(API_BASE_URL).origin).toString();
  } catch {
    return value;
  }
}

const ACCESS_TOKEN_KEY = "azadgozar-access-token";
const REFRESH_TOKEN_KEY = "azadgozar-refresh-token";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function storageAvailable(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  return storageAvailable()
    ? window.localStorage.getItem(ACCESS_TOKEN_KEY)
    : null;
}

export function getRefreshToken(): string | null {
  return storageAvailable()
    ? window.localStorage.getItem(REFRESH_TOKEN_KEY)
    : null;
}

export function saveAuthTokens(tokens: AuthTokens): void {
  if (!storageAvailable()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearAuthTokens(): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function firstErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = firstErrorMessage(item);
      if (message) return message;
    }
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["detail", "error", ...Object.keys(record)]) {
      const message = firstErrorMessage(record[key]);
      if (message) return message;
    }
  }
  return null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token is available.");

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const payload = await readResponseBody(response);
  if (!response.ok) {
    clearAuthTokens();
    throw new ApiError(
      firstErrorMessage(payload) || "نشست شما منقضی شده است.",
      response.status,
      payload,
    );
  }

  const access = (payload as { access: string }).access;
  saveAuthTokens({ access, refresh });
  return access;
}

async function getFreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface ApiRequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  retryAfterRefresh = true,
): Promise<T> {
  const { authenticated = false, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const access = authenticated ? getAccessToken() : null;
  if (access) requestHeaders.set("Authorization", `Bearer ${access}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  if (response.status === 401 && authenticated && retryAfterRefresh) {
    try {
      const freshAccess = await getFreshAccessToken();
      requestHeaders.set("Authorization", `Bearer ${freshAccess}`);
      return apiRequest<T>(
        path,
        { ...requestOptions, headers: requestHeaders, authenticated: false },
        false,
      );
    } catch {
      clearAuthTokens();
    }
  }

  const payload = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      firstErrorMessage(payload) || "خطا در ارتباط با سرور.",
      response.status,
      payload,
    );
  }

  return payload as T;
}
