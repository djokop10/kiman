import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { config } from "./config";
import apiRoutes from "./routes";

export const app = express();

// Pastikan storage directories ada
const buktiDir = path.join(config.storageDir, "bukti-transfer");
const suratDir = path.join(config.storageDir, "surat-pdf");
if (!fs.existsSync(buktiDir)) fs.mkdirSync(buktiDir, { recursive: true });
if (!fs.existsSync(suratDir)) fs.mkdirSync(suratDir, { recursive: true });

// Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files untuk bukti transfer dan file PDF tiket
app.use("/storage", express.static(config.storageDir));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Kicau Mania REST API",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Rute API [${req.method}] ${req.originalUrl} tidak ditemukan`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Global Error Handler]:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal pada server"
  });
});
