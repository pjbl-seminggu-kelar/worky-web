import { beforeEach, describe, expect, it } from "vitest";

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ONBOARDING_COMPLETED_KEY,
  buildLast7DaysFormQuality,
  buildProfileUpdatePayload,
  clearAuthSession,
  formatEquipmentLabels,
  mapUserToOnboardingState,
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

describe("mapUserToOnboardingState", () => {
  it("maps backend profile slugs and numbers back to onboarding UI state", () => {
    const mapped = mapUserToOnboardingState({
      id: "user-1",
      email: "user@worky.id",
      displayName: "Aryo",
      age: 23,
      weightKg: 65,
      goal: "MUSCLE_BUILDING",
      experienceLevel: "INTERMEDIATE",
      equipment: ["exercise_mat", "chair", "pull_up_bar"],
      sessionsPerWeek: 6,
      sessionDurationMinutes: 45,
      reminderTime: "07:00",
    });

    expect(mapped.age).toBe("23");
    expect(mapped.weight).toBe("65");
    expect(mapped.reminderTime).toBe("07:00");
    expect(mapped.displayName).toBe("Aryo");
    expect(mapped.picked).toEqual({
      1: ["Membangun otot & membentuk tubuh"],
      2: ["Menengah (Intermediate)"],
      3: ["Matras", "Kursi / bangku", "Pull-up bar"],
      4: ["5+ sesi"],
      5: ["45 menit"],
    });
  });

  it("handles missing fields and 'none' equipment slug safely", () => {
    const mapped = mapUserToOnboardingState({
      id: "user-2",
      email: "new@worky.id",
      displayName: "",
      equipment: ["none"],
    });

    expect(mapped.age).toBe("");
    expect(mapped.weight).toBe("");
    expect(mapped.reminderTime).toBeNull();
    expect(mapped.picked).toEqual({
      3: ["Tanpa alat"],
    });
  });
});

describe("buildProfileUpdatePayload", () => {
  it("omits displayName shorter than 2 chars and preserves existing reminderTime", () => {
    const payload = buildProfileUpdatePayload({
      displayName: " ",
      age: 24,
      weightKg: 68,
      goal: "STRENGTH",
      experienceLevel: "BEGINNER",
      sessionsPerWeek: 3,
      sessionDurationMinutes: 30,
      equipment: ["Matras"],
      reminderTime: "06:30",
    });

    expect("displayName" in payload).toBe(false);
    expect(payload.reminderTime).toBe("06:30");
  });

  it("includes trimmed displayName >= 2 chars and falls back reminderTime to 18:30", () => {
    const payload = buildProfileUpdatePayload({
      displayName: "  Budi  ",
      age: 24,
      weightKg: 68,
      goal: "GENERAL_FITNESS",
      experienceLevel: "BEGINNER",
      sessionsPerWeek: 4,
      sessionDurationMinutes: 20,
      equipment: ["Tanpa alat"],
      reminderTime: null,
    });

    expect(payload.displayName).toBe("Budi");
    expect(payload.reminderTime).toBe("18:30");
  });
});

describe("formatEquipmentLabels", () => {
  it("formats backend equipment slugs into readable Indonesian labels", () => {
    expect(formatEquipmentLabels(["exercise_mat", "chair", "pull_up_bar"])).toBe(
      "Matras, Kursi / bangku, Pull-up bar",
    );
    expect(formatEquipmentLabels(["none"])).toBe("Tanpa alat");
    expect(formatEquipmentLabels([])).toBe("Tanpa alat");
    expect(formatEquipmentLabels(undefined)).toBe("Tanpa alat");
  });
});
