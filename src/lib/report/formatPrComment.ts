import { RunRecord } from '../types';

export function formatPrComment(run: RunRecord): string {
  const result = run.result;
  if (!result) return 'No result available.';
  
  const pass = result.overall_score >= 70;
  
  let markdown = `# MoatScore CI Report\n\n`;
  
  markdown += `**Preview URL:** [${run.url}](${run.url})\n\n`;
  
  markdown += `## Overall Score: **${result.overall_score}/100** ${pass ? '✅' : '⚠️'}\n\n`;

  markdown += `### Defensibility Vectors\n`;
  markdown += `| Vector | Score |\n`;
  markdown += `|---|---|\n`;
  Object.entries(result.vectors).forEach(([key, val]) => {
    markdown += `| \`${key}\` | ${val}/100 |\n`;
  });
  markdown += `\n`;

  if (result.moat_delta.strengthened.length > 0) {
    markdown += `### 🟢 Strengthened Moat Signals\n`;
    result.moat_delta.strengthened.forEach(item => {
      markdown += `- **[${item.vector}]** ${item.reason}\n  *Evidence:* \`${item.evidence}\`\n`;
    });
    markdown += `\n`;
  }

  if (result.moat_delta.weakened.length > 0) {
    markdown += `### 🔴 Weakened / Missing Moat Signals\n`;
    result.moat_delta.weakened.forEach(item => {
      markdown += `- **[${item.vector}]** ${item.reason}\n  *Evidence:* \`${item.evidence}\`\n`;
    });
    markdown += `\n`;
  }

  if (result.recommended_experiments.length > 0) {
    markdown += `### 🧪 Recommended Growth Experiments\n`;
    result.recommended_experiments.forEach((exp, idx) => {
      markdown += `**${idx + 1}. ${exp.hypothesis}**\n`;
      markdown += `- **Change:** ${exp.change}\n`;
      markdown += `- **Impact:** ${exp.expected_impact} (Effort: ${exp.effort})\n\n`;
    });
  }

  return markdown;
}
