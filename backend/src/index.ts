import express from "express";
import cors from "cors";
import { config } from "./lib/config";
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/accounts";
import creatorRoutes from "./routes/creators";
import videoRoutes from "./routes/videos";
import { requireAuth } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/accounts", requireAuth, accountRoutes);
app.use("/creators", requireAuth, creatorRoutes);
app.use("/videos", requireAuth, videoRoutes);

app.listen(config.port, () => {
  console.log(`ShopeePilot backend running on :${config.port}`);
});
