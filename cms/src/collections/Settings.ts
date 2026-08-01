import type { CollectionConfig } from "payload/types";
import { isAdmin } from "../access/roles";
import {
  DEFAULT_STATE,
  optionsFor,
  transitionError,
  type StatusAxis,
} from "../lib/statusMachine";

/**
 * SC-CMS-SETTINGS — website modes, module visibility and project status chips
 * (FR-MODE + FR-STATUS, decisions D4 and D5).
 *
 * The spec wants website modes to be CMS data, separate from the env
 * kill-switch flags. This collection is that data source:
 *
 * - `siteMode` mirrors src/lib/mode.ts SITE_MODES (development … enterprise-onboarding).
 * - The env flags (PROOF_OF_RESERVES_ENABLED etc.) stay env-only and keep
 *   answering 501 — a mode change alone never opens a gated module (AGENTS §2).
 * - The website reads this collection with an env fallback when the CMS is
 *   unreachable (public pages degrade, they do not fail — invariant 29).
 *
 * D5 adds the three status chips (publication / token / asset) on the same
 * terms: the state is data here, the *wording* is not. Each field is an enum
 * from lib/statusMachine, the website maps it to an approved translated
 * string, and the `beforeChange` hook below refuses a jump across the scale.
 * A status is display-only — like a mode change, it never activates a gated
 * module.
 *
 * Read is public by design: the current mode is not secret and the public
 * site must be able to read it without auth. Write is admin-only.
 */
const Settings: CollectionConfig = {
  slug: "settings",
  admin: {
    useAsTitle: "name",
    group: "System",
    description:
      "Website mode, module visibility and project status chips. Changing a mode or a status never activates a gated module — those stay behind env flags.",
  },
  access: {
    read: () => true, // public: the website reads the current mode unauthenticated
    create: isAdmin,
    update: isAdmin,
    delete: () => false, // singleton: never delete
  },
  hooks: {
    /**
     * Enforce the D5 state machine. Payload validates each value against the
     * `select` options on its own; what it cannot see is the *previous* value,
     * so this is the only place a jump across the scale can be refused.
     */
    beforeChange: [
      async ({ data, originalDoc }) => {
        const axes: Array<[StatusAxis, string]> = [
          ["publication", "publicationStatus"],
          ["token", "tokenStatus"],
          ["asset", "assetStatus"],
        ];
        for (const [axis, field] of axes) {
          const to = (data as Record<string, unknown>)[field];
          if (typeof to !== "string") continue;
          const from =
            (originalDoc as Record<string, unknown> | undefined)?.[field];
          const err = transitionError(
            axis,
            typeof from === "string" ? from : DEFAULT_STATE[axis],
            to,
          );
          if (err) throw new Error(err);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      defaultValue: "default",
      unique: true,
      admin: { hidden: true },
    },
    {
      name: "siteMode",
      type: "select",
      required: true,
      defaultValue: "prelaunch",
      options: [
        { label: "Development", value: "development" },
        { label: "Pre-Launch", value: "prelaunch" },
        { label: "Waitlist", value: "waitlist" },
        { label: "Documentation Release", value: "documentation" },
        { label: "Asset Verification", value: "asset-verification" },
        { label: "Eligibility", value: "eligibility" },
        { label: "Early Participation", value: "early-participation" },
        { label: "Live Offering", value: "live-offering" },
        { label: "Redemption", value: "redemption" },
        { label: "Enterprise Onboarding", value: "enterprise-onboarding" },
      ],
      admin: {
        description:
          "Controls what the website displays. Never enables a gated module by itself.",
      },
    },
    {
      name: "waitlistOpen",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Whether the public waitlist form accepts registrations." },
    },
    {
      name: "publicationStatus",
      type: "select",
      required: true,
      defaultValue: DEFAULT_STATE.publication,
      options: optionsFor("publication"),
      admin: {
        description:
          "Publication chip. State of the project's documentation. Advance one state at a time.",
      },
    },
    {
      name: "tokenStatus",
      type: "select",
      required: true,
      defaultValue: DEFAULT_STATE.token,
      options: optionsFor("token"),
      admin: {
        description:
          "Token chip. The scale stops at testnet by design — deployments are testnet-only (guardrail 1) and no state may imply tokens are sold, issued or traded.",
      },
    },
    {
      name: "assetStatus",
      type: "select",
      required: true,
      defaultValue: DEFAULT_STATE.asset,
      options: optionsFor("asset"),
      admin: {
        description:
          "Asset chip. Only move to \"Independently verified\" once the supporting documentation is published — the chip is a public claim.",
      },
    },
    {
      name: "disclosureOverrides",
      type: "array",
      admin: { description: "Optional per-locale disclosure overrides (defaults stay verbatim)." },
      fields: [
        { name: "locale", type: "select", options: ["en", "es", "it"], required: true },
        { name: "text", type: "textarea", required: true },
      ],
    },
  ],
};

export default Settings;
