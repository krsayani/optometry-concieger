/**
 * Supabase auth email sending is easily throttled during repeated signups.
 * Detect those errors so intake forms can still succeed via admin notification.
 */
export function isAuthThrottled(error) {
  if (!error) return false;

  const message = String(error.message || error.error_description || "").toLowerCase();
  const code = String(error.code || error.status || "").toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("over_email") ||
    message.includes("email rate") ||
    message.includes("too many") ||
    message.includes("security purposes") ||
    message.includes("for security purposes") ||
    code.includes("over_email") ||
    code === "429" ||
    error.status === 429
  );
}

export function isExistingAccountError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("already registered") ||
    message.includes("email already in use") ||
    message.includes("user already exists") ||
    message.includes("unique constraint")
  );
}
