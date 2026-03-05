/** GitHub 이슈 목록 URL (환경변수 NEXT_PUBLIC_GITHUB_ISSUES_URL 로 설정, 미설정 시 기본값 사용) */
export const GITHUB_ISSUES_URL =
  process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL ?? "https://github.com/LimSB-dev/v0-etf-analysis-agent/issues";

/** 문의 메일 (환경변수 NEXT_PUBLIC_CONTACT_EMAIL 로 설정) */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "mae03087@naver.com";

/** 알람 신청용 GitHub 새 이슈 URL (title, body 인코딩) */
export function getAlertRequestIssueUrl(title: string, body: string): string {
  const base = GITHUB_ISSUES_URL.replace(/\/issues\/?$/, "");
  const q = new URLSearchParams();
  q.set("title", title);
  q.set("body", body);
  return `${base}/issues/new?${q.toString()}`;
}

/** 알람 신청용 mailto (subject, body 한 줄로 정리 후 인코딩) */
export function getAlertRequestMailto(subject: string, body: string): string {
  const oneLineBody = body.replace(/\s+/g, " ").trim();
  const q = new URLSearchParams();
  q.set("subject", subject);
  q.set("body", oneLineBody);
  return `mailto:${CONTACT_EMAIL}?${q.toString()}`;
}
