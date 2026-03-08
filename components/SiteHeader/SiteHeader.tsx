"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";
import { SignInModal } from "./SignInModal";

export const SiteHeader = () => {
  const t = useTranslations();
  const tAuth = useTranslations("auth");
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header
        className="w-full border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:px-6 lg:px-8"
        role="banner"
        aria-label={t("pageTitle")}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
              <Link
                href="/"
                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {t("pageTitle")}
              </Link>
            </h1>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label={t("headerServiceDescription")}
            >
              {t("headerServiceDescription")}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {status === "loading" ? (
              <span
                className="inline-flex h-9 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                aria-hidden
              />
            ) : session?.user ? (
              <div className="inline-flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  title={session.user.email ?? undefined}
                >
                  <User className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate max-w-[120px]">
                    {session.user.name ?? session.user.email ?? tAuth("signedIn")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  aria-label={tAuth("signOut")}
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">{tAuth("signOut")}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-haspopup="dialog"
                aria-expanded={modalOpen}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                {tAuth("signIn")}
              </button>
            )}
          </div>
        </div>
      </header>
      <SignInModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
