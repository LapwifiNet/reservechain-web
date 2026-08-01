'use client';

import { useState } from 'react';

/**
 * FAQ accordion slot (SC-WEB-FAQ). Renders `qa` pairs as expandable items
 * instead of the flat InfoPage block list. The copy is the same message
 * namespace — only the presentation changes.
 */
export function FaqAccordion({ qa }: { qa: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {qa.map((item, i) => {
        const expanded = open === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : i)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-text hover:bg-surface-2/50"
            >
              {item.q}
              <span
                aria-hidden="true"
                className={`shrink-0 text-copper transition-transform ${expanded ? 'rotate-45' : ''}`}
              >
                +
              </span>
            </button>
            {expanded ? (
              <p className="border-t border-border/60 px-5 py-4 text-sm leading-relaxed text-text2">
                {item.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
