/** 관심 ETF 한 건 (이름 포함) */
export interface InterestEtfEntryType {
  etfId: string;
  name: string;
  p: {
    buyPremiumThreshold: number;
    sellPremiumThreshold: number;
  };
}
