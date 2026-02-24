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
      "SELECT labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio, field_team_labor_cost_ratio, design_team_incentive_ratio, field_team_incentive_ratio, sales_team_labor_cost_ratio, sales_team_incentive_ratio FROM settings LIMIT 1"
    );

    if (settingsRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "설정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const laborCostRatio = Number(settingsRows[0].labor_cost_ratio);
    const incentiveRatio = Number(settingsRows[0].incentive_ratio);
    const designTeamLaborCostRatio = Number(settingsRows[0].design_team_labor_cost_ratio);
    const fieldTeamLaborCostRatio = Number(settingsRows[0].field_team_labor_cost_ratio);
    const designTeamIncentiveRatio = Number(settingsRows[0].design_team_incentive_ratio);
    const fieldTeamIncentiveRatio = Number(settingsRows[0].field_team_incentive_ratio);
    const salesTeamLaborCostRatio = Number(settingsRows[0].sales_team_labor_cost_ratio);
    const salesTeamIncentiveRatio = Number(settingsRows[0].sales_team_incentive_ratio);

    // 해당 월 전체 급여 합산
    const [salaryRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM monthly_salary WHERE year = ? AND month = ?",
      [year, month]
    );
    const totalLaborCost = Number(salaryRows[0].total);

    // 해당 월 매출/영업이익 조회
    const [salesRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(amount, 0) AS amount, COALESCE(profit, 0) AS profit FROM monthly_sales WHERE year = ? AND month = ?",
      [year, month]
    );
    const actualSales = salesRows.length > 0 ? Number(salesRows[0].amount) : 0;
    const actualProfit = salesRows.length > 0 ? Number(salesRows[0].profit) : 0;

    // 해당 월 인센티브 배분 합산
    const [incentiveRows] = await pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM monthly_incentive WHERE year = ? AND month = ?",
      [year, month]
    );
    const distributedIncentive = Number(incentiveRows[0].total);

    // 팀별 급여 합산 쿼리
    const [teamSalaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.team, COALESCE(SUM(ms.amount), 0) AS total
       FROM monthly_salary ms
       JOIN users u ON ms.user_id = u.id
       WHERE ms.year = ? AND ms.month = ? AND u.team IN ('디자인팀', '현장팀', '영업팀')
       GROUP BY u.team`,
      [year, month]
    );

    let designTeamLaborCost = 0;
    let fieldTeamLaborCost = 0;
    let salesTeamLaborCost = 0;
    for (const row of teamSalaryRows) {
      if (row.team === '디자인팀') designTeamLaborCost = Number(row.total);
      if (row.team === '현장팀') fieldTeamLaborCost = Number(row.total);
      if (row.team === '영업팀') salesTeamLaborCost = Number(row.total);
    }

    // 전사 계산: 월 목표영업이익 = 월 인건비 / (인건비율/100)
    const targetProfit = laborCostRatio > 0 ? totalLaborCost / (laborCostRatio / 100) : 0;
    const excessProfit = Math.max(0, actualProfit - targetProfit);
    const incentiveTotal = excessProfit * (incentiveRatio / 100);

    // 팀별 인센티브 = 인센티브 총액 × (팀 인건비율 / 전체 인건비율)
    const designTeamIncentive = laborCostRatio > 0
      ? incentiveTotal * (designTeamLaborCostRatio / laborCostRatio)
      : 0;
    const fieldTeamIncentive = laborCostRatio > 0
      ? incentiveTotal * (fieldTeamLaborCostRatio / laborCostRatio)
      : 0;

    // 디자인팀 독립 계산
    const designTeamTargetProfit = designTeamLaborCostRatio > 0
      ? designTeamLaborCost / (designTeamLaborCostRatio / 100)
      : 0;
    const designTeamExcessProfit = Math.max(0, actualProfit - designTeamTargetProfit);
    const designTeamIndependentIncentive = designTeamExcessProfit * (designTeamIncentiveRatio / 100);

    // 현장팀 독립 계산
    const fieldTeamTargetProfit = fieldTeamLaborCostRatio > 0
      ? fieldTeamLaborCost / (fieldTeamLaborCostRatio / 100)
      : 0;
    const fieldTeamExcessProfit = Math.max(0, actualProfit - fieldTeamTargetProfit);
    const fieldTeamIndependentIncentive = fieldTeamExcessProfit * (fieldTeamIncentiveRatio / 100);

    // 영업팀 독립 계산
    const salesTeamTargetProfit = salesTeamLaborCostRatio > 0
      ? salesTeamLaborCost / (salesTeamLaborCostRatio / 100)
      : 0;
    const salesTeamExcessProfit = Math.max(0, actualProfit - salesTeamTargetProfit);
    const salesTeamIndependentIncentive = salesTeamExcessProfit * (salesTeamIncentiveRatio / 100);

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        totalLaborCost,
        actualSales,
        actualProfit,
        targetProfit,
        excessProfit,
        incentiveTotal,
        designTeamIncentive: designTeamIndependentIncentive,
        fieldTeamIncentive: fieldTeamIndependentIncentive,
        distributedIncentive,
        laborCostRatio,
        incentiveRatio,
        designTeamLaborCostRatio,
        fieldTeamLaborCostRatio,
        designTeamLaborCost,
        designTeamTargetProfit,
        designTeamExcessProfit,
        designTeamIncentiveRatio,
        fieldTeamLaborCost,
        fieldTeamTargetProfit,
        fieldTeamExcessProfit,
        fieldTeamIncentiveRatio,
        salesTeamLaborCost,
        salesTeamTargetProfit,
        salesTeamExcessProfit,
        salesTeamIncentiveRatio,
        salesTeamLaborCostRatio,
        salesTeamIncentive: salesTeamIndependentIncentive,
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
