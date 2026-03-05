"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ThemeValue = "light" | "dark" | "system";

const THEME_ORDER: ThemeValue[] = ["system", "light", "dark"];

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme ?? "system") as ThemeValue;
  const currentIndex = THEME_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
  const nextTheme = THEME_ORDER[nextIndex];

  const handleClick = () => {
    setTheme(nextTheme);
  };

  const getIcon = () => {
    if (!mounted) {
      return <Monitor className="w-2.5 h-2.5 opacity-80" />;
    }
    if (current === "light") {
      return <Sun className="w-2.5 h-2.5 opacity-80" />;
    }
    if (current === "dark") {
      return <Moon className="w-2.5 h-2.5 opacity-80" />;
    }
    return <Monitor className="w-2.5 h-2.5 opacity-80" />;
  };

  const getLabel = (value: ThemeValue) => {
    if (value === "light") {
      return t("themeLight");
    }
    if (value === "dark") {
      return t("themeDark");
    }
    return t("themeSystem");
  };

  const buttonClass =
    "inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 shrink-0";

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t("themeToggleLabel")}
        className={`${buttonClass} cursor-default`}
      >
        <Monitor className="w-2.5 h-2.5 opacity-80" />
        <span className="sr-only">{t("themeToggleLabel")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${buttonClass} hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-[11px] font-medium`}
      aria-label={t("themeToggleLabel")}
      title={`${getLabel(current)} (${t("themeToggleClickHint")})`}
    >
      {getIcon()}
      <span className="sr-only">
        {t("themeToggleLabel")}: {getLabel(current)}
      </span>
    </button>
  );
};
