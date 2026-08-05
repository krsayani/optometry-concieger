/**
 * Email admin about a completed OD or practice intake.
 * Failures are logged but do not block the user success flow.
 */
export async function notifyAdminOfIntake(type, data) {
  const endpoints = [
    "/api/intake-notify",
    // Absolute www fallback avoids apex→www POST redirect edge cases
    "https://www.optometryconcierge.com/api/intake-notify",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...data }),
        keepalive: true,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        lastError = result.error || response.statusText;
        console.error("[notifyAdminOfIntake]", endpoint, lastError);
        continue;
      }

      if (!result.ok) {
        lastError = "Unexpected response";
        console.error("[notifyAdminOfIntake] Unexpected response", result);
        continue;
      }

      return true;
    } catch (error) {
      lastError = error;
      console.error("[notifyAdminOfIntake]", endpoint, error);
    }
  }

  console.error("[notifyAdminOfIntake] All endpoints failed", lastError);
  return false;
}
