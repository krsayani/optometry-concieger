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

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "[notifyAdminOfIntake]",
        result.error || response.statusText,
      );
      return false;
    }

    if (!result.ok) {
      console.error("[notifyAdminOfIntake] Unexpected response", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[notifyAdminOfIntake]", error);
    return false;
  }
}
