import type { MouseEvent } from "react";
import {
  useFileKind,
  useFileLanguage,
  useFileSizeBytes,
  useFileStats,
  useIsFileReadOnly,
} from "@/hooks/use-tabs";
import { useBooleanSetting, useSetSetting } from "@/hooks/use-settings";
import {
  FOOTER_METRICS,
  showFooterContextMenu,
  type FooterMetricSettingKey,
} from "./footer-context-menu";

function FooterMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--text-muted)]">{value.toLocaleString()}</span>
      <span>{label}</span>
    </div>
  );
}

export function DocumentFooter({ filePath }: { filePath: string }) {
  const kind = useFileKind(filePath);
  const language = useFileLanguage(filePath);
  const sizeBytes = useFileSizeBytes(filePath);
  const stats = useFileStats(filePath);
  const isReadOnly = useIsFileReadOnly(filePath);
  const setSetting = useSetSetting();
  const visibility: Record<FooterMetricSettingKey, boolean> = {
    "statusbar.show-words": useBooleanSetting("statusbar.show-words"),
    "statusbar.show-characters": useBooleanSetting("statusbar.show-characters"),
    "statusbar.show-paragraphs": useBooleanSetting("statusbar.show-paragraphs"),
  };
  const visibleMetrics = FOOTER_METRICS.filter((metric) => visibility[metric.settingKey]);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    void showFooterContextMenu({
      visibility,
      onToggle: (key, visible) => {
        void setSetting(key, visible);
      },
    });
  };

  if (kind === "sourceText") {
    return (
      <div className="flex absolute bottom-0 w-full z-10 h-11 shrink-0 items-center justify-end gap-5 px-6 text-[13px] leading-[1.15] text-[var(--text-muted)] md:px-8">
        <FooterMetric label="bytes" value={sizeBytes} />
        {language ? <span>{language}</span> : null}
        {isReadOnly ? <span>read-only</span> : null}
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="flex absolute bottom-0 w-full z-10 h-11 shrink-0 items-center justify-end gap-5 px-6 text-[13px] leading-[1.15] text-[var(--text-muted)] md:px-8">
        <span>image</span>
        <FooterMetric label="bytes" value={sizeBytes} />
        <span>read-only</span>
      </div>
    );
  }

  if (kind === "audio" || kind === "video") {
    return (
      <div className="flex absolute bottom-0 w-full z-10 h-11 shrink-0 items-center justify-end gap-5 px-6 text-[13px] leading-[1.15] text-[var(--text-muted)] md:px-8">
        <span>{kind}</span>
        <FooterMetric label="bytes" value={sizeBytes} />
        <span>read-only</span>
      </div>
    );
  }

  if (kind === "unsupported" || kind === "tooLarge" || kind === "binary") {
    return (
      <div className="flex absolute bottom-0 w-full z-10 h-11 shrink-0 items-center justify-end gap-5 px-6 text-[13px] leading-[1.15] text-[var(--text-muted)] md:px-8">
        <span>read-only</span>
      </div>
    );
  }

  if (visibleMetrics.length === 0) return null;

  return (
    <div
      data-document-footer
      onContextMenu={handleContextMenu}
      className="flex absolute bottom-0 w-full z-10 h-11 shrink-0 items-center justify-end gap-5 px-6 text-[13px] leading-[1.15] text-[var(--text-muted)] md:px-8"
    >
      {visibleMetrics.map((metric) => (
        <FooterMetric
          key={metric.settingKey}
          label={metric.footerLabel}
          value={stats[metric.statKey]}
        />
      ))}
    </div>
  );
}
