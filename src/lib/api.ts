export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "") ?? "/api/worky";

const WORKY_UPSTREAM_URL = "https://api-worky.vercel.app/api/v1";

export type ApiRequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody;
  token?: string | null | undefined;
};

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null) {
    const payload = data as Record<string, unknown>;
    if (typeof payload["message"] === "string") return payload["message"];
    if (typeof payload["error"] === "string") return payload["error"];
  }

  return fallback;
}

/**
 * Resolves the URL for an API endpoint.
 * In browser, routes directly through /api/worky to eliminate CORS and localhost:5000 connection errors.
 */
export function resolveApiUrl(endpoint: string): string {
  const clean = endpoint.replace(/^\//, "");
  const envUrl = import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "");

  if (typeof window === "undefined") {
    return `${WORKY_UPSTREAM_URL}/${clean}`;
  }

  // If envUrl is empty, points to api-worky, or points to localhost:5000,
  // use the reliable same-origin proxy /api/worky directly
  if (
    !envUrl ||
    envUrl.includes("api-worky.vercel.app") ||
    envUrl.includes("localhost:5000") ||
    envUrl.includes("127.0.0.1:5000")
  ) {
    return `/api/worky/${clean}`;
  }

  return `${envUrl}/${clean}`;
}

/**
 * Reusable Worky API client with automatic fallback.
 *
 * @example
 * apiFetch<UserResponse>("/users/me", { token })
 * apiFetch<CreateResponse, CreatePayload>("/items", { method: "POST", body })
 */
export async function apiFetch<TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const { body, headers, token, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = { ...requestOptions, headers: requestHeaders };
  if (body !== undefined) {
    requestInit.body =
      isFormData || typeof body === "string" ? (body as BodyInit) : JSON.stringify(body);
  }

  const cleanEndpoint = endpoint.replace(/^\//, "");
  const primaryUrl = resolveApiUrl(cleanEndpoint);

  let response: Response;
  try {
    response = await fetch(primaryUrl, requestInit);
  } catch (networkError) {
    // If primaryUrl fails, fallback to /api/worky
    if (typeof window !== "undefined" && !primaryUrl.startsWith("/api/worky")) {
      console.warn(
        `[apiFetch] Gagal terhubung ke ${primaryUrl}. Menggunakan /api/worky/${cleanEndpoint}...`,
      );
      try {
        response = await fetch(`/api/worky/${cleanEndpoint}`, requestInit);
      } catch {
        throw networkError;
      }
    } else {
      throw networkError;
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data: unknown =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Permintaan gagal (${response.status})`),
      response.status,
      data,
    );
  }

  return data as TResponse;
}
