"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  approvalGates,
  dailyMetrics,
  dailyReportQuestions,
  decisionRules,
  funnels,
  glossary,
  readinessProgress,
  rollups,
  sourceSummary,
  statusLabels,
  type StatusTone
} from "@/lib/observer-config";

type SourceStatus = {
  generatedAt: string;
  mode: string;
  environment: string;
  noExternalWrites: boolean;
  sources: Record<string, boolean>;
  readiness: string;
};

const readinessText: Record<string, string> = {
  draft_no_live_api_credentials: "尚未接正式資料源",
  ready_for_read_only_ga4_adapter: "可接 GA4 只讀資料",
  checking_source_status: "正在確認",
  unknown: "狀態未知"
};

const toneDescriptions: Record<StatusTone, string> = {
  pass: "目前正常，可以持續觀察。",
  watch: "可以看方向，但還不能下成效結論。",
  revise: "已看到問題，需要修正或補資料。",
  block: "資料不足或設定有阻塞，先不要做決策。"
};

function percentStyle(value: number): CSSProperties {
  return { "--bar-value": `${value}%` } as CSSProperties;
}

export function ObserverDashboard() {
  const [activeFunnel, setActiveFunnel] = useState(funnels[0].name);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/source-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: SourceStatus) => {
        if (mounted) {
          setSourceStatus(payload);
        }
      })
      .catch(() => {
        if (mounted) {
          setSourceStatus(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedFunnel = useMemo(
    () => funnels.find((funnel) => funnel.name === activeFunnel) ?? funnels[0],
    [activeFunnel]
  );

  const readiness =
    readinessText[sourceStatus?.readiness ?? "checking_source_status"] ??
    sourceStatus?.readiness ??
    readinessText.unknown;

  return (
    <main>
      <section className="top-band">
        <div className="top-copy">
          <p className="eyebrow">好理家在網站偵查台</p>
          <h1>把網站數據變成看得懂的每日判斷</h1>
          <p className="lede">
            這個頁面是給你看的管理儀表板，不是工程文件。它會用白話和圖表說明：
            網站有沒有收資料、使用者卡在哪裡、該修產品流程還是先檢查廣告。
          </p>
        </div>
        <div className="status-strip" aria-label="目前保護狀態">
          <span>公開網址</span>
          <span>不給搜尋引擎收錄</span>
          <span>只讀不修改</span>
        </div>
      </section>

      <section className="surface answer-panel">
        <div>
          <p className="section-kicker">目前這頁先幫你看三件事</p>
          <h2>先知道有沒有收數，再判斷要修哪裡</h2>
        </div>
        <div className="answer-grid">
          {dailyReportQuestions.map((question) => (
            <div className="answer-item" key={question}>
              <span aria-hidden="true" />
              <p>{question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-heading">
        <p className="section-kicker">資料源總覽</p>
        <h2>這些工具各自負責什麼</h2>
      </section>

      <section className="section-grid source-grid" aria-label="資料源總覽">
        {sourceSummary.map((source) => (
          <article className="source-tile" data-tone={source.tone} key={source.title}>
            <div className="tile-head">
              <p>{source.title}</p>
              <span>{statusLabels[source.tone]}</span>
            </div>
            <strong>{source.state}</strong>
            <p>{source.plainMeaning}</p>
            <details>
              <summary>技術名稱</summary>
              <code>{source.technicalName}</code>
              <small>{source.detail}</small>
            </details>
          </article>
        ))}
      </section>

      <section className="surface split">
        <div>
          <p className="section-kicker">資料源狀態</p>
          <h2>{readiness}</h2>
          <p>
            目前這個偵查台已經可以公開查看，但還沒有接入 GA4 或 Ads 的只讀資料。
            所以下方圖表是「報表結構與觀察順序」，不是即時成效數字。
          </p>
        </div>
        <dl className="status-list">
          <div>
            <dt>目前環境</dt>
            <dd>{sourceStatus?.environment === "production" ? "正式部署" : "本機或檢查中"}</dd>
          </div>
          <div>
            <dt>是否會修改外部系統</dt>
            <dd>{sourceStatus?.noExternalWrites ? "不會，只讀" : "不會，只讀"}</dd>
          </div>
          <div>
            <dt>下一步</dt>
            <dd>接 GA4 Data API 只讀資料後，才顯示真實趨勢。</dd>
          </div>
        </dl>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表一</p>
            <h2>整體準備度</h2>
          </div>
          <p>橫條越長代表該階段越接近可用。這裡顯示的是建置狀態，不是流量成效。</p>
        </div>
        <div className="readiness-chart" aria-label="整體準備度圖表">
          {readinessProgress.map((item) => (
            <div className="progress-row" data-tone={item.tone} key={item.label}>
              <div className="progress-label">
                <strong>{item.label}</strong>
                <span>{statusLabels[item.tone]}</span>
              </div>
              <div className="bar-track">
                <span className="bar-fill" style={percentStyle(item.value)} />
              </div>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-heading">
        <p className="section-kicker">日報核心狀態</p>
        <h2>每天先看這四個判斷</h2>
      </section>

      <section className="section-grid metric-grid" aria-label="日報核心狀態">
        {dailyMetrics.map((metric) => (
          <article className="metric-tile" data-tone={metric.tone} key={metric.title}>
            <div className="tile-head">
              <p>{metric.title}</p>
              <span>{statusLabels[metric.tone]}</span>
            </div>
            <strong>{metric.state}</strong>
            <p>{metric.question}</p>
            <small>{metric.meaning}</small>
          </article>
        ))}
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表二</p>
            <h2>使用者流程漏斗</h2>
          </div>
          <p>這張圖是在說「要看哪幾段」。真正數字要等接上只讀資料源後才會出現。</p>
        </div>
        <div className="funnel-toolbar" aria-label="漏斗切換">
          {funnels.map((funnel) => (
            <button
              aria-pressed={activeFunnel === funnel.name}
              key={funnel.name}
              onClick={() => setActiveFunnel(funnel.name)}
              type="button"
            >
              {funnel.plainName}
            </button>
          ))}
        </div>
        <div className="funnel-body">
          <div>
            <h3>{selectedFunnel.plainName}</h3>
            <p>{selectedFunnel.purpose}</p>
            <div className="legend-box">
              <strong>讀圖方式</strong>
              <span>每一格都是一個使用者行為。哪一格掉很多人，就優先查那一段。</span>
            </div>
          </div>
          <ol className="funnel-flow">
            {selectedFunnel.steps.map((step, index) => (
              <li key={step.code}>
                <span className="step-number">{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.question}</p>
                  <small>{step.meaning}</small>
                  <details>
                    <summary>事件代碼</summary>
                    <code>{step.code}</code>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">圖表三</p>
            <h2>報表週期時間軸</h2>
          </div>
          <p>週、月、季、半年、年都用自然年度，不把跨年的資料混在一起。</p>
        </div>
        <div className="timeline" aria-label="報表週期時間軸">
          {rollups.map((rollup) => (
            <article key={rollup.period}>
              <strong>{rollup.period}</strong>
              <span>{rollup.boundary}</span>
              <p>{rollup.question}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid two-column">
        <section className="surface compact">
          <p className="section-kicker">判斷規則</p>
          <h2>先分清楚是產品問題，還是廣告問題</h2>
          <div className="rule-list">
            {decisionRules.map((rule) => (
              <article key={rule.signal}>
                <strong>{rule.signal}</strong>
                <p>可能原因：{rule.likelyReason}</p>
                <span>第一步：{rule.firstMove}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="surface compact">
          <p className="section-kicker">安全界線</p>
          <h2>這些事不能自動做</h2>
          <ul className="gate-list">
            {approvalGates.map((gate) => (
              <li key={gate}>{gate}</li>
            ))}
          </ul>
        </section>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">名詞解釋</p>
            <h2>把技術字翻成白話</h2>
          </div>
          <p>如果之後還有看不懂的詞，我會把它加進這裡。</p>
        </div>
        <div className="glossary-grid">
          {glossary.map((item) => (
            <article key={item.term}>
              <strong>{item.term}</strong>
              <p>{item.plain}</p>
              <small>{item.example}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="note-band">
        <strong>目前狀態提醒</strong>
        <p>{toneDescriptions.watch} 這一版重點是讓你看得懂偵查邏輯；接上只讀 API 後，才會開始顯示正式趨勢數字。</p>
      </section>
    </main>
  );
}
