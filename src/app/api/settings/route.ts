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

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio, field_team_labor_cost_ratio, updated_at FROM settings LIMIT 1"
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "설정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio, field_team_labor_cost_ratio } = await request.json();

    if (labor_cost_ratio == null || incentive_ratio == null) {
      return NextResponse.json(
        { success: false, error: "labor_cost_ratio와 incentive_ratio를 입력해주세요." },
        { status: 400 }
      );
    }

    await pool.query(
      "UPDATE settings SET labor_cost_ratio = ?, incentive_ratio = ?, design_team_labor_cost_ratio = ?, field_team_labor_cost_ratio = ?, updated_at = NOW() WHERE id = 1",
      [labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio ?? 20.00, field_team_labor_cost_ratio ?? 20.00]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, labor_cost_ratio, incentive_ratio, design_team_labor_cost_ratio, field_team_labor_cost_ratio, updated_at FROM settings WHERE id = 1"
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
