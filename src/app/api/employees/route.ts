import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, role, position, hire_date, is_active FROM users ORDER BY id ASC"
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { email, name, password, role, position, hire_date } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: "이메일, 이름, 비밀번호는 필수입니다." },
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

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (email, name, password, role, position, hire_date) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, role || "employee", position || null, hire_date || null]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.insertId,
          email,
          name,
          role: role || "employee",
          position: position || null,
          hire_date: hire_date || null,
          is_active: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Employees POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
