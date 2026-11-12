import { beforeEach, describe, expect, it } from "vitest";

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ONBOARDING_COMPLETED_KEY,
  buildLast7DaysFormQuality,
  clearAuthSession,
} from "@/lib/auth";

describe("clearAuthSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes account credentials without resetting onboarding preferences", () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "token");
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: "user-1" }));
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");

    clearAuthSession();

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe("true");
  });
});

describe("buildLast7DaysFormQuality", () => {
  it("groups session form rates into the last seven calendar days", () => {
    const today = new Date(2026, 10, 12, 12);
    const yesterday = new Date(2026, 10, 11, 10).toISOString();
    const result = buildLast7DaysFormQuality(
      [
        { startedAt: yesterday, totalReps: 40, validReps: 30 },
        { startedAt: yesterday, totalReps: 20, validReps: 15 },
        { startedAt: new Date(2026, 10, 12, 9).toISOString(), totalReps: 10, validReps: 9 },
      ],
      today,
    );

    expect(result).toHaveLength(7);
    expect(result.map(({ formRate }) => formRate)).toEqual([0, 0, 0, 0, 0, 75, 90]);
    expect(result.at(-1)?.dayLabel).toBe(
      new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(today).replaceAll(".", ""),
    );
  });
});
