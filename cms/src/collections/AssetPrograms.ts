import type { CollectionConfig } from "payload/types";
import { isAdmin, isAdminOrEditor, publishedOrSignedIn } from "../access/roles";
import { formatSlug } from "../hooks/formatSlug";
import { PRELAUNCH_DISCLOSURE } from "../disclosure";

/**
 * A tokenizable industrial-metal program (e.g. Copper Powder, Nickel Wire).
 * This is the top of the registry: records and passports reference a program.
 */
const AssetPrograms: CollectionConfig = {
  slug: "asset-programs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "code", "metal", "purity", "stage", "status"],
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
      name: "code",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Short program code, e.g. CP or NW." },
    },
    {
      name: "metal",
      type: "select",
      required: true,
      options: [
        { label: "Copper", value: "copper" },
        { label: "Nickel", value: "nickel" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "purity",
      type: "text",
      admin: { description: "e.g. 99.9999%" },
    },
    { name: "summary", type: "textarea" },
    {
      name: "stage",
      type: "select",
      defaultValue: "illustrative",
      admin: {
        position: "sidebar",
        description: "Business state shown on the passport.",
      },
      options: [
        { label: "Illustrative", value: "illustrative" },
        { label: "Active", value: "active" },
        { label: "Not for sale", value: "not_for_sale" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      admin: {
        position: "sidebar",
        description:
          'Visibility. Only "published" is exposed to the public API.',
      },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
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
};

export default AssetPrograms;
