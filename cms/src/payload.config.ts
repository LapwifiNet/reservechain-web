import path from "path";
import { buildConfig } from "payload/config";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import { slateEditor } from "@payloadcms/richtext-slate";

import Users from "./collections/Users";
import Media from "./collections/Media";
import AssetPrograms from "./collections/AssetPrograms";
import AssetRecords from "./collections/AssetRecords";
import Passports from "./collections/Passports";

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001",
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: "· ReserveChain CMS",
      favicon: "/favicon.ico",
    },
  },
  editor: slateEditor({}),
  collections: [Users, Media, AssetPrograms, AssetRecords, Passports],
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        "postgresql://reservechain:reservechain@localhost:5432/reservechain_cms",
    },
  }),
  cors: origins,
  csrf: origins,
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
});
