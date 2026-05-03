import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import logger from "@/middlewares/logger";
import errorHandler from "@/middlewares/error-handler";
import webpushRoutes from "@/routes/webpush.routes";
import sseRoutes from "@/routes/sse.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(logger);

app.get("/", (_req, res) => {
  res.json({ status_code: 200, detail: "API Running!" });
});

app.use("/webpush", webpushRoutes);
app.use("/sse", sseRoutes);

app.use(errorHandler);

export default app;
