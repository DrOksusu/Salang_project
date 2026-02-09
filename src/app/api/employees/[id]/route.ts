import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function PUT(
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
    const { name, role, position, hire_date, is_active, password } = await request.json();

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "직원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      values.push(role);
    }
    if (position !== undefined) {
      fields.push("position = ?");
      values.push(position);
    }
    if (hire_date !== undefined) {
      fields.push("hire_date = ?");
      values.push(hire_date);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active);
    }
    if (password) {
      const hashedPassword = await hashPassword(password);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "수정할 항목이 없습니다." },
        { status: 400 }
      );
    }

    values.push(id);
    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, role, position, hire_date, is_active FROM users WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Employees PUT error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "직원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await pool.query(
      "UPDATE users SET is_active = FALSE WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: { message: "직원이 비활성화되었습니다." } });
  } catch (error) {
    console.error("Employees DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
