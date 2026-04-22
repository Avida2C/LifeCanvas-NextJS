"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthInput,
  AuthPrimaryButton,
  AuthScreen,
} from "@/components/auth/auth-ui";
import { useTheme } from "@/components/providers/theme-provider";
import { getUserSettings } from "@/lib/storage";

/** Client-side placeholder reset flow (UI-only in current build). */
export function ForgotPasswordClient() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nextPath = searchParams.get("next") ?? "/me";
  const loginHref =
    searchParams.toString().length > 0
      ? `/login?${searchParams.toString()}`
      : "/login";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getUserSettings();
      if (cancelled) return;
      // Signed-in users do not need password reset entry screen.
      if (settings?.name) {
        router.replace(nextPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <AuthScreen theme={theme}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <p
            className="font-brand w-full text-center text-[96px] leading-none"
            style={{ color: theme.primary }}
          >
            LifeCanvas
          </p>
          <h1
            className="w-full text-center text-xl font-semibold leading-snug"
            style={{ color: theme.text }}
          >
            Forgot password?
          </h1>
          <p
            className="w-full text-center text-base leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            Don&apos;t worry, it happens to the best of us.
          </p>
          <p className="w-full text-left text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
            Enter the email address associated with your account, and we&apos;ll send you a link
            to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="sr-only" htmlFor="forgot-username">
            Username
          </label>
          <AuthInput
            theme={theme}
            id="forgot-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(ev) => {
              setUsername(ev.target.value);
              setSubmitted(false);
            }}
            placeholder="Username"
          />
          <label className="sr-only" htmlFor="forgot-email">
            Email address
          </label>
          <AuthInput
            theme={theme}
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              setSubmitted(false);
            }}
            placeholder="Email address"
          />
          <AuthPrimaryButton theme={theme} type="submit" disabled={!email.trim()}>
            Send reset instructions
          </AuthPrimaryButton>
        </form>

        {submitted ? (
          <p
            className="rounded-2xl border-2 p-3 text-center text-sm leading-relaxed"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.card,
              color: theme.text,
            }}
            role="status"
          >
            A password reset link has been sent to{" "}
            <strong className="break-all">{email.trim()}</strong>. Check your inbox and spam
            folder, then follow the link to choose a new password. If you don&apos;t see it
            within a few minutes, try sending again.
          </p>
        ) : null}

        <Link
          href={loginHref}
          className="text-center text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: theme.primary }}
        >
          Return to log in
        </Link>
      </div>
    </AuthScreen>
  );
}
