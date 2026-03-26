/**
 * 사이트 절대 URL (메타데이터·OG 이미지·텔레그램 링크 등)
 *
 * 목표: "항상 고정 도메인(프로덕션)"을 기본으로 쓰고,
 * 프리뷰/임시 Vercel 도메인(VERCEL_URL)은 마지막 폴백으로만 사용한다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "production"
      ? "https://etf-analysis-agent.vercel.app"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

/** GitHub 이슈 목록 URL (환경변수 NEXT_PUBLIC_GITHUB_ISSUES_URL 로 설정, 미설정 시 기본값 사용). 기능 요청 시 이슈 현황으로 연결 */
export const GITHUB_ISSUES_URL =
  process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL ??
  "https://github.com/LimSB-dev/etf-analysis-agent/issues";

/** GitHub 프로필 URL (푸터 등) */
export const GITHUB_PROFILE_URL = "https://github.com/LimSB-dev";

/** 텔레그램 채널 초대 링크 (미설정 시 저장소 README로 연결) */
const _REPO_URL = "https://github.com/LimSB-dev/etf-analysis-agent";
export const TELEGRAM_CHANNEL_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL?.trim() || _REPO_URL;

/** Canary Lab (블로그) URL */
export const CANARY_LAB_URL = "https://canary-lab.vercel.app/";

/** 푸터 라벨: Canary Lab */
export const CANARY_LAB_LABEL = "Canary Lab";

/** 문의 메일 (환경변수 NEXT_PUBLIC_CONTACT_EMAIL 로 설정) */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "mae03087@naver.com";

/** 알람 신청용 mailto (subject, body 한 줄로 정리 후 인코딩) */
export function getAlertRequestMailto(subject: string, body: string): string {
  const oneLineBody = body.replace(/\s+/g, " ").trim();
  const q = new URLSearchParams();
  q.set("subject", subject);
  q.set("body", oneLineBody);
  return `mailto:${CONTACT_EMAIL}?${q.toString()}`;
}
