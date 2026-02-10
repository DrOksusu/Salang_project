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

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

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
    const incentiveRatio = Number(settingsRows[0].incentive_ratio);

    // 해당 월 전체 급여 합산
    const [salaryRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM monthly_salary WHERE year = ? AND month = ?",
      [year, month]
    );
    const totalLaborCost = Number(salaryRows[0].total);

    // 해당 월 매출 조회
    const [salesRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(amount, 0) AS amount FROM monthly_sales WHERE year = ? AND month = ?",
      [year, month]
    );
    const actualSales = salesRows.length > 0 ? Number(salesRows[0].amount) : 0;

    // 해당 월 인센티브 배분 합산
    const [incentiveRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM monthly_incentive WHERE year = ? AND month = ?",
      [year, month]
    );
    const distributedIncentive = Number(incentiveRows[0].total);

    // 계산: 월 목표매출 = 월 인건비 / (인건비율/100)
    const targetSales = laborCostRatio > 0 ? totalLaborCost / (laborCostRatio / 100) : 0;
    const excessSales = Math.max(0, actualSales - targetSales);
    const incentiveTotal = excessSales * (incentiveRatio / 100);

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        totalLaborCost,
        targetSales,
        actualSales,
        excessSales,
        incentiveTotal,
        distributedIncentive,
        laborCostRatio,
        incentiveRatio,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
