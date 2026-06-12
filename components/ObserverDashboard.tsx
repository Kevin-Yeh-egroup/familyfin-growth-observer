"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approvalGates,
  dailyMetrics,
  decisionRules,
  funnels,
  rollups,
  sourceSummary,
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

const toneLabels: Record<StatusTone, string> = {
  pass: "Pass",
  watch: "Watch",
  revise: "Revise",
  block: "Block"
};

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

  return (
    <main>
      <section className="top-band">
        <div className="top-copy">
          <p className="eyebrow">FamilyFin Growth Observer</p>
          <h1>好理家在 GA4 / GTM / Ads 偵查台</h1>
          <p className="lede">
            獨立於 dbs-client 的 read-only 報表骨架。這裡只觀察資料源、漏斗與
            決策規則，不寫入 GA4、GTM、Ads 或正式網站。
          </p>
        </div>
        <div className="status-strip" aria-label="deployment status">
          <span>Public Vercel</span>
          <span>Noindex</span>
          <span>Read-only</span>
        </div>
      </section>

      <section className="section-grid source-grid" aria-label="source summary">
        {sourceSummary.map((source) => (
          <article className="source-tile" key={source.label}>
            <p>{source.label}</p>
            <strong>{source.value}</strong>
            <span>{source.note}</span>
          </article>
        ))}
      </section>

      <section className="surface split">
        <div>
          <p className="section-kicker">API readiness</p>
          <h2>資料源狀態</h2>
          <p>
            目前先以安全骨架部署。等要接 GA4 Data API 或 Ads API 時，只在
            Vercel 設定 read-only 環境變數，不把密鑰放進 repo。
          </p>
        </div>
        <dl className="status-list">
          <div>
            <dt>Readiness</dt>
            <dd>{sourceStatus?.readiness ?? "checking_source_status"}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{sourceStatus?.environment ?? "unknown"}</dd>
          </div>
          <div>
            <dt>No external writes</dt>
            <dd>{sourceStatus?.noExternalWrites ? "true" : "true"}</dd>
          </div>
        </dl>
      </section>

      <section className="section-heading">
        <p className="section-kicker">Daily detection</p>
        <h2>日報核心狀態</h2>
      </section>

      <section className="section-grid metric-grid" aria-label="daily metrics">
        {dailyMetrics.map((metric) => (
          <article className="metric-tile" data-tone={metric.status} key={metric.label}>
            <div className="tile-head">
              <p>{metric.label}</p>
              <span>{toneLabels[metric.status]}</span>
            </div>
            <strong>{metric.value}</strong>
            <small>{metric.meaning}</small>
          </article>
        ))}
      </section>

      <section className="surface">
        <div className="funnel-toolbar" aria-label="funnel tabs">
          {funnels.map((funnel) => (
            <button
              aria-pressed={activeFunnel === funnel.name}
              key={funnel.name}
              onClick={() => setActiveFunnel(funnel.name)}
              type="button"
            >
              {funnel.name}
            </button>
          ))}
        </div>
        <div className="funnel-body">
          <div>
            <p className="section-kicker">Funnel</p>
            <h2>{selectedFunnel.name}</h2>
            <p>{selectedFunnel.purpose}</p>
          </div>
          <ol className="step-list">
            {selectedFunnel.steps.map((step, index) => (
              <li key={step.event}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.label}</strong>
                  <code>{step.event}</code>
                  <p>{step.meaning}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="surface">
        <div className="section-heading inline">
          <div>
            <p className="section-kicker">Calendar rollups</p>
            <h2>自然年度統計</h2>
          </div>
          <p>Users 與 sessions 要以整個期間重新查詢，不可把每日 unique 相加。</p>
        </div>
        <div className="rollup-table" role="table" aria-label="calendar rollups">
          {rollups.map((rollup) => (
            <div className="rollup-row" role="row" key={rollup.period}>
              <strong role="cell">{rollup.period}</strong>
              <span role="cell">{rollup.boundary}</span>
              <p role="cell">{rollup.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-grid two-column">
        <section className="surface compact">
          <p className="section-kicker">Decision rules</p>
          <h2>產品或 Ads 要先判斷哪裡卡住</h2>
          <div className="rule-list">
            {decisionRules.map((rule) => (
              <article key={rule.signal}>
                <strong>{rule.signal}</strong>
                <p>{rule.read}</p>
                <span>{rule.action}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="surface compact">
          <p className="section-kicker">Approval gates</p>
          <h2>不能自動執行的項目</h2>
          <ul className="gate-list">
            {approvalGates.map((gate) => (
              <li key={gate}>{gate}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
