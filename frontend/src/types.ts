export interface SupportingSource {
  title: string;
  url: string;
  publisher: string;
  publishedDate: string;
  sourceType: 'News' | 'SEC Filing' | 'Annual Report' | 'Company Website' | 'Financial Data' | 'Research Report';
  evidenceSnippet: string;
  relevanceScore: number; // 0 - 100
}

export interface FinancialData {
  revenueTrend: { year: string; amount: number }[];
  epsTrend: { year: string; eps: number }[];
  peRatio: number;
  debtToEquity: number;
  profitMargin: number;
  cashFlow: string;
  balanceSheetSummary: string;
  healthScore: number;
  keyStrengths: string[];
  keyWeaknesses: string[];
  confidence: number; // 0 - 100
  supportingSources: SupportingSource[];
}

export interface NewsData {
  recentNews: { date: string; title: string; sentiment: 'positive' | 'neutral' | 'negative'; url: string; source: string }[];
  sentimentScore: number;
  marketEvents: string[];
  regulatoryUpdates: string[];
  confidence: number; // 0 - 100
  supportingSources: SupportingSource[];
}

export interface Competitor {
  name: string;
  marketCap: string;
  peRatio: number;
  strength: string;
}

export interface IndustryData {
  competitors: Competitor[];
  industryGrowthRate: string;
  competitiveAdvantages: string[];
  marketPosition: 'Leader' | 'Challenger' | 'Niche' | 'Follower';
  confidence: number; // 0 - 100
  supportingSources: SupportingSource[];
}

export interface CompanyRisk {
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface MacroeconomicRisk {
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface RegulatoryRisk {
  risk: string;
  shift?: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface RiskData {
  companyRisks: CompanyRisk[];
  macroeconomicRisks: MacroeconomicRisk[];
  regulatoryRisks: RegulatoryRisk[];
  overallRiskScore: number;
  confidence: number; // 0 - 100
  supportingSources: SupportingSource[];
}

export interface CommitteeVote {
  invest: number;
  hold: number;
  pass: number;
}

export interface InvestmentCommitteeReport {
  companyName: string;
  ticker: string;
  websiteUrl: string;
  overallInvestmentScore: number;
  confidenceScore: number;
  recommendation: 'Invest' | 'Hold' | 'Pass';
  executiveSummary: string;
  detailedReasoning: string;
  bullCase: string[];
  bearCase: string[];
  committeeVotes: CommitteeVote;
  timeline: { date: string; event: string }[];
  supportingSources: SupportingSource[];
}

export interface VerifiedField<T> {
  value: T;
  retrievedFrom: string;
  verifiedBy: string;
}

export interface VerifiedProfile {
  companyName: VerifiedField<string>;
  officialWebsite: VerifiedField<string>;
  linkedin: VerifiedField<string>;
  investorRelations: VerifiedField<string>;
  careers: VerifiedField<string>;
  newsroom: VerifiedField<string>;
  headquarters: VerifiedField<string>;
  industry: VerifiedField<string>;
  companyType: VerifiedField<'Public' | 'Private' | 'Unknown'>;
  description: VerifiedField<string>;
  confidence: number;
}

export interface FullAnalysisReport {
  timestamp: string;
  companyName: string;
  verifiedProfile: VerifiedProfile;
  financials: FinancialData;
  news: NewsData;
  industry: IndustryData;
  risk: RiskData;
  committee: InvestmentCommitteeReport;
}


export interface ProgressState {
  step: string;
  message: string;
}
