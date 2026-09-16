import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthUser, RoleAdmin } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Akses ditolak: Token otentikasi tidak ditemukan"
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Token otentikasi tidak valid atau telah kedaluwarsa"
    });
  }
};

export const requirePeserta = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.type !== "USER") {
    res.status(403).json({
      success: false,
      message: "Akses hanya untuk akun Peserta"
    });
    return;
  }
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.type !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Akses hanya untuk Panitia / Admin"
    });
    return;
  }
  next();
};

export const requireSuperadmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.type !== "ADMIN" || req.user.role !== RoleAdmin.SUPERADMIN) {
    res.status(403).json({
      success: false,
      message: "Akses hanya untuk Superadmin"
    });
    return;
  }
  next();
};
