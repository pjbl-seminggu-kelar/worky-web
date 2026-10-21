export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"]?.replace(/\/$/, "") ?? "/api/worky";

export type ApiRequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody;
  token?: string;
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
 * Reusable Worky API client.
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

  const response = await fetch(`${API_BASE_URL}/${endpoint.replace(/^\//, "")}`, requestInit);

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
