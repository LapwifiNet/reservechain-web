import type { CollectionConfig } from "payload/types";
import path from "path";
import { isAdminOrEditor } from "../access/roles";

/**
 * Uploads collection — primarily Certificates of Analysis (CoA) attached to
 * asset records, plus any program imagery. Files are publicly readable so a
 * passport can link to a certificate; write access is staff-only.
 */
const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Registry", useAsTitle: "filename" },
  upload: {
    staticDir: path.resolve(__dirname, "../../uploads"),
    mimeTypes: ["image/*", "application/pdf"],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "alt", type: "text" },
    {
      name: "docType",
      type: "select",
      defaultValue: "coa",
      options: [
        { label: "Certificate of Analysis", value: "coa" },
        { label: "Image", value: "image" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "issuer",
      type: "text",
      admin: { description: "Issuing body, e.g. IGAS" },
    },
  ],
};

export default Media;
