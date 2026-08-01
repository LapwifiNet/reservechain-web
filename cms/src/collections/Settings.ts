import type { CollectionConfig } from "payload/types";
import { isAdmin } from "../access/roles";

/**
 * SC-CMS-SETTINGS — website modes + module visibility (FR-MODE, decision D4).
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
 * Read is public by design: the current mode is not secret and the public
 * site must be able to read it without auth. Write is admin-only.
 */
const Settings: CollectionConfig = {
  slug: "settings",
  admin: {
    useAsTitle: "name",
    group: "System",
    description:
      "Website mode and module visibility. Changing a mode never activates a gated module — those stay behind env flags.",
  },
  access: {
    read: () => true, // public: the website reads the current mode unauthenticated
    create: isAdmin,
    update: isAdmin,
    delete: () => false, // singleton: never delete
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
