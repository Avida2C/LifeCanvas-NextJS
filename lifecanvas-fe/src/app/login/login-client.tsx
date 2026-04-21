"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  AuthInput,
  AuthOutlineButton,
  AuthPrimaryButton,
  AuthScreen,
} from "@/components/auth/auth-ui";
import { useTheme } from "@/components/providers/theme-provider";
import { buildDemoUserSettings, DEMO_ACCOUNT, isDemoLogin } from "@/lib/demo-account";
import { DEFAULT_ACCENT } from "@/lib/theme";
import { getUserSettings, saveUserSettings } from "@/lib/storage";

function displayNameFromEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return "";
  const local = trimmed.includes("@") ? trimmed.split("@")[0] ?? trimmed : trimmed;
  return local.replace(/[.+_]/g, " ").trim() || trimmed;
}

export function LoginClient() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nextPath = searchParams.get("next") ?? "/me";

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

  const handleLogin = async () => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) return;

    const existingSettings = await getUserSettings();
    const memberSince =
      existingSettings?.memberSince ?? new Date().getFullYear().toString();

    if (isDemoLogin(e, p)) {
      await saveUserSettings(buildDemoUserSettings(existingSettings));
    } else {
      await saveUserSettings({
        name: displayNameFromEmail(e),
        nickname: undefined,
        username: undefined,
        email: e,
        darkMode: existingSettings?.darkMode ?? false,
        accentColor: existingSettings?.accentColor ?? DEFAULT_ACCENT,
        memberSince,
        timezone: existingSettings?.timezone,
      });
    }

    router.replace(nextPath);
  };

  const canSubmit = Boolean(email.trim() && password.trim());

  const forgotHref =
    searchParams.toString().length > 0
      ? `/login/forgot-password?${searchParams.toString()}`
      : "/login/forgot-password";

  const signUpHref =
    searchParams.toString().length > 0
      ? `/login/sign-up?${searchParams.toString()}`
      : "/login/sign-up";

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

        <div className="flex w-full max-w-md min-h-[200px] flex-col justify-between gap-8">
          <div className="flex w-full flex-col gap-4">
            <label className="sr-only" htmlFor="login-email">
              Email Address
            </label>
            <AuthInput
              theme={theme}
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="Email address"
              onKeyDown={(ev) => {
                if (ev.key === "Enter") void handleLogin();
              }}
            />

            <div className="flex w-full flex-col gap-2">
              <label className="sr-only" htmlFor="login-password">
                Password
              </label>
              <AuthInput
                theme={theme}
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="Password"
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") void handleLogin();
                }}
              />
              <Link
                href={forgotHref}
                className="block w-full text-right text-sm font-medium underline-offset-2 transition-opacity hover:opacity-80"
                style={{ color: theme.primary }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3">
            <AuthPrimaryButton
              theme={theme}
              type="button"
              disabled={!canSubmit}
              onClick={() => void handleLogin()}
            >
              Log in
            </AuthPrimaryButton>
            <AuthOutlineButton
              theme={theme}
              type="button"
              onClick={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
              }}
            >
              Use demo account
            </AuthOutlineButton>
            <p className="w-full text-end text-sm leading-normal">
              <span style={{ color: theme.textSecondary }}>Don&apos;t have an account? </span>
              <Link
                href={signUpHref}
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: theme.primary }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 py-1">
          <p
            className="w-full text-center text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            Or continue with
          </p>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border-2 text-base font-semibold transition-opacity hover:opacity-90"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            aria-label="Log in with Facebook (coming soon)"
          >
            <FaFacebook className="size-6 shrink-0" style={{ color: "#1877F2" }} aria-hidden />
            Log in with Facebook
          </button>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border-2 text-base font-semibold transition-opacity hover:opacity-90"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            aria-label="Log in with Google (coming soon)"
          >
            <FcGoogle className="size-6 shrink-0" aria-hidden />
            Log in with Google
          </button>
        </div>
      </div>
    </AuthScreen>
  );
}
