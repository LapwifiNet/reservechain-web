import type { CollectionConfig, PayloadRequest } from "payload/types";
import type { Response } from "express";
import { isAdmin, isAdminOrEditor, publishedOrSignedIn } from "../access/roles";
import { isAdminFieldLevel } from "../access/roles";
import { formatSlug } from "../hooks/formatSlug";
import { PRELAUNCH_DISCLOSURE } from "../disclosure";

/**
 * Shape of a passport document as read by the public endpoint below. Payload's
 * generated types are only available after `npm run generate:types` (and the
 * generated file is git-ignored), so the handful of fields this endpoint
 * actually serialises are declared here rather than reaching for `any`.
 * `program` is a relationship: an id string at depth 0, a populated object at
 * the depth 2 the query requests.
 */
type PublicPassportDoc = {
  slug?: string | null;
  title?: string | null;
  stage?: string | null;
  disclosure?: string | null;
  program?:
    | string
    | number
    | {
        title?: string | null;
        code?: string | null;
        metal?: string | null;
        purity?: string | null;
        stage?: string | null;
      }
    | null;
  highlights?: { label?: string | null; value?: string | null }[] | null;
  tokenMapping?: {
    activated?: boolean | null;
    contractAddress?: string | null;
    circulatingSupply?: number | null;
  } | null;
};

/**
 * The public-facing Digital Asset Passport (DAP). Generated from the registry
 * and published deliberately. The on-chain token mapping is admin-gated and
 * inactive by default — no passport implies an offer.
 */
const Passports: CollectionConfig = {
  slug: "passports",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "program", "stage", "status", "slug"],
    group: "Registry",
  },
  access: {
    read: publishedOrSignedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "program",
      type: "relationship",
      relationTo: "asset-programs",
      required: true,
    },
    {
      name: "records",
      type: "relationship",
      relationTo: "asset-records",
      hasMany: true,
      admin: { description: "Physical lots referenced by this passport." },
    },
    {
      name: "highlights",
      type: "array",
      admin: {
        description: "Key/value provenance facts shown on the passport.",
      },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
    { name: "notes", type: "richText" },
    {
      name: "stage",
      type: "select",
      defaultValue: "illustrative",
      admin: { position: "sidebar" },
      options: [
        { label: "Illustrative", value: "illustrative" },
        { label: "Provisional", value: "provisional" },
        { label: "Full", value: "full" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      admin: {
        position: "sidebar",
        description: 'Only "published" passports are exposed publicly.',
      },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "tokenMapping",
      type: "group",
      admin: {
        description: "On-chain link. INACTIVE until written authorization.",
      },
      access: { update: isAdminFieldLevel },
      fields: [
        {
          name: "activated",
          type: "checkbox",
          defaultValue: false,
          admin: { description: "Leave off pre-launch." },
        },
        { name: "contractAddress", type: "text" },
        { name: "circulatingSupply", type: "number" },
      ],
    },
    {
      name: "disclosure",
      type: "textarea",
      defaultValue: PRELAUNCH_DISCLOSURE,
      admin: { description: "Verbatim pre-launch disclosure (do not alter)." },
    },
    {
      name: "slug",
      type: "text",
      index: true,
      unique: true,
      admin: { position: "sidebar" },
      hooks: { beforeValidate: [formatSlug("title")] },
    },
  ],
  endpoints: [
    {
      // Public, read-only DAP by slug: GET /api/passports/public/:slug
      // Returns a sanitised shape and never exposes an inactive token mapping.
      path: "/public/:slug",
      method: "get",
      handler: async (req: PayloadRequest, res: Response) => {
        const { slug } = req.params;
        const found = await req.payload.find({
          collection: "passports",
          depth: 2,
          limit: 1,
          where: {
            and: [
              { slug: { equals: slug } },
              { status: { equals: "published" } },
            ],
          },
        });

        const doc = found.docs[0] as PublicPassportDoc | undefined;
        if (!doc) {
          return res.status(404).json({ error: "passport_not_found" });
        }

        const program =
          typeof doc.program === "object" && doc.program !== null
            ? doc.program
            : {};
        const mapping =
          doc.tokenMapping && doc.tokenMapping.activated
            ? {
                contractAddress: doc.tokenMapping.contractAddress || null,
                circulatingSupply: doc.tokenMapping.circulatingSupply ?? null,
              }
            : null;

        return res.status(200).json({
          slug: doc.slug,
          title: doc.title,
          stage: doc.stage,
          program: {
            title: program.title || null,
            code: program.code || null,
            metal: program.metal || null,
            purity: program.purity || null,
            stage: program.stage || null,
          },
          highlights: (doc.highlights || []).map((h) => ({
            label: h.label,
            value: h.value,
          })),
          tokenMapping: mapping,
          disclosure: doc.disclosure || PRELAUNCH_DISCLOSURE,
        });
      },
    },
  ],
};

export default Passports;
