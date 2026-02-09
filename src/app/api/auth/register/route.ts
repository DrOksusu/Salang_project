import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "이미 등록된 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // 첫 번째 사용자는 admin, 나머지는 employee
    const [allUsers] = await pool.query<RowDataPacket[]>("SELECT id FROM users LIMIT 1");
    const role = allUsers.length === 0 ? "admin" : "employee";

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)",
      [email, name, hashedPassword, role]
    );

    const token = generateToken({ userId: result.insertId, email, role });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: { id: result.insertId, email, name, role },
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
