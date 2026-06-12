export type StatusTone = "pass" | "watch" | "revise" | "block";

export type MetricCard = {
  label: string;
  value: string;
  status: StatusTone;
  meaning: string;
};

export type FunnelStep = {
  event: string;
  label: string;
  meaning: string;
};

export type Funnel = {
  name: string;
  purpose: string;
  steps: FunnelStep[];
};

export const sourceSummary = [
  {
    label: "GA4",
    value: "G-TV5ZMWGELB",
    note: "Production direct gtag collection is the current source of truth."
  },
  {
    label: "Google Ads",
    value: "AW-17647655841",
    note: "Observe only. Do not import conversions until GA4 events are stable."
  },
  {
    label: "GTM",
    value: "Not confirmed",
    note: "Container presence should be verified before GTM becomes the tag layer."
  },
  {
    label: "Mode",
    value: "Read-only",
    note: "This observer does not write to GA4, GTM, Ads, or FamilyFin."
  }
];

export const dailyMetrics: MetricCard[] = [
  {
    label: "Data collection health",
    value: "Watch",
    status: "watch",
    meaning: "Confirm expected events arrive and no sensitive payload is sent."
  },
  {
    label: "Assessment activation",
    value: "Smoke pass",
    status: "watch",
    meaning: "A same-day completed path proves continuity, not conversion rate."
  },
  {
    label: "Result expansion",
    value: "Needs baseline",
    status: "watch",
    meaning: "Use CTA clicks to see whether results lead to next actions."
  },
  {
    label: "Ads guardrail",
    value: "NT$500/day",
    status: "pass",
    meaning: "Budget changes require explicit approval and evidence."
  }
];

export const funnels: Funnel[] = [
  {
    name: "Assessment activation",
    purpose:
      "Find whether users start, answer, complete, see results, and continue after the result.",
    steps: [
      {
        event: "landing_view",
        label: "Assessment landing",
        meaning: "User reached an assessment entry page."
      },
      {
        event: "start_assessment",
        label: "Started",
        meaning: "Question 1 screen appeared."
      },
      {
        event: "assessment_step_answer",
        label: "Answered step",
        meaning: "User completed a question without sending answer content."
      },
      {
        event: "complete_assessment",
        label: "Completed",
        meaning: "Final step finished and result flow began."
      },
      {
        event: "view_assessment_result",
        label: "Saw result",
        meaning: "Result main area rendered successfully."
      },
      {
        event: "assessment_result_cta_click",
        label: "Clicked next action",
        meaning: "User clicked an extension CTA after the result."
      }
    ]
  },
  {
    name: "Ask Ivy activation",
    purpose: "Separate opening the AI tool from receiving a successful response.",
    steps: [
      {
        event: "ask_ivy_start",
        label: "Opened Ask Ivy",
        meaning: "Ask Ivy surface initialized."
      },
      {
        event: "ask_ivy_message_submit",
        label: "Submitted message",
        meaning: "User sent a message without exposing message text."
      },
      {
        event: "ask_ivy_message_success",
        label: "Successful response",
        meaning: "AI response completed successfully."
      }
    ]
  },
  {
    name: "Consultation conversion",
    purpose: "Measure high-intent service connection without changing Ads yet.",
    steps: [
      {
        event: "consultation_start",
        label: "Started consultation",
        meaning: "User opened or began the consultation flow."
      },
      {
        event: "consultation_submit",
        label: "Submitted consultation",
        meaning: "Form submit succeeded."
      }
    ]
  },
  {
    name: "Toolbox usage",
    purpose: "Find whether users actually complete practical tools.",
    steps: [
      {
        event: "tool_start",
        label: "Started tool",
        meaning: "A toolbox or calculator feature was opened."
      },
      {
        event: "tool_complete",
        label: "Completed tool",
        meaning: "A tool success action completed without sending personal values."
      }
    ]
  }
];

export const rollups = [
  {
    period: "Daily",
    boundary: "Asia/Taipei complete day",
    use: "Daily report and tracking health."
  },
  {
    period: "Weekly",
    boundary: "Monday-Sunday, split at January 1 for annual totals",
    use: "Find noisy drop-off and source-quality trends."
  },
  {
    period: "Monthly",
    boundary: "Calendar month",
    use: "Compare channel quality, feature adoption, and returning usage."
  },
  {
    period: "Quarterly",
    boundary: "Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec",
    use: "Guide product roadmap and campaign direction."
  },
  {
    period: "Half-year",
    boundary: "H1 Jan-Jun, H2 Jul-Dec",
    use: "Review whether tool adoption broadens across the site."
  },
  {
    period: "Annual",
    boundary: "Jan 1-Dec 31",
    use: "Evaluate full-year growth, retention, and budget discipline."
  }
];

export const decisionRules = [
  {
    signal: "Ads clicks high, starts low",
    read: "Landing intent mismatch or CTA clarity issue",
    action: "Fix landing copy, CTA hierarchy, or final URL before budget changes."
  },
  {
    signal: "Starts high, step answer low",
    read: "Product or mobile UX friction",
    action: "Inspect question layout, tap targets, progress, and wording."
  },
  {
    signal: "Result views high, CTA low",
    read: "Result page next action is weak",
    action: "Test CTA order and labels for Ask Ivy, consultation, and tools."
  },
  {
    signal: "Ask Ivy submit high, success low",
    read: "AI response, latency, or error recovery issue",
    action: "Improve loading, retry, error copy, and success feedback."
  }
];

export const approvalGates = [
  "GTM submit or publish",
  "GA4 key event changes",
  "Ads conversion import",
  "Ads budget, bid, keyword, targeting, creative, or campaign status changes",
  "Removing noindex from this observer",
  "Connecting live read-only credentials"
];
