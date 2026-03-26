/** 관심 ETF 한 건 (이름 포함) */
export interface InterestEtfEntryType {
  etfId: string;
  name: string;
  p: {
    buyPremiumThreshold: number;
    /** null = 텔레그램과 동일하게 매도 알림 없음 */
    sellPremiumThreshold: number | null;
  };
}
