export const ONBOARDING_COMPLETED_KEY = "worky:onboarding-completed";
export const AUTH_TOKEN_KEY = "worky:auth-token";
export const AUTH_USER_KEY = "worky:auth-user";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  experienceLevel?: string;
  age?: number;
  weightKg?: number;
  goal?: string;
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
  equipment?: string[];
  reminderTime?: string;
  streakWeeks?: number;
  createdAt?: string;
  hasActivePlan?: boolean;
  hasCompletedOnboarding?: boolean;
};

export type WeeklyFormQuality = {
  weekLabel: string;
  formRate: number;
};

export type UserStats = {
  totalSessions: number;
  totalValidReps: number;
  avgFormRate: number;
  weeklyFormQuality: WeeklyFormQuality[];
};

export type ProfileResponse = {
  status: "success";
  data: {
    user: AuthUser;
    stats: UserStats;
  };
};

export type SessionFormHistory = {
  startedAt: string;
  totalReps: number;
  validReps: number;
};

export function buildLast7DaysFormQuality(sessions: SessionFormHistory[], today = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      dayLabel: new Intl.DateTimeFormat("id-ID", { weekday: "short" })
        .format(date)
        .replaceAll(".", ""),
      totalReps: 0,
      validReps: 0,
    };
  });

  const daysByDate = new Map(days.map((day) => [day.dateKey, day]));
  for (const session of sessions) {
    const date = new Date(session.startedAt);
    if (Number.isNaN(date.getTime())) continue;

    const day = daysByDate.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    if (!day) continue;

    day.totalReps += Math.max(0, session.totalReps);
    day.validReps += Math.max(0, session.validReps);
  }

  return days.map(({ dayLabel, totalReps, validReps }) => ({
    dayLabel,
    formRate: totalReps > 0 ? Math.min(100, Math.round((validReps / totalReps) * 100)) : 0,
  }));
}

export type AuthResponse = {
  status: "success";
  data: {
    user: AuthUser;
    token: string;
    hasActivePlan?: boolean;
    hasCompletedOnboarding?: boolean;
  };
};

const REVERSE_GOAL_MAP: Record<string, string> = {
  WEIGHT_LOSS: "Menurunkan berat badan",
  MUSCLE_BUILDING: "Membangun otot & membentuk tubuh",
  STRENGTH: "Meningkatkan kekuatan",
  GENERAL_FITNESS: "Menjaga kebugaran",
};

const REVERSE_LEVEL_MAP: Record<string, string> = {
  BEGINNER: "Pemula (Beginner)",
  INTERMEDIATE: "Menengah (Intermediate)",
  ADVANCED: "Lanjutan (Advanced)",
};

const EQUIPMENT_SLUG_TO_LABEL: Record<string, string> = {
  none: "Tanpa alat",
  no_equipment: "Tanpa alat",
  tanpa_alat: "Tanpa alat",
  "tanpa alat": "Tanpa alat",
  exercise_mat: "Matras",
  mat: "Matras",
  matras: "Matras",
  pull_up_bar: "Pull-up bar",
  "pull-up-bar": "Pull-up bar",
  "pull-up bar": "Pull-up bar",
  chair: "Kursi / bangku",
  bench: "Kursi / bangku",
  kursi: "Kursi / bangku",
  "kursi / bangku": "Kursi / bangku",
};

const REVERSE_DURATION_MAP: Record<number, string> = {
  15: "15 menit",
  20: "20 menit",
  30: "30 menit",
  45: "45 menit",
  60: "60 menit",
};

export function mapUserToOnboardingState(user: AuthUser) {
  const picked: Record<number, string[]> = {};

  if (user.goal && REVERSE_GOAL_MAP[user.goal]) {
    picked[1] = [REVERSE_GOAL_MAP[user.goal]!];
  }
  if (user.experienceLevel && REVERSE_LEVEL_MAP[user.experienceLevel]) {
    picked[2] = [REVERSE_LEVEL_MAP[user.experienceLevel]!];
  }
  if (user.equipment && user.equipment.length > 0) {
    const labels = Array.from(
      new Set(
        user.equipment
          .map((item) => EQUIPMENT_SLUG_TO_LABEL[item.trim().toLowerCase()])
          .filter((label): label is string => Boolean(label)),
      ),
    );
    if (labels.length > 0) {
      picked[3] = labels;
    }
  }
  if (user.sessionsPerWeek != null && user.sessionsPerWeek >= 2) {
    picked[4] = user.sessionsPerWeek >= 5 ? ["5+ sesi"] : [`${user.sessionsPerWeek} sesi`];
  }
  if (user.sessionDurationMinutes != null && REVERSE_DURATION_MAP[user.sessionDurationMinutes]) {
    picked[5] = [REVERSE_DURATION_MAP[user.sessionDurationMinutes]!];
  }

  return {
    age: user.age != null && user.age > 0 ? String(user.age) : "",
    weight: user.weightKg != null && user.weightKg > 0 ? String(user.weightKg) : "",
    picked,
    displayName: user.displayName ?? "",
    reminderTime: user.reminderTime ?? null,
  };
}

export type ProfileUpdatePayload = {
  displayName?: string;
  age: number;
  weightKg: number;
  goal: string;
  experienceLevel: string;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  reminderTime: string;
};

export function buildProfileUpdatePayload(input: {
  displayName?: string;
  age: number;
  weightKg: number;
  goal: string;
  experienceLevel: string;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  equipment: string[];
  reminderTime?: string | null;
}): ProfileUpdatePayload {
  const trimmedName = input.displayName?.trim() ?? "";
  return {
    ...(trimmedName.length >= 2 ? { displayName: trimmedName } : {}),
    age: input.age,
    weightKg: input.weightKg,
    goal: input.goal,
    experienceLevel: input.experienceLevel,
    sessionsPerWeek: input.sessionsPerWeek,
    sessionDurationMinutes: input.sessionDurationMinutes,
    equipment: input.equipment,
    reminderTime: input.reminderTime?.trim() || "18:30",
  };
}

export function saveAuthSession(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
