export type StatusTone = "pass" | "watch" | "revise" | "block";

export type SourceCard = {
  title: string;
  state: string;
  tone: StatusTone;
  plainMeaning: string;
  technicalName: string;
  detail: string;
};

export type MetricCard = {
  title: string;
  state: string;
  tone: StatusTone;
  question: string;
  meaning: string;
};

export type ProgressItem = {
  label: string;
  value: number;
  tone: StatusTone;
  note: string;
};

export type FunnelStep = {
  code: string;
  label: string;
  question: string;
  meaning: string;
};

export type Funnel = {
  name: string;
  plainName: string;
  purpose: string;
  steps: FunnelStep[];
};

export type RollupItem = {
  period: string;
  boundary: string;
  question: string;
};

export type DecisionRule = {
  signal: string;
  likelyReason: string;
  firstMove: string;
};

export type GlossaryItem = {
  term: string;
  plain: string;
  example: string;
};

export type DailyReportSection = {
  title: string;
  tone: StatusTone;
  summary: string;
  points: string[];
};

export type DailyReportIndicator = {
  label: string;
  value: number;
  tone: StatusTone;
  meaning: string;
};

export type MailAutomationRule = {
  title: string;
  rule: string;
  output: string;
};

export const statusLabels: Record<StatusTone, string> = {
  pass: "正常",
  watch: "觀察中",
  revise: "需要修正",
  block: "阻塞"
};

export const sourceSummary: SourceCard[] = [
  {
    title: "網站行為收集",
    state: "正式站有送資料",
    tone: "pass",
    plainMeaning: "網站有人進來、點擊、完成檢測時，可以送到 GA4 做統計。",
    technicalName: "GA4 代碼：G-TV5ZMWGELB",
    detail: "目前正式站是直接送到 GA4，還不是用 GTM 容器統一管理。"
  },
  {
    title: "廣告觀察",
    state: "只看資料，不調整",
    tone: "watch",
    plainMeaning: "可以日後比較廣告來的人有沒有真的開始使用工具。",
    technicalName: "Ads 代碼：AW-17647655841",
    detail: "尚未把 GA4 事件匯入 Ads 當轉換，避免測試資料影響廣告。"
  },
  {
    title: "GTM 統一管理",
    state: "正式站尚未確認",
    tone: "watch",
    plainMeaning: "GTM 像是標籤總開關，未來可不用改網站程式也能調整追蹤。",
    technicalName: "GTM 容器：尚未在正式站看到",
    detail: "下一批應先讓測試站和正式站分流，再決定正式發布。"
  },
  {
    title: "偵查台安全性",
    state: "只讀模式",
    tone: "pass",
    plainMeaning: "這個儀表板只顯示與整理，不會改 GA4、GTM、Ads 或網站。",
    technicalName: "模式：read-only observer",
    detail: "repo 不保存任何密鑰；正式只讀憑證需透過 Vercel 環境變數提供。"
  }
];

export const dailyMetrics: MetricCard[] = [
  {
    title: "有沒有收到資料",
    state: "觀察中",
    tone: "watch",
    question: "網站事件有沒有穩定送到 GA4？",
    meaning: "先確認資料有進來，才有資格談成效。"
  },
  {
    title: "使用者有沒有開始",
    state: "已有 smoke 驗證",
    tone: "watch",
    question: "進站的人是否真的開始檢測或使用工具？",
    meaning: "這能判斷首頁、廣告頁、CTA 是否讓人願意動手。"
  },
  {
    title: "使用者卡在哪裡",
    state: "等累積基準",
    tone: "watch",
    question: "是還沒開始、作答中離開，還是看完結果後離開？",
    meaning: "這能決定要修文案、流程、手機版，還是調整廣告。"
  },
  {
    title: "廣告預算守門",
    state: "每日上限 NT$500",
    tone: "pass",
    question: "廣告調整是否有數據依據？",
    meaning: "沒有穩定轉換資料前，不應該增加預算或匯入轉換。"
  }
];

