"use client";

import { WeddingSettings, getCoupleNames } from "@/utils/settings";
import ScrollIndicator from "./ScrollIndicator";

export default function SectionFooterNav({
  settings,
  className = "",
}: {
  settings?: WeddingSettings | null;
  className?: string;
}) {
  const couple = getCoupleNames(settings ?? null);

  return (
    <div className={`section-footer ${className}`}>
      {/* Contact + scroll row */}
      <div className="flex items-center justify-center w-full mx-auto">
        {/* Left: Mireasa */}
        {settings?.telefon_mireasa && (
          <a
            href={`tel:${settings.telefon_mireasa.replace(/\s/g, "")}`}
            className="flex-1 min-w-0 flex flex-col items-center gap-0.5 group"
          >
            <span className="text-[0.55rem] text-text-muted truncate max-w-full">{couple.mireasa}</span>
            <span className="text-[0.6rem] text-button group-hover:text-button-hover transition-colors truncate max-w-full">
              {settings.telefon_mireasa}
            </span>
          </a>
        )}

        {/* Center: scroll indicator */}
        <div className="flex flex-col items-center shrink-0 px-2 sm:px-4">
          <ScrollIndicator />
        </div>

        {/* Right: Mire */}
        {settings?.telefon_mire && (
          <a
            href={`tel:${settings.telefon_mire.replace(/\s/g, "")}`}
            className="flex-1 min-w-0 flex flex-col items-center gap-0.5 group"
          >
            <span className="text-[0.55rem] text-text-muted truncate max-w-full">{couple.mire}</span>
            <span className="text-[0.6rem] text-button group-hover:text-button-hover transition-colors truncate max-w-full">
              {settings.telefon_mire}
            </span>
          </a>
        )}
      </div>

    </div>
  );
}
