/**
 * Email admin about a completed OD or practice intake.
 * Failures are logged but do not block the user success flow.
 */
export async function notifyAdminOfIntake(type, data) {
  try {
    const response = await fetch("/api/intake-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...data }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error("[notifyAdminOfIntake]", result.error || response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[notifyAdminOfIntake]", error);
    return false;
  }
}
