import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const entryId = Number(id);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 삭제 대상의 year, month 조회
      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT year, month FROM sales_entries WHERE id = ?",
        [entryId]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: "해당 매출 건을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const { year, month } = rows[0];

      // 건 삭제
      await conn.query("DELETE FROM sales_entries WHERE id = ?", [entryId]);

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
        data: { message: "매출이 삭제되었습니다." },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Sales DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
