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
  };
};

export function saveAuthSession(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
