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

    let query: string;
    let queryParams: (string | number)[];

    const teamFilter = searchParams.get("team");

    if (authUser.role === "admin" && teamFilter) {
      // admin이 특정 팀 필터 요청
      query = `
        SELECT mi.id, mi.user_id, mi.year, mi.month, mi.amount, mi.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_incentive mi
        JOIN users u ON mi.user_id = u.id
        WHERE mi.year = ? AND mi.month = ? AND u.team = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, teamFilter];
    } else if (authUser.role === "admin") {
      query = `
        SELECT mi.id, mi.user_id, mi.year, mi.month, mi.amount, mi.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_incentive mi
        JOIN users u ON mi.user_id = u.id
        WHERE mi.year = ? AND mi.month = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month];
    } else if (authUser.role === "team_leader" && authUser.team) {
      query = `
        SELECT mi.id, mi.user_id, mi.year, mi.month, mi.amount, mi.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_incentive mi
        JOIN users u ON mi.user_id = u.id
        WHERE mi.year = ? AND mi.month = ? AND u.team = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, authUser.team];
    } else {
      query = `
        SELECT mi.id, mi.user_id, mi.year, mi.month, mi.amount, mi.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_incentive mi
        JOIN users u ON mi.user_id = u.id
        WHERE mi.year = ? AND mi.month = ? AND mi.user_id = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, authUser.userId];
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Incentive GET error:", error);
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

    const { year, month, incentives } = await request.json();

    if (!year || !month || !Array.isArray(incentives) || incentives.length === 0) {
      return NextResponse.json(
        { success: false, error: "year, month, incentives 배열을 입력해주세요." },
        { status: 400 }
      );
    }

    const values = incentives.map((i: { user_id: number; amount: number }) => [
      i.user_id,
      year,
      month,
      i.amount,
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    await pool.query(
      `INSERT INTO monthly_incentive (user_id, year, month, amount)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      flatValues
    );

    return NextResponse.json({ success: true, data: { message: "인센티브가 저장되었습니다." } });
  } catch (error) {
    console.error("Incentive POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
