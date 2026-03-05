# MoatScore CI: 3-Minute Pitch

## Introduction (0:00 - 0:30)

"Good afternoon. Every day, product teams ship new features, update landing pages, and tweak onboarding flows. We use tools like Percy or Chromatic to ensure the buttons haven't moved and the colors haven't broken. That's visual regression.

But what about _strategic regression_? What happens when a marketing intern accidentally removes your SOC2 trust badges? Or an engineer ships a pricing page update that strips out your core differentiation?

Currently, nothing catches that. You just ship a weaker product.

That's why we built **MoatScore CI**.

## The Solution (0:30 - 1:30)

MoatScore CI is the first artificial intelligence CI/CD layer that audits your preview deployments for **defensibility and moat signals**.

Powered by **Gemini 3 Vision**, it doesn't just look at pixels. It captures full-page viewports and extracts structural DOM evidence. It then evaluates the strategic strength of the page across 8 defensibility vectors—things like Trust, Monetization Power, and Switching Costs.

It is entirely stateless. We don't compare against a flaky baseline. We evaluate the raw strength of what is about to be shipped.

## The Demo (1:30 - 2:30)

_(Switch to `/` dashboard)_

Watch this in action. Here is our dashboard. I'm going to run a preview deployment of a generic feature update. _(Click "Run weak demo")_

_(Show Radar Chart and Weakened Signals)_
As you can see, MoatScore immediately flags this PR. The radar chart is shrinking. Gemini detected that we lost our trust badges and our pricing metric is now generic. It outputs this strictly formatted, CI-grade report.

Now, let's run the corrected version. _(Click "Run strong demo")_

_(Show strong report)_
The difference is night and day. Gemini explicitly cites the exact DOM elements—the SOC2 compliance, the enterprise logos—as positive moat signals.

And for the engineers, it generates a perfect, markdown-formatted PR comment ready to be pasted directly into GitHub.

## Conclusion (2:30 - 3:00)

By forcing Gemini to return strict JSON, and backing every delta with hard extracted DOM evidence, we've solved the hallucination problem in AI code review.

MoatScore CI ensures that you never accidentally ship a defenseless product again. Thank you."
