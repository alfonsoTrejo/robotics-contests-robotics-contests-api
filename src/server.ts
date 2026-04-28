import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import routes from "./routes/";
import "dotenv/config";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  const startedAt = Date.now();
  const stamp = new Date().toISOString();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${stamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["https://localhost:3000"],
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", routes);

app.use(errorMiddleware);

function readTlsCredentials() {
  const keyPath = path.resolve(
    process.cwd(),
    process.env.TLS_KEY_PATH ?? "../certs/localhost-key.pem"
  );
  const certPath = path.resolve(
    process.cwd(),
    process.env.TLS_CERT_PATH ?? "../certs/localhost-cert.pem"
  );

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

const PORT = Number(process.env.PORT || 8080);
const server = https.createServer(readTlsCredentials(), app);

server.listen(PORT, () => console.log(`API on https://localhost:${PORT}`));