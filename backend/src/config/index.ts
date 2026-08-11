import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "kicau_mania_default_jwt_secret_2026",
  jwtExpiresIn: "7d",
  baseUrl: process.env.BASE_URL || "http://localhost:5001",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || "./storage"),
  google: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || ""
  }
};
