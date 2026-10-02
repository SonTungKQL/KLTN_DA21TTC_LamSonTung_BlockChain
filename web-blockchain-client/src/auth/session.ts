export type UserRole = "ADMIN" | "STUDENT";

export interface Session {
  token: string;
  role: UserRole;
  fullName?: string;
  email?: string;
}

const sessionKey = "certificate-blockchain-session";
export const sessionExpiredEvent = "certificate-blockchain-session-expired";
export const sessionChangedEvent = "certificate-blockchain-session-changed";

export function getSession(): Session | null {
  const stored = window.localStorage.getItem(sessionKey);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Session;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function saveSession(session: Session): void {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  window.localStorage.setItem("accessToken", session.token);
  window.dispatchEvent(new Event(sessionChangedEvent));
}

export function clearSession(): void {
  window.localStorage.removeItem(sessionKey);
  window.localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event(sessionChangedEvent));
}

export function expireSession(): boolean {
  if (!getSession() && !window.localStorage.getItem("accessToken")) return false;
  clearSession();
  window.dispatchEvent(new Event(sessionExpiredEvent));
  return true;
}