export const readinessProgress: ProgressItem[] = [
  {
    label: "網站已放事件",
    value: 85,
    tone: "pass",
    note: "正式站已可送多個 GA4 行為事件。"
  },
  {
    label: "GA4 可看漏斗",
    value: 70,
    tone: "pass",
    note: "已建立第一個檢測漏斗，仍需累積 7-14 天。"
  },
  {
    label: "GTM 統一管理",
    value: 35,
    tone: "watch",
    note: "正式站尚未確認 GTM 容器，下一批要處理。"
  },
  {
    label: "日報自動取數",
    value: 20,
    tone: "watch",
    note: "目前尚未接 GA4 Data API，只是報表骨架。"
  }
];

export const dailyReportQuestions = [
  "今天網站有沒有正常收資料？",
  "最多人在哪個流程停下來？",
  "完成檢測後，有沒有人去點 Ask Ivy、諮詢或工具？",
  "廣告流量是不是帶來真正使用，而不只是點擊？",
  "今天應該修產品流程、調文案，還是先不要動？"
];

export const dailyReportMeta = {
  title: "今日每日報告",
  status: "偵查台狀態報告",
  period: "每日 00:00-23:59（Asia/Taipei）",
  conclusion:
    "目前最重要的不是調整廣告，而是確認正式站事件穩定入帳，並讓 GA4/Ads 變成 Email 報表建議的校準來源。",
  caveat:
    "尚未接入 GA4 / Ads 只讀 API，所以這份日報先呈現偵查台狀態、應檢查項目與決策規則；接上 API 後才會替換成真實成效數字。"
};

export const dailyReportIndicators: DailyReportIndicator[] = [
  {
    label: "網站事件基礎",
    value: 85,
    tone: "pass",
    meaning: "正式站已可送出多個行為事件，足以開始做入帳觀察。"
  },
  {
    label: "GA4 漏斗可讀性",
    value: 70,
    tone: "pass",
    meaning: "已具備檢測、工具、諮詢等漏斗的事件基礎，仍需累積正式站樣本。"
  },
  {
    label: "Ads 成效校準",
    value: 35,
    tone: "watch",
    meaning: "目前能保留 NT$500 預算守門規則，但尚未能自動讀取每日廣告品質。"
  },
  {
    label: "自動日報取數",
    value: 25,
    tone: "watch",
    meaning: "日報格式已就位，下一步是接 GA4 Data API 與 Ads 只讀資料。"
  }
];

export const dailyReportSections: DailyReportSection[] = [
  {
    title: "今日結論",
    tone: "watch",
    summary: "今天先把資料可信度補齊，再決定要不要改產品或廣告。",
    points: [
      "事件已經有基礎，但尚未接自動取數，所以不能把這頁當成即時績效儀表板。",
      "目前建議先看 GA4 Realtime / DebugView 是否穩定收到正式站事件。",
      "Ads 維持每日 NT$500 上限，不因尚未驗證的事件而提高預算。"
    ]
  },
  {
    title: "資料源狀態",
    tone: "watch",
    summary: "可以開始觀察，但真實趨勢仍需要只讀 API 或匯出資料接入。",
    points: [
      "GA4：用來看使用者有沒有開始、完成、看到結果與點下一步。",
      "GTM：用來管理標籤與觸發規則，正式站容器仍需要確認與分流。",
      "Ads：目前只做成效校準，不做預算、投放、轉換匯入調整。"
    ]
  },
  {
    title: "漏斗觀察",
    tone: "pass",
    summary: "日報會把流量拆成開始前、作答中、結果頁後三段判斷。",
    points: [
      "開始前流失：有 landing_view，沒有 start_assessment 或 tool_start。",
      "作答中流失：有 step_view / step_answer，但沒有 complete_assessment。",
      "結果後承接：有 view_assessment_result，再看是否有 CTA、Ask Ivy、諮詢或工具事件。"
    ]
  },
  {
    title: "今天建議動作",
    tone: "pass",
    summary: "先做可驗證的小步驟，不直接動 Ads。",
    points: [
      "把 GA4/Ads 的每日觀察加入既有 Gmail 報表自動化，讓外部建議先被數據校準。",
      "若 GA4 顯示高流量低開始率，優先檢查 landing CTA、文案與手機版入口。",
      "若 GA4 顯示開始後中途離開，優先檢查題目頁 UX、載入、上一題/下一題流程。"
    ]
  }
];

