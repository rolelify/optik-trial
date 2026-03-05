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
  primaryBBox: BBox | null;
};

export type PlaywrightResult = {
  mobile: ViewportData;
  desktop: ViewportData;
};

export type GeminiFailureType = 'occluded' | 'offscreen' | 'clipped' | 'unreadable' | 'unknown' | null;

export type GeminiVerdict = {
  pass: boolean;
  viewport: 'mobile' | 'desktop';
  intent_target: string | null;
  failure_type: GeminiFailureType;
  issue_detected: string | null;
  evidence: { selector: string; bbox: BBox }[];
  suggested_patch: string | null;
  confidence: number;
};

export type RunRecord = {
  id: string;
  url: string;
  timestamp: string;
  diffText?: string;
  intentMode: boolean;
  status: 'running' | 'pass' | 'fail' | 'warn';
  mobileResult?: GeminiVerdict;
  desktopResult?: GeminiVerdict;
  error?: string;
};
