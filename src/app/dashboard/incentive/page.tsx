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
  is_active: boolean | number;
}

interface IncentiveRecord {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
  user_name: string;
}

interface SummaryData {
  totalLaborCost: number;
  laborCostRatio: number;
  incentiveRatio: number;
  targetSales: number;
  actualSales: number;
  excessSales: number;
  incentiveTotal: number;
  designTeamIncentive: number;
  fieldTeamIncentive: number;
  distributedIncentive: number;
  designTeamLaborCost: number;
  designTeamTargetSales: number;
  designTeamExcessSales: number;
  designTeamIncentiveRatio: number;
  fieldTeamLaborCost: number;
  fieldTeamTargetSales: number;
  fieldTeamExcessSales: number;
  fieldTeamIncentiveRatio: number;
  salesTeamLaborCost: number;
  salesTeamTargetSales: number;
  salesTeamExcessSales: number;
  salesTeamIncentiveRatio: number;
  salesTeamLaborCostRatio: number;
  salesTeamIncentive: number;
}

export default function IncentivePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incentives, setIncentives] = useState<{ [userId: number]: number }>(
    {}
  );
  const [incentiveTotal, setIncentiveTotal] = useState(0);
  const [designTeamIncentive, setDesignTeamIncentive] = useState(0);
  const [fieldTeamIncentive, setFieldTeamIncentive] = useState(0);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, dismissToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, empRes, incentiveRes] = await Promise.all([
        api.get<{ success: boolean; data: SummaryData }>(
          `/api/dashboard/summary?year=${year}&month=${month}`
        ),
        api.get<{ success: boolean; data: Employee[] }>("/api/employees"),
        api.get<{ success: boolean; data: IncentiveRecord[] }>(
          `/api/incentive?year=${year}&month=${month}`
        ),
      ]);

      setSummaryData(summaryRes.data);
      setIncentiveTotal(Math.round(summaryRes.data.incentiveTotal));
      setDesignTeamIncentive(Math.round(summaryRes.data.designTeamIncentive));
      setFieldTeamIncentive(Math.round(summaryRes.data.fieldTeamIncentive));

      const activeEmployees = empRes.data.filter(
        (e) => e.is_active === true || e.is_active === 1
      );
      setEmployees(activeEmployees);

      const incentiveMap: { [userId: number]: number } = {};
      activeEmployees.forEach((e) => {
        incentiveMap[e.id] = 0;
      });
      incentiveRes.data.forEach((i) => {
        incentiveMap[i.user_id] = Number(i.amount);
      });
      setIncentives(incentiveMap);
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

  const handleIncentiveChange = (userId: number, value: string) => {
    setIncentives((prev) => ({
      ...prev,
      [userId]: Number(value) || 0,
    }));
  };

  const distributedTotal = Object.values(incentives).reduce(
    (sum, v) => sum + v,
    0
  );
  const remaining = incentiveTotal - distributedTotal;
  const isOverDistributed = distributedTotal > incentiveTotal;

  const handleSave = async () => {
    if (isOverDistributed) {
      alert("배분 합계가 인센티브 총액을 초과할 수 없습니다.");
      return;
    }

    try {
      const incentiveArray = Object.entries(incentives).map(
        ([userId, amount]) => ({
          user_id: Number(userId),
          amount,
        })
      );

      await api.post("/api/incentive", {
        year,
        month,
        incentives: incentiveArray,
      });

      toast({
        title: "저장 완료",
        description: "인센티브가 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "인센티브 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">인센티브 배분</h1>

      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">연도</label>
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 md:w-28"
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
            className="w-20 md:w-24"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>인센티브 총액</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {incentiveTotal.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">디자인팀</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인건비</span>
                  <span className="font-bold">{(summaryData?.designTeamLaborCost ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">목표매출</span>
                  <span className="font-bold">{Math.round(summaryData?.designTeamTargetSales ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">초과매출</span>
                  <span className={`font-bold ${(summaryData?.designTeamExcessSales ?? 0) > 0 ? "text-green-500" : ""}`}>
                    {Math.round(summaryData?.designTeamExcessSales ?? 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인센티브</span>
                  <span className="font-bold">{designTeamIncentive.toLocaleString()}원</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">현장팀</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인건비</span>
                  <span className="font-bold">{(summaryData?.fieldTeamLaborCost ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">목표매출</span>
                  <span className="font-bold">{Math.round(summaryData?.fieldTeamTargetSales ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">초과매출</span>
                  <span className={`font-bold ${(summaryData?.fieldTeamExcessSales ?? 0) > 0 ? "text-green-500" : ""}`}>
                    {Math.round(summaryData?.fieldTeamExcessSales ?? 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인센티브</span>
                  <span className="font-bold">{fieldTeamIncentive.toLocaleString()}원</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">영업팀</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인건비</span>
                  <span className="font-bold">{(summaryData?.salesTeamLaborCost ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">목표매출</span>
                  <span className="font-bold">{Math.round(summaryData?.salesTeamTargetSales ?? 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">초과매출</span>
                  <span className={`font-bold ${(summaryData?.salesTeamExcessSales ?? 0) > 0 ? "text-green-500" : ""}`}>
                    {Math.round(summaryData?.salesTeamExcessSales ?? 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인센티브</span>
                  <span className="font-bold">{Math.round(summaryData?.salesTeamIncentive ?? 0).toLocaleString()}원</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>직원명</TableHead>
                <TableHead>인센티브</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={incentives[emp.id] ?? 0}
                      onChange={(e) =>
                        handleIncentiveChange(emp.id, e.target.value)
                      }
                      className="w-32 md:w-48"
                      min={0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">배분 합계:</span>
              <span className="text-lg font-bold">
                {distributedTotal.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">미배분 잔액:</span>
              <span className="text-lg font-bold">
                {remaining.toLocaleString()}원
              </span>
            </div>
            {isOverDistributed && (
              <p className="text-red-600 font-semibold">
                배분 합계가 인센티브 총액을 초과했습니다!
              </p>
            )}
          </div>

          <Button onClick={handleSave}>저장</Button>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
