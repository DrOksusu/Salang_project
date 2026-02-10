"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useToast, ToastContainer } from "@/components/ui/toast";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  position: string | null;
  team: string | null;
  is_active: boolean | number;
}

interface SalaryRecord {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
  user_name: string;
}

interface Settings {
  id: number;
  labor_cost_ratio: number;
  incentive_ratio: number;
}

export default function SalaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<{ [userId: number]: number }>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, dismissToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, salaryRes, settingsRes] = await Promise.all([
        api.get<{ success: boolean; data: Employee[] }>("/api/employees"),
        api.get<{ success: boolean; data: SalaryRecord[] }>(
          `/api/salary?year=${year}&month=${month}`
        ),
        api.get<{ success: boolean; data: Settings }>("/api/settings"),
      ]);

      const activeEmployees = empRes.data.filter(
        (e) => e.is_active === true || e.is_active === 1
      );
      setEmployees(activeEmployees);
      setSettings(settingsRes.data);

      const salaryMap: { [userId: number]: number } = {};
      activeEmployees.forEach((e) => {
        salaryMap[e.id] = 0;
      });
      salaryRes.data.forEach((s) => {
        salaryMap[s.user_id] = Number(s.amount);
      });
      setSalaries(salaryMap);
    } catch (error) {
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const handleSalaryChange = (userId: number, value: string) => {
    setSalaries((prev) => ({
      ...prev,
      [userId]: Number(value) || 0,
    }));
  };

  const totalLaborCost = Object.values(salaries).reduce(
    (sum, v) => sum + v,
    0
  );
  const laborCostRatio = settings?.labor_cost_ratio ?? 0;
  const targetSales =
    laborCostRatio > 0 ? totalLaborCost / (laborCostRatio / 100) : 0;

  // 팀별 그룹핑
  const teamGroups = employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    const team = emp.team || "미지정";
    if (!acc[team]) acc[team] = [];
    acc[team].push(emp);
    return acc;
  }, {});

  const teamNames = Object.keys(teamGroups);

  const getTeamTotal = (team: string) =>
    teamGroups[team].reduce((sum, emp) => sum + (salaries[emp.id] ?? 0), 0);

  const handleSave = async () => {
    try {
      const salaryArray = Object.entries(salaries).map(([userId, amount]) => ({
        user_id: Number(userId),
        amount,
      }));

      await api.post("/api/salary", {
        year,
        month,
        salaries: salaryArray,
      });

      toast({ title: "저장 완료", description: "급여가 저장되었습니다." });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "급여 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">급여 관리</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">연도</label>
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">월</label>
          <Select
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-24"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>직원명</TableHead>
                <TableHead>급여</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamNames.map((team) => (
                <>
                  <TableRow key={`team-${team}`} className="bg-muted/50">
                    <TableCell colSpan={2} className="font-bold text-sm">
                      {team}
                    </TableCell>
                  </TableRow>
                  {teamGroups[team].map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium pl-6">{emp.name}</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={(salaries[emp.id] ?? 0).toLocaleString()}
                          onChange={(e) =>
                            handleSalaryChange(emp.id, e.target.value.replace(/,/g, ""))
                          }
                          className="w-48"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow key={`subtotal-${team}`} className="border-b-2">
                    <TableCell className="pl-6 text-sm font-semibold text-muted-foreground">
                      {team} 소계
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {getTeamTotal(team).toLocaleString()}원
                    </TableCell>
                  </TableRow>
                </>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-bold">전체 합계</TableCell>
                <TableCell className="font-bold">
                  {totalLaborCost.toLocaleString()}원
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">월 인건비 합계</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {totalLaborCost.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">인건비율</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{laborCostRatio}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">월 목표매출</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(targetSales).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSave}>저장</Button>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
