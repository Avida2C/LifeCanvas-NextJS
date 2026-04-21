"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AuthInput,
  AuthPrimaryButton,
  AuthScreen,
} from "@/components/auth/auth-ui";
import {
  LegalModal,
  type LegalModalKind,
} from "@/components/legal/legal-modal";
import { useTheme } from "@/components/providers/theme-provider";
import { DEFAULT_ACCENT } from "@/lib/theme";
import { getUserSettings, saveUserSettings } from "@/lib/storage";

export function SignUpClient() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [legalModal, setLegalModal] = useState<LegalModalKind | null>(null);

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
      if (settings?.name) {
        router.replace(nextPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  const showPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit = Boolean(
    username.trim() &&
      nickname.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const existingSettings = await getUserSettings();
    const nick = nickname.trim();
    const memberSince =
      existingSettings?.memberSince ?? new Date().getFullYear().toString();

    await saveUserSettings({
      name: nick,
      nickname: nick,
      username: username.trim(),
      email: email.trim(),
      darkMode: existingSettings?.darkMode ?? false,
      accentColor: existingSettings?.accentColor ?? DEFAULT_ACCENT,
      memberSince,
      timezone: existingSettings?.timezone,
    });

    router.replace(nextPath);
  };

  return (
    <AuthScreen theme={theme}>
      <div className="flex w-full flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-6">
        <div className="flex w-full flex-col items-center gap-2">
          <p
            className="w-full text-center text-xl font-semibold leading-snug"
            style={{ color: theme.textSecondary }}
          >
            Welcome to
          </p>
          <p
            className="font-brand w-full text-center text-[96px] leading-none"
            style={{ color: theme.primary }}
          >
            LifeCanvas
          </p>
          <p
            className="w-full max-w-md text-center text-base leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            Create an account to gain access.
          </p>
        </div>

        <form
          onSubmit={(ev) => void handleSubmit(ev)}
          className="flex w-full max-w-md flex-col gap-4"
        >
          <h1 className="sr-only">Sign up</h1>

          <label className="sr-only" htmlFor="signup-username">
            Username
          </label>
          <AuthInput
            theme={theme}
            id="signup-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            placeholder="Username"
          />

          <div className="flex flex-col gap-1">
            <p
              id="signup-nickname-hint"
              className="text-left text-xs leading-snug"
              style={{ color: theme.textSecondary }}
            >
              This can be changed through the app.
            </p>
            <label className="sr-only" htmlFor="signup-nickname">
              Nickname
            </label>
            <AuthInput
              theme={theme}
              id="signup-nickname"
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(ev) => setNickname(ev.target.value)}
              placeholder="Nickname"
              aria-describedby="signup-nickname-hint"
            />
          </div>

          <label className="sr-only" htmlFor="signup-email">
            Email Address
          </label>
          <AuthInput
            theme={theme}
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="Email address"
          />

          <div className="flex flex-col gap-2">
            <label className="sr-only" htmlFor="signup-password">
              Password
            </label>
            <AuthInput
              theme={theme}
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="Password"
            />
            <label className="sr-only" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <AuthInput
              theme={theme}
              id="signup-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              placeholder="Confirm password"
            />
            {showPasswordMismatch ? (
              <p className="text-center text-sm font-medium" style={{ color: theme.error }} role="alert">
                Passwords must match.
              </p>
            ) : null}
          </div>

          <p className="text-left text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            By tapping Sign Up, you agree to our{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              style={{ color: theme.primary }}
              onClick={() => setLegalModal("terms")}
            >
              Terms and Conditions
            </button>{" "}
            and that you have read our{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              style={{ color: theme.primary }}
              onClick={() => setLegalModal("privacy")}
            >
              Privacy Policy
            </button>
            .
          </p>

          <AuthPrimaryButton theme={theme} type="submit" disabled={!canSubmit}>
            Sign up
          </AuthPrimaryButton>

          <p className="w-full text-right text-sm leading-normal">
            <span style={{ color: theme.textSecondary }}>Already have an account? </span>
            <Link
              href={loginHref}
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: theme.primary }}
            >
              Log in
            </Link>
          </p>
        </form>
      </div>

      <LegalModal
        open={legalModal !== null}
        kind={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </AuthScreen>
  );
}
