export type BBox = [number, number, number, number];

export type ExtractedElement = {
  selector: string;
  intentValue: string;
  innerText: string;
  bbox: BBox | null;
};

export type ViewportData = {
  viewport: 'mobile' | 'desktop';
  base64Image: string;
  elements: ExtractedElement[];
  domSummary: string; // New: minimal DOM context
};

export type PlaywrightResult = {
  mobile: ViewportData;
  desktop: ViewportData;
};

export type MoatVector = {
  clear_wedge: number;
  distribution_hooks: number;
  workflow_lock_in: number;
  data_flywheel: number;
  switching_costs: number;
  trust_and_risk: number;
  differentiation: number;
  monetization_power: number;
};

export type MoatDeltaItem = {
  vector: string;
  reason: string;
  evidence: string;
};

export type MoatScoreResult = {
  overall_score: number;
  vectors: MoatVector;
  moat_delta: {
    strengthened: MoatDeltaItem[];
    weakened: MoatDeltaItem[];
  };
  top_issues: string[];
  quick_wins: string[];
  recommended_experiments: {
    hypothesis: string;
    change: string;
    expected_impact: string;
    effort: "S" | "M" | "L";
  }[];
  confidence: number;
};

export type RunRecord = {
  id: string;
  url: string;
  timestamp: string;
  diffText?: string;
  status: 'running' | 'pass' | 'fail' | 'warn';
  result?: MoatScoreResult;
  mobileScreenshot?: string; // base64
  desktopScreenshot?: string; // base64
  error?: string;
};
