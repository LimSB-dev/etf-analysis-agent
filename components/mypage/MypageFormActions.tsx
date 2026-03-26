"use client";

import { useTranslations } from "next-intl";

export interface MypageFormActionsPropsType {
  isEditing: boolean;
  /** ETF 목록 외(예: 증권사 딥링크)만 바뀐 경우에도 저장·취소를 노출 */
  hasUnsavedChanges: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  saving: boolean;
  message: "saved" | "error" | null;
}

export const MypageFormActions = ({
  isEditing,
  hasUnsavedChanges,
  onStartEditing,
  onCancelEditing,
  saving,
  message,
}: MypageFormActionsPropsType) => {
  const t = useTranslations("mypage");
  const showSaveRow = isEditing || hasUnsavedChanges;

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      {message === "saved" && (
        <p
          className="text-sm text-green-600 dark:text-green-400"
          role="status"
          aria-live="polite"
        >
          {t("saved")}
        </p>
      )}
      {message === "error" && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {t("saveFailed")}
        </p>
      )}
      {showSaveRow ? (
        <div className="flex w-full gap-2 sm:w-auto sm:flex-initial">
          <button
            type="button"
            onClick={onCancelEditing}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:flex-initial"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 sm:flex-initial"
          >
            {t("save")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStartEditing}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto"
        >
          {t("edit")}
        </button>
      )}
    </div>
  );
};
