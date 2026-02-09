import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, requireAdmin } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: "year와 month를 입력해주세요." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, year, month, amount, created_at FROM monthly_sales WHERE year = ? AND month = ?",
      [year, month]
    );

    return NextResponse.json({ success: true, data: rows.length > 0 ? rows[0] : null });
  } catch (error) {
    console.error("Sales GET error:", error);
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

    const { year, month, amount } = await request.json();

    if (!year || !month || amount == null) {
      return NextResponse.json(
        { success: false, error: "year, month, amount를 입력해주세요." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO monthly_sales (year, month, amount)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [year, month, amount]
    );

    return NextResponse.json({ success: true, data: { message: "매출이 저장되었습니다." } });
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
