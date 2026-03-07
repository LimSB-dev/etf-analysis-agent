/** GitHub 이슈 목록 URL (환경변수 NEXT_PUBLIC_GITHUB_ISSUES_URL 로 설정, 미설정 시 기본값 사용) */
export const GITHUB_ISSUES_URL =
  process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL ?? "https://github.com/LimSB-dev/v0-etf-analysis-agent/issues";

/** 실시간 알람 기능 요청 이슈 페이지 (Issue #12) */
export const ALERT_REQUEST_ISSUE_URL =
  "https://github.com/LimSB-dev/v0-etf-analysis-agent/issues/12";

/** GitHub 프로필 URL (푸터 등) */
export const GITHUB_PROFILE_URL = "https://github.com/LimSB-dev";

/** 텔레그램 채널 초대 링크 (미설정 시 알람 배너에 텔레그램 버튼 미노출) */
export const TELEGRAM_CHANNEL_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL ?? "";

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
