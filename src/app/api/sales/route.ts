import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, requireAdmin } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

    const [entries] = await pool.query<RowDataPacket[]>(
      "SELECT id, year, month, sale_date, amount, profit, description, created_at FROM sales_entries WHERE year = ? AND month = ? ORDER BY sale_date ASC, id ASC",
      [year, month]
    );

    const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalProfit = entries.reduce((sum, e) => sum + Number(e.profit), 0);

    return NextResponse.json({
      success: true,
      data: { entries, totalAmount, totalProfit },
    });
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

    const { sale_date, amount, profit, description } = await request.json();

    if (!sale_date || amount == null) {
      return NextResponse.json(
        { success: false, error: "sale_date, amount를 입력해주세요." },
        { status: 400 }
      );
    }

    const date = new Date(sale_date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 건별 매출 추가
      await conn.query<ResultSetHeader>(
        "INSERT INTO sales_entries (year, month, sale_date, amount, profit, description) VALUES (?, ?, ?, ?, ?, ?)",
        [year, month, sale_date, amount, profit || 0, description || null]
      );

      // SUM 재계산 → monthly_sales 갱신
      const [sumRows] = await conn.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(amount), 0) AS totalAmount, COALESCE(SUM(profit), 0) AS totalProfit FROM sales_entries WHERE year = ? AND month = ?",
        [year, month]
      );
      const totalAmount = Number(sumRows[0].totalAmount);
      const totalProfit = Number(sumRows[0].totalProfit);

      await conn.query(
        `INSERT INTO monthly_sales (year, month, amount, profit)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), profit = VALUES(profit)`,
        [year, month, totalAmount, totalProfit]
      );

      await conn.commit();

      return NextResponse.json({
        success: true,
        data: { message: "매출이 추가되었습니다." },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
