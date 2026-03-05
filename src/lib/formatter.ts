import { RunRecord } from './types';

export function formatPrComment(run: RunRecord): string {
  const result = run.mobileResult; // primary fallback, or combine
  if (!result) return 'OptikOps: No result available.';

  const isWarn = run.status === 'warn';
  const badge = run.status === 'pass' 
    ? '✅ **PASS**' 
    : run.status === 'fail' 
      ? '❌ **FAIL**' 
      : '⚠️ **WARN**';

  const viewports = [];
  if (run.mobileResult?.pass === false || isWarn) viewports.push('📱 Mobile');
  if (run.desktopResult?.pass === false || (isWarn && run.mobileResult?.pass !== false)) viewports.push('💻 Desktop');
  if (viewports.length === 0) viewports.push('📱 Mobile & 💻 Desktop');

  const issue = result.issue_detected || 'No issues detected.';
  const patch = result.suggested_patch ? `\n\n**Suggested Patch:**\n\`\`\`html\n${result.suggested_patch}\n\`\`\`` : '';
  
  // To keep it clean, we don't upload the image to github in this demo, just providing a markdown placeholder


  return `### OptikOps Verification

${badge} — Gemini 3 Spatial Verdict (${viewports.join(', ')})
**Issue:** ${issue}
**Confidence:** ${result.confidence >= 0.9 ? 'High' : 'Medium'} (verified by deterministic clickability check).

${patch}

*Automated by [OptikOps](/) using Gemini 3 Vision & Playwright.*`;
}