export const mailAutomationRules: MailAutomationRule[] = [
  {
    title: "來源優先順序",
    rule: "先看 GA4 / Ads / FamilyFin 後台或偵查台狀態，再讀 Gmail 報表。",
    output: "避免 Email 建議看起來合理，但其實和當天流量或漏斗不一致。"
  },
  {
    title: "證據標記",
    rule: "每張建議卡都要標示 GA4/Ads 支持、GA4/Ads 反證、Email only、資料不足。",
    output: "Kevin 可以知道哪些建議值得執行，哪些只是候選想法。"
  },
  {
    title: "廣告守門",
    rule: "Ads 調整必須有 GA4/GTM/Ads 證據，預算維持每日 NT$500 上限。",
    output: "避免在轉換未驗證時放大花費；必要時先改功能、流程或文案。"
  },
  {
    title: "資料不足處理",
    rule: "如果 GA4/Ads 尚未讀到資料，要明確寫成資料缺口，不把缺口當成沒有問題。",
    output: "日報會保留 blocker，下一次自動化可以接著補驗，而不是重頭猜。"
  }
];

export const funnels: Funnel[] = [
  {
    name: "assessment",
    plainName: "檢測流程",
    purpose: "看使用者是否從進入檢測、開始作答、完成、看到結果，再走向下一步。",
    steps: [
      {
        code: "landing_view",
        label: "進到檢測頁",
        question: "使用者有沒有看到檢測入口？",
        meaning: "這是漏斗起點，用來和後面的開始率比較。"
      },
      {
        code: "start_assessment",
        label: "真的開始作答",
        question: "使用者是否進到第 1 題？",
        meaning: "這比單純點開始按鈕更準，代表流程正式開始。"
      },
      {
        code: "assessment_step_answer",
        label: "完成某一題",
        question: "看到題目後，有沒有作答？",
        meaning: "可以判斷是看了就離開，還是答完後卡住。"
      },
      {
        code: "complete_assessment",
        label: "完成全部題目",
        question: "是否順利完成最後一題？",
        meaning: "這代表作答流程本身大致走完。"
      },
      {
        code: "view_assessment_result",
        label: "看到結果頁",
        question: "結果頁有沒有真的顯示？",
        meaning: "不能只看送出成功，還要確認使用者看得到結果。"
      },
      {
        code: "assessment_result_cta_click",
        label: "點擊下一步",
        question: "看完結果後，有沒有繼續使用其他功能？",
        meaning: "用來判斷結果頁是否能承接 Ask Ivy、諮詢或工具。"
      }
    ]
  },
  {
    name: "askIvy",
    plainName: "問 Ivy",
    purpose: "看使用者是否只是打開 AI，還是真的送出問題並得到成功回覆。",
    steps: [
      {
        code: "ask_ivy_start",
        label: "打開問 Ivy",
        question: "使用者有沒有進入 AI 工具？",
        meaning: "代表有興趣，但還不等於真的使用。"
      },
      {
        code: "ask_ivy_message_submit",
        label: "送出訊息",
        question: "使用者是否願意提出問題？",
        meaning: "不送出訊息內容，只看是否有送出這個動作。"
      },
      {
        code: "ask_ivy_message_success",
        label: "成功得到回覆",
        question: "AI 回覆是否完成？",
        meaning: "如果送出很多但成功很少，要查等待、錯誤或信任問題。"
      }
    ]
  },
  {
    name: "consultation",
    plainName: "線上諮詢",
    purpose: "看高意願使用者是否從開始諮詢走到成功送出。",
    steps: [
      {
        code: "consultation_start",
        label: "開始諮詢",
        question: "使用者是否打開諮詢流程？",
        meaning: "代表有求助意圖。"
      },
      {
        code: "consultation_submit",
        label: "送出諮詢",
        question: "表單是否真的成功送出？",
        meaning: "這是最接近正式轉換的行為，但要確認穩定後才匯入 Ads。"
      }
    ]
  },
  {
    name: "toolbox",
    plainName: "工具箱",
    purpose: "看使用者是否真的完成工具，而不是只打開頁面。",
    steps: [
      {
        code: "tool_start",
        label: "打開工具",
        question: "使用者是否開始使用工具？",
        meaning: "可用來看哪些工具吸引人。"
      },
      {
        code: "tool_complete",
        label: "完成工具",
        question: "使用者是否完成一次工具操作？",
        meaning: "不送個人輸入值，只看流程是否完成。"
      }
    ]
  }
];

