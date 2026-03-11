"use client";

import { useTranslations } from "next-intl";

/**
 * 마이페이지 로딩 시 노출하는 스켈레톤 UI.
 * 실제 레이아웃(헤더·리스트·하단 버튼)과 유사한 형태로 표시한다.
 */
export const MypageSkeleton = () => {
  const t = useTranslations("mypage");
  return (
    <main
      className="px-4 py-8 sm:px-6 lg:px-8"
      role="main"
      aria-busy="true"
      aria-label={t("loading")}
    >
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/30 sm:p-6">
        {/* 헤더: 제목·설명·버튼 영역 */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* 리스트 영역: 카드형 플레이스홀더 3개 */}
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30"
            >
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-5 flex justify-end">
          <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </main>
  );
};
