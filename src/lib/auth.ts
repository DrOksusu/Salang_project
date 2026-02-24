import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import pool from "./db";
import { RowDataPacket } from "mysql2";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  userId: number;
  email: string;
  role: "admin" | "team_leader" | "employee";
  team: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  let payload: JwtPayload | null = null;

  // 1. Authorization 헤더 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      payload = verifyToken(authHeader.slice(7));
    } catch {
      // fall through to cookie check
    }
  }

  // 2. 쿠키 확인
  if (!payload) {
    const cookieToken = request.cookies.get("token")?.value;
    if (cookieToken) {
      try {
        payload = verifyToken(cookieToken);
      } catch {
        return null;
      }
    }
  }

  if (!payload) return null;

  // 기존 토큰에 team 필드가 없는 경우 DB에서 조회
  if (payload.team === undefined) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT team FROM users WHERE id = ? AND is_active = TRUE",
      [payload.userId]
    );
    payload.team = rows.length > 0 ? rows[0].team : null;
  }

  return payload;
}

export async function requireAdmin(request: NextRequest): Promise<JwtPayload | null> {
  const user = await getAuthUser(request);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function ensureAdminExists(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  if (rows.length === 0) {
    const hashed = await hashPassword("admin123");
    await pool.query(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')",
      ["admin@salang.com", hashed, "관리자"]
    );
  }
}
