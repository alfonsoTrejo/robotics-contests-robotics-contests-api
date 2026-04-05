import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API on :${PORT}`));