import { Router } from "express";
import auth from "@/middlewares/auth";
import apiKey from "@/middlewares/api-key";
import SSEController from "@/controllers/sse.controller";

const router = Router();

router.get("/stream", auth, SSEController.stream);
router.post("/emit/broadcast", apiKey, SSEController.broadcast);
router.post("/emit/:user_id", apiKey, SSEController.emitToUser);

export default router;
