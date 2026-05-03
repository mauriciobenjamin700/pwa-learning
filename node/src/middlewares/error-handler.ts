import { ErrorRequestHandler } from "express";
import ApiError from "@/core/errors";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status_code).json({
      status_code: err.status_code,
      detail: err.detail,
    });
    return;
  }
  console.error("Erro não tratado:", err);
  res.status(500).json({
    status_code: 500,
    detail: "Erro interno do servidor",
  });
};

export default errorHandler;
