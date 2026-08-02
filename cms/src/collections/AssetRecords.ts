import type { CollectionConfig } from "payload/types";
import { isAdmin, isAdminOrEditor, isSignedIn } from "../access/roles";

/**
 * A physical lot held under a program, with its Certificate of Analysis and
 * custody metadata. Records are internal registry data — staff-read only — and
 * are surfaced to the public only through curated Passport entries.
 */
const AssetRecords: CollectionConfig = {
  slug: "asset-records",
  admin: {
    useAsTitle: "lot",
    defaultColumns: ["lot", "program", "quantity", "unit", "certificateRef"],
    group: "Registry",
  },
  access: {
    read: isSignedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: "program",
      type: "relationship",
      relationTo: "asset-programs",
      required: true,
    },
    { name: "lot", type: "text", required: true },
    {
      type: "row",
      fields: [
        { name: "quantity", type: "number", admin: { width: "50%" } },
        {
          name: "unit",
          type: "select",
          defaultValue: "kg",
          admin: { width: "50%" },
          options: [
            { label: "Kilogram", value: "kg" },
            { label: "Gram", value: "g" },
            { label: "Tonne", value: "t" },
            { label: "Units", value: "units" },
          ],
        },
      ],
    },
    {
      name: "certificate",
      type: "upload",
      relationTo: "media",
      admin: { description: "Certificate of Analysis document." },
    },
    {
      name: "certificateRef",
      type: "text",
      admin: { description: "Certificate identifier, e.g. IGAS-2026-0001." },
    },
    {
      name: "custody",
      type: "text",
      admin: { description: "Custodian / location." },
    },
  ],
};

export default AssetRecords;
