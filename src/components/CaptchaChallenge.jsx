import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function makeChallenge() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { a, b, answer: a + b };
}

/**
 * Lightweight bot check shown on intake submit steps.
 * Parent should require `verified === true` before submitting.
 */
export function CaptchaChallenge({
  onVerifiedChange,
  className,
  resetKey = 0,
}) {
  const [challenge, setChallenge] = useState(makeChallenge);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const onVerifiedChangeRef = useRef(onVerifiedChange);
  onVerifiedChangeRef.current = onVerifiedChange;

  useEffect(() => {
    setChallenge(makeChallenge());
    setValue("");
    setError("");
    setVerified(false);
    onVerifiedChangeRef.current?.(false);
  }, [resetKey]);

  const prompt = useMemo(
    () => `What is ${challenge.a} + ${challenge.b}?`,
    [challenge],
  );

  const refresh = () => {
    setChallenge(makeChallenge());
    setValue("");
    setError("");
    setVerified(false);
    onVerifiedChangeRef.current?.(false);
  };

  const handleChange = (next) => {
    const digits = next.replace(/[^\d]/g, "").slice(0, 3);
    setValue(digits);
    setError("");

    if (!digits) {
      setVerified(false);
      onVerifiedChangeRef.current?.(false);
      return;
    }

    if (Number(digits) === challenge.answer) {
      setVerified(true);
      setError("");
      onVerifiedChangeRef.current?.(true);
      return;
    }

    setVerified(false);
    onVerifiedChangeRef.current?.(false);
    if (digits.length >= String(challenge.answer).length) {
      setError("Incorrect answer. Try again or refresh the challenge.");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/30 p-5 space-y-3",
        verified && "border-success/30 bg-success/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Security check
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Confirm you are human before submitting your profile.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="shrink-0 h-8 w-8 rounded-full"
          aria-label="Refresh captcha"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intake-captcha">{prompt}</Label>
        <Input
          id="intake-captcha"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter the sum"
          className={cn(
            "max-w-[180px]",
            verified && "border-success/40 focus-visible:ring-success/30",
            error && "border-destructive",
          )}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {verified && (
          <p className="text-xs font-semibold text-success">Verified</p>
        )}
      </div>
    </div>
  );
}
