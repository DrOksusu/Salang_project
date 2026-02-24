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
        SELECT ms.id, ms.user_id, ms.year, ms.month, ms.amount, ms.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_salary ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.year = ? AND ms.month = ? AND u.team = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, teamFilter];
    } else if (authUser.role === "admin") {
      query = `
        SELECT ms.id, ms.user_id, ms.year, ms.month, ms.amount, ms.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_salary ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.year = ? AND ms.month = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month];
    } else if (authUser.role === "team_leader" && authUser.team) {
      query = `
        SELECT ms.id, ms.user_id, ms.year, ms.month, ms.amount, ms.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_salary ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.year = ? AND ms.month = ? AND u.team = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, authUser.team];
    } else {
      query = `
        SELECT ms.id, ms.user_id, ms.year, ms.month, ms.amount, ms.created_at,
               u.name AS user_name, u.email AS user_email
        FROM monthly_salary ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.year = ? AND ms.month = ? AND ms.user_id = ?
        ORDER BY u.name ASC
      `;
      queryParams = [year, month, authUser.userId];
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Salary GET error:", error);
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

    const { year, month, salaries } = await request.json();

    if (!year || !month || !Array.isArray(salaries) || salaries.length === 0) {
      return NextResponse.json(
        { success: false, error: "year, month, salaries 배열을 입력해주세요." },
        { status: 400 }
      );
    }

    const values = salaries.map((s: { user_id: number; amount: number }) => [
      s.user_id,
      year,
      month,
      s.amount,
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    await pool.query(
      `INSERT INTO monthly_salary (user_id, year, month, amount)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      flatValues
    );

    return NextResponse.json({ success: true, data: { message: "급여가 저장되었습니다." } });
  } catch (error) {
    console.error("Salary POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
