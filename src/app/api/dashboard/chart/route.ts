import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
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

    // settings 조회
    const [settingsRows] = await pool.query<RowDataPacket[]>(
      "SELECT labor_cost_ratio, incentive_ratio FROM settings LIMIT 1"
    );

    if (settingsRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "설정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const laborCostRatio = Number(settingsRows[0].labor_cost_ratio);

    // 최근 12개월 목록 생성
    const now = new Date();
    const months: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    // 최근 12개월 범위
    const startYear = months[0].year;
    const startMonth = months[0].month;
    const endYear = months[11].year;
    const endMonth = months[11].month;

    // 월별 급여 합산 조회
    const [salaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT year, month, COALESCE(SUM(amount), 0) AS total
       FROM monthly_salary
       WHERE (year > ? OR (year = ? AND month >= ?))
         AND (year < ? OR (year = ? AND month <= ?))
       GROUP BY year, month`,
      [startYear, startYear, startMonth, endYear, endYear, endMonth]
    );

    // 월별 매출 조회
    const [salesRows] = await pool.query<RowDataPacket[]>(
      `SELECT year, month, COALESCE(amount, 0) AS amount
       FROM monthly_sales
       WHERE (year > ? OR (year = ? AND month >= ?))
         AND (year < ? OR (year = ? AND month <= ?))`,
      [startYear, startYear, startMonth, endYear, endYear, endMonth]
    );

    // Map으로 변환
    const salaryMap = new Map<string, number>();
    for (const row of salaryRows) {
      salaryMap.set(`${row.year}-${row.month}`, Number(row.total));
    }

    const salesMap = new Map<string, number>();
    for (const row of salesRows) {
      salesMap.set(`${row.year}-${row.month}`, Number(row.amount));
    }

    // 12개월 데이터 조립
    const chartData = months.map(({ year, month }) => {
      const key = `${year}-${month}`;
      const totalLaborCost = salaryMap.get(key) || 0;
      const actualSales = salesMap.get(key) || 0;
      const targetSales = laborCostRatio > 0 ? totalLaborCost / (laborCostRatio / 100) : 0;

      return {
        year,
        month,
        totalLaborCost,
        targetSales,
        actualSales,
      };
    });

    return NextResponse.json({ success: true, data: chartData });
  } catch (error) {
    console.error("Dashboard chart error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
