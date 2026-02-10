"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast, ToastContainer } from "@/components/ui/toast";

const TEAMS = ["디자인팀", "현장팀", "경영진"] as const;

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string | null;
  team: string | null;
  role: "admin" | "employee";
  hire_date: string | null;
  is_active: boolean | number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  position: "",
  team: "",
  role: "employee" as "admin" | "employee",
  hire_date: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    position: "",
    team: "",
    role: "employee" as "admin" | "employee",
    hire_date: "",
  });
  const { toasts, toast, dismissToast } = useToast();

  const fetchEmployees = async () => {
    try {
      const res = await api.get<ApiResponse<Employee[]>>("/api/employees");
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "직원 목록을 불러올 수 없습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Employee>>("/api/employees", {
        name: form.name,
        email: form.email,
        password: form.password,
        position: form.position || null,
        team: form.team || null,
        role: form.role,
        hire_date: form.hire_date || null,
      });
      if (res.success) {
        toast({ title: "성공", description: "직원이 추가되었습니다." });
        setForm(initialForm);
        setShowForm(false);
        fetchEmployees();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "직원 추가에 실패했습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditForm({
      name: emp.name,
      position: emp.position || "",
      team: emp.team || "",
      role: emp.role,
      hire_date: emp.hire_date ? emp.hire_date.split("T")[0] : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await api.put<ApiResponse<Employee>>(`/api/employees/${id}`, {
        name: editForm.name,
        position: editForm.position || null,
        team: editForm.team || null,
        role: editForm.role,
        hire_date: editForm.hire_date || null,
      });
      if (res.success) {
        toast({ title: "성공", description: "직원 정보가 수정되었습니다." });
        setEditingId(null);
        fetchEmployees();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "직원 수정에 실패했습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`${name} 직원을 비활성화하시겠습니까?`)) return;

    try {
      const res = await api.delete<ApiResponse<{ message: string }>>(
        `/api/employees/${id}`
      );
      if (res.success) {
        toast({ title: "성공", description: "직원이 비활성화되었습니다." });
        fetchEmployees();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "비활성화에 실패했습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">직원 관리</h1>
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "닫기" : "직원 추가"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 직원 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="add-name">이름</Label>
                <Input
                  id="add-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="이름"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">이메일</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">비밀번호</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="비밀번호"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-position">직급</Label>
                <Input
                  id="add-position"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="직급"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-team">팀</Label>
                <Select
                  id="add-team"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                >
                  <option value="">선택</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">역할</Label>
                <Select
                  id="add-role"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as "admin" | "employee" })
                  }
                >
                  <option value="employee">직원</option>
                  <option value="admin">관리자</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-hire-date">입사일</Label>
                <Input
                  id="add-hire-date"
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "추가 중..." : "추가"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>팀</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>입사일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    등록된 직원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    {editingId === emp.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.email}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.position}
                            onChange={(e) =>
                              setEditForm({ ...editForm, position: e.target.value })
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={editForm.team}
                            onChange={(e) =>
                              setEditForm({ ...editForm, team: e.target.value })
                            }
                            className="h-8"
                          >
                            <option value="">선택</option>
                            {TEAMS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={editForm.role}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                role: e.target.value as "admin" | "employee",
                              })
                            }
                            className="h-8"
                          >
                            <option value="employee">직원</option>
                            <option value="admin">관리자</option>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={editForm.hire_date}
                            onChange={(e) =>
                              setEditForm({ ...editForm, hire_date: e.target.value })
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              emp.is_active ? "text-green-500" : "text-red-500"
                            }
                          >
                            {emp.is_active ? "활성" : "비활성"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(emp.id)}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              취소
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.position || "-"}</TableCell>
                        <TableCell>{emp.team || "-"}</TableCell>
                        <TableCell>
                          {emp.role === "admin" ? "관리자" : "직원"}
                        </TableCell>
                        <TableCell>{formatDate(emp.hire_date)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              emp.is_active ? "text-green-500" : "text-red-500"
                            }
                          >
                            {emp.is_active ? "활성" : "비활성"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(emp)}
                            >
                              수정
                            </Button>
                            {emp.is_active ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeactivate(emp.id, emp.name)}
                              >
                                비활성화
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
