import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds an API request from an endpoint and JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ status: string }, { email: string }>("/auth/login", {
      method: "POST",
      body: { email: "user@worky.id" },
      token: "test-token",
    });

    expect(result).toEqual({ status: "success" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/worky/auth/login");
    expect(request.method).toBe("POST");
    expect(request.body).toBe(JSON.stringify({ email: "user@worky.id" }));
    expect(new Headers(request.headers).get("Content-Type")).toBe("application/json");
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer test-token");
  });

  it("throws an ApiError with the API message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Email sudah terdaftar" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(apiFetch("/auth/register", { method: "POST" })).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        message: "Email sudah terdaftar",
        status: 409,
      }),
    );
  });

  it.each([
    [
      "/sessions/session-1/complete",
      {
        activeDurationSeconds: 10,
        totalAttempts: 10,
        totalReps: 10,
        validReps: 8,
        invalidReps: 2,
        unassessedAttempts: 0,
        validHoldSeconds: 0,
      },
    ],
    ["/plans/rest-day/checkin", {}],
  ])("posts authenticated workout data to %s", async (endpoint, body) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch(endpoint, { method: "POST", token: "test-token", body });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`/api/worky${endpoint}`);
    expect(request.method).toBe("POST");
    expect(request.body).toBe(JSON.stringify(body));
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer test-token");
  });

  it("gets the authenticated weekly streak", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: { days: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/plans/weekly-streak", { token: "test-token" });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/worky/plans/weekly-streak");
    expect(request.method).toBeUndefined();
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer test-token");
  });
});
