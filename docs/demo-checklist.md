# MoatScore CI: Demo Checklist

Ensure all items are checked before the final hackathon presentation.

## Preparation

- [ ] Ensure `.env` has a valid `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3-flash-preview` is set.
- [ ] Run `npm install` and `npx playwright install`.
- [ ] Start the development server: `npm run dev`.

## The Demo Flow (Under 2 Minutes)

1. **The Hook**
   - Open `http://localhost:3000`.
   - Introduce the problem: "Visual regression catches pixel changes, but not strategic degradation. We built MoatScore CI to prevent your team from shipping defenseless features."

2. **The "Weak" Variant**
   - Click **"Run weak demo"**.
   - Show the resulting Radar Chart. Point out the low scores in Trust and Differentiation.
   - Highlight the Moat Signals (Weakened): Note the lack of SOC2 badges and generic pricing.

3. **The "Strong" Variant**
   - Head back to the dashboard or directly click **"Run strong demo"**.
   - Show the dramatically improved Radar Chart.
   - Highlight the Moat Signals (Strengthened): Show how Gemini picked up the SOC2 badges ("DOM:" evidence) and clear value metrics.

4. **The Engineering Action**
   - Scroll down to the Experimental Hypotheses to show actionable product advice.
   - Click the **"Copy PR Comment"** button.
   - Paste the result into a markdown viewer (or GitHub PR preview) to show the automated CI report format.

## Key Talking Points

- **Strict JSON**: Gemini 3 is forced to output a strict report schema, making it CI-ready.
- **Evidence-Linked**: Every finding is backed by text extracted directly from the DOM, preventing hallucinations.
- **Stateless Analysis**: It evaluates what is _actually_ there, meaning no flaky baseline image comparisons.
