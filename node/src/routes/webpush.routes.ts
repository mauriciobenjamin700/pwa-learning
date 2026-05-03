import { Router } from "express";
import auth from "@/middlewares/auth";
import apiKey from "@/middlewares/api-key";
import WebPushController from "@/controllers/webpush.controller";

const router = Router();

// Cliente — autenticado por Bearer
router.post("/subscription", auth, WebPushController.subscribe);
router.delete("/subscription", auth, WebPushController.unsubscribeAll);

// Interno — autenticado por API key
router.delete(
  "/subscription/by-endpoint",
  apiKey,
  WebPushController.deleteByEndpoint,
);
router.post("/notify/:user_id", apiKey, WebPushController.notifyUser);
router.post("/notify", apiKey, WebPushController.broadcast);

export default router;