export const rollups: RollupItem[] = [
  {
    period: "日報",
    boundary: "每天 00:00-23:59",
    question: "昨天有沒有正常收資料？有沒有明顯異常？"
  },
  {
    period: "週報",
    boundary: "週一到週日，跨年要拆開",
    question: "一週內哪個流程最常掉人？"
  },
  {
    period: "月報",
    boundary: "每月 1 日到月底",
    question: "哪個來源、頁面、工具帶來比較多有效使用？"
  },
  {
    period: "季報",
    boundary: "Q1 到 Q4，以自然季度計算",
    question: "產品優化或廣告策略有沒有變好？"
  },
  {
    period: "半年報",
    boundary: "H1 一到六月，H2 七到十二月",
    question: "使用者是否開始使用更多功能，而不是只看單一頁面？"
  },
  {
    period: "年報",
    boundary: "1 月 1 日到 12 月 31 日",
    question: "全年成長、留存、工具使用與廣告效率如何？"
  }
];

export const decisionRules: DecisionRule[] = [
  {
    signal: "廣告點擊很多，但很少開始檢測",
    likelyReason: "廣告承諾、頁面內容或按鈕位置可能不一致",
    firstMove: "先修著陸頁與 CTA，不急著增加預算。"
  },
  {
    signal: "很多人開始檢測，但卡在同一題",
    likelyReason: "題目呈現、手機版操作或下一步流程可能有摩擦",
    firstMove: "先檢查該題的版面、文案、按鈕與載入狀態。"
  },
  {
    signal: "很多人看到結果，但很少點下一步",
    likelyReason: "結果頁沒有明確告訴使用者接下來可以做什麼",
    firstMove: "測試 Ask Ivy、線上諮詢、工具箱的順序與文字。"
  },
  {
    signal: "很多人送出 Ask Ivy，但成功回覆很少",
    likelyReason: "可能是等待太久、錯誤處理不清楚，或使用者不放心",
    firstMove: "先改善載入、錯誤提示與第一個引導問題。"
  }
];

export const glossary: GlossaryItem[] = [
  {
    term: "GA4",
    plain: "Google Analytics，主要用來看網站使用行為。",
    example: "例如有多少人開始檢測、完成檢測、看結果頁。"
  },
  {
    term: "GTM",
    plain: "Google Tag Manager，像是網站追蹤工具的總開關。",
    example: "未來要新增或調整追蹤事件，可以少改網站程式。"
  },
  {
    term: "Ads",
    plain: "Google Ads，廣告投放系統。",
    example: "等 GA4 事件穩定後，才判斷哪些事件能匯入當廣告轉換。"
  },
  {
    term: "漏斗",
    plain: "把使用者流程拆成一段一段，看人在哪一段離開。",
    example: "進檢測頁、開始作答、完成、看結果、點下一步。"
  },
  {
    term: "事件代碼",
    plain: "系統送給 GA4 的行為名稱，不是要給一般使用者看的文字。",
    example: "start_assessment 代表使用者進到第 1 題。"
  }
];

export const approvalGates = [
  "發布或修改 GTM",
  "新增或修改 GA4 關鍵事件",
  "把 GA4 事件匯入 Ads 當轉換",
  "調整 Ads 預算、出價、關鍵字、素材或活動狀態",
  "移除這個偵查台的 noindex",
  "新增、替換或外流 GA4 / Ads 正式讀取憑證"
];
