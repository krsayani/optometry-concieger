/**
 * Email the submitter a link to create their account password.
 * Failures are logged but do not block the profile success flow.
 */
export async function sendAccountInvite({ email, name, type }) {
  try {
    const response = await fetch("/api/account-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        type,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      }),
      keepalive: true,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      console.error(
        "[sendAccountInvite]",
        result.error || response.statusText,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[sendAccountInvite]", error);
    return false;
  }
}

export const PENDING_INTAKE_KEY = "oc_pending_intake";

export function storePendingIntake(type, data) {
  try {
    sessionStorage.setItem(
      PENDING_INTAKE_KEY,
      JSON.stringify({ type, data, savedAt: Date.now() }),
    );
  } catch (error) {
    console.error("[storePendingIntake]", error);
  }
}

export function readPendingIntake() {
  try {
    const raw = sessionStorage.getItem(PENDING_INTAKE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingIntake() {
  try {
    sessionStorage.removeItem(PENDING_INTAKE_KEY);
  } catch {
    // ignore
  }
}
