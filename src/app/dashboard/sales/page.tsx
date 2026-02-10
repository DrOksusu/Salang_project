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
  design_team_labor_cost_ratio: number;
  field_team_labor_cost_ratio: number;
  design_team_incentive_ratio: number;
  field_team_incentive_ratio: number;
  sales_team_labor_cost_ratio: number;
  sales_team_incentive_ratio: number;
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

export default function SalesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [actualSales, setActualSales] = useState(0);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
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

      setSummaryData(summaryRes.data);
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

  const totalLaborCost = summaryData?.totalLaborCost ?? 0;
  const laborCostRatio = summaryData?.laborCostRatio ?? 0;
  const targetSales = summaryData?.targetSales ?? 0;
  const excessSales = summaryData?.excessSales ?? 0;
  const incentiveTotal = summaryData?.incentiveTotal ?? 0;

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
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">매출 관리</h1>

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
          <Card>
            <CardHeader>
              <CardTitle>실제매출 입력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={actualSales.toLocaleString()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      setActualSales(Number(raw) || 0);
                    }}
                    className="flex-1 sm:max-w-64 text-lg font-bold h-12"
                  />
                  <span className="text-lg">원</span>
                </div>
                <Button onClick={handleSave}>저장</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-5">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <span className={`font-bold ${(summaryData?.designTeamExcessSales ?? 0) > 0 ? "text-green-600" : ""}`}>
                    {Math.round(summaryData?.designTeamExcessSales ?? 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인센티브</span>
                  <span className="font-bold">{Math.round(summaryData?.designTeamIncentive ?? 0).toLocaleString()}원</span>
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
                  <span className={`font-bold ${(summaryData?.fieldTeamExcessSales ?? 0) > 0 ? "text-green-600" : ""}`}>
                    {Math.round(summaryData?.fieldTeamExcessSales ?? 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인센티브</span>
                  <span className="font-bold">{Math.round(summaryData?.fieldTeamIncentive ?? 0).toLocaleString()}원</span>
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
                  <span className={`font-bold ${(summaryData?.salesTeamExcessSales ?? 0) > 0 ? "text-green-600" : ""}`}>
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
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
