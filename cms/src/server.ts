import "dotenv/config";
import express from "express";
import payload from "payload";
import { resolvePayloadSecret } from "./secret";

const app = express();

// Friendly redirect from root to the admin panel.
app.get("/", (_req, res) => {
  res.redirect("/admin");
});

// Lightweight liveness probe for infra health checks.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "reservechain-cms" });
});

const start = async (): Promise<void> => {
  await payload.init({
    secret: resolvePayloadSecret(),
    express: app,
    onInit: (cms) => {
      cms.logger.info(`ReserveChain CMS admin: ${cms.getAdminURL()}`);
    },
  });

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    payload.logger.info(
      `ReserveChain CMS listening on http://localhost:${port}`,
    );
  });
};

void start();
