"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast, ToastContainer } from "@/components/ui/toast";

interface SalesData {
  id: number;
  year: number;
  month: number;
  amount: number;
}

interface Settings {
  id: number;
  labor_cost_ratio: number;
  incentive_ratio: number;
}

interface SummaryData {
  totalLaborCost: number;
  laborCostRatio: number;
  incentiveRatio: number;
  targetSales: number;
  actualSales: number;
  excessSales: number;
  incentiveTotal: number;
}

export default function SalesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [actualSales, setActualSales] = useState(0);
  const [totalLaborCost, setTotalLaborCost] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, dismissToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, summaryRes, settingsRes] = await Promise.all([
        api.get<{ success: boolean; data: SalesData | null }>(
          `/api/sales?year=${year}&month=${month}`
        ),
        api.get<{ success: boolean; data: SummaryData }>(
          `/api/dashboard/summary?year=${year}&month=${month}`
        ),
        api.get<{ success: boolean; data: Settings }>("/api/settings"),
      ]);

      if (salesRes.data) {
        setActualSales(Number(salesRes.data.amount));
      } else {
        setActualSales(0);
      }

      setTotalLaborCost(Number(summaryRes.data.totalLaborCost));
      setSettings(settingsRes.data);
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

  const laborCostRatio = settings ? Number(settings.labor_cost_ratio) : 0;
  const incentiveRatio = settings ? Number(settings.incentive_ratio) : 0;
  const targetSales =
    laborCostRatio > 0 ? totalLaborCost / (laborCostRatio / 100) : 0;
  const excessSales = actualSales - targetSales;
  const incentiveTotal = Math.max(0, excessSales) * (incentiveRatio / 100);

  const handleSave = async () => {
    try {
      await api.post("/api/sales", {
        year,
        month,
        amount: actualSales,
      });

      toast({ title: "저장 완료", description: "매출이 저장되었습니다." });
      fetchData();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "매출 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">매출 관리</h1>

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
          <Card>
            <CardHeader>
              <CardTitle>실제매출 입력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={actualSales.toLocaleString()}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    setActualSales(Number(raw) || 0);
                  }}
                  className="w-64 text-lg font-bold h-12"
                />
                <span className="text-lg">원</span>
                <Button onClick={handleSave}>저장</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">월 인건비</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {totalLaborCost.toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">인건비율</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{laborCostRatio}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">월 목표매출</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {Math.round(targetSales).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">초과매출</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-xl font-bold ${
                    excessSales >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.round(excessSales).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">인센티브 총액</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {Math.round(incentiveTotal).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
