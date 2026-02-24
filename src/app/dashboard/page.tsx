"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast, ToastContainer } from "@/components/ui/toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SummaryData {
  year: number;
  month: number;
  totalLaborCost: number;
  actualSales: number;
  actualProfit: number;
  targetProfit: number;
  excessProfit: number;
  incentiveTotal: number;
  designTeamIncentive: number;
  fieldTeamIncentive: number;
  laborCostRatio: number;
  incentiveRatio: number;
  designTeamLaborCost: number;
  designTeamTargetProfit: number;
  designTeamExcessProfit: number;
  designTeamIncentiveRatio: number;
  designTeamLaborCostRatio: number;
  fieldTeamLaborCost: number;
  fieldTeamTargetProfit: number;
  fieldTeamExcessProfit: number;
  fieldTeamIncentiveRatio: number;
  fieldTeamLaborCostRatio: number;
  salesTeamLaborCost: number;
  salesTeamTargetProfit: number;
  salesTeamExcessProfit: number;
  salesTeamIncentiveRatio: number;
  salesTeamLaborCostRatio: number;
  salesTeamIncentive: number;
}

interface ChartItem {
  year: number;
  month: number;
  totalLaborCost: number;
  targetProfit: number;
  actualProfit: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismissToast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get<ApiResponse<SummaryData>>(
          `/api/dashboard/summary?year=${year}&month=${month}`
        );
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "요약 데이터를 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      }
    };

    fetchSummary();
  }, [year, month]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        setLoading(true);
        const res = await api.get<ApiResponse<ChartItem[]>>("/api/dashboard/chart");
        if (res.success && res.data) {
          setChartData(res.data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, []);

  const formattedChartData = chartData.map((item) => ({
    ...item,
    label: `${item.month}월`,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-2">
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </Select>
          <Select
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-24"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </Select>
        </div>
      </div>

      {summary && (
        <>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">월 인건비</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base md:text-xl font-bold">
                {summary.totalLaborCost.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">목표영업이익</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base md:text-xl font-bold">
                {Math.round(summary.targetProfit).toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">실제영업이익</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base md:text-xl font-bold">
                {summary.actualProfit.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">초과영업이익</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-xl font-bold ${
                  summary.excessProfit > 0
                    ? "text-green-500"
                    : summary.excessProfit < 0
                    ? "text-red-500"
                    : ""
                }`}
              >
                {Math.round(summary.excessProfit).toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">인센티브 총액</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base md:text-xl font-bold">
                {summary.incentiveTotal.toLocaleString()}원
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">디자인팀</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비율</span>
                <span className="font-bold">{summary.designTeamLaborCostRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비</span>
                <span className="font-bold">{summary.designTeamLaborCost.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">목표영업이익</span>
                <span className="font-bold">{Math.round(summary.designTeamTargetProfit).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">초과영업이익</span>
                <span className={`font-bold ${summary.designTeamExcessProfit > 0 ? "text-green-500" : ""}`}>
                  {Math.round(summary.designTeamExcessProfit).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인센티브</span>
                <span className="font-bold">{Math.round(summary.designTeamIncentive).toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">현장팀</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비율</span>
                <span className="font-bold">{summary.fieldTeamLaborCostRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비</span>
                <span className="font-bold">{summary.fieldTeamLaborCost.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">목표영업이익</span>
                <span className="font-bold">{Math.round(summary.fieldTeamTargetProfit).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">초과영업이익</span>
                <span className={`font-bold ${summary.fieldTeamExcessProfit > 0 ? "text-green-500" : ""}`}>
                  {Math.round(summary.fieldTeamExcessProfit).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인센티브</span>
                <span className="font-bold">{Math.round(summary.fieldTeamIncentive).toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">영업팀</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비율</span>
                <span className="font-bold">{summary.salesTeamLaborCostRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인건비</span>
                <span className="font-bold">{summary.salesTeamLaborCost.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">목표영업이익</span>
                <span className="font-bold">{Math.round(summary.salesTeamTargetProfit).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">초과영업이익</span>
                <span className={`font-bold ${summary.salesTeamExcessProfit > 0 ? "text-green-500" : ""}`}>
                  {Math.round(summary.salesTeamExcessProfit).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">인센티브</span>
                <span className="font-bold">{Math.round(summary.salesTeamIncentive).toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>최근 12개월 영업이익 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              로딩 중...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis
                  tickFormatter={(value: number) => value.toLocaleString()}
                />
                <Tooltip
                  formatter={(value: number | undefined) => (value ?? 0).toLocaleString() + "원"}
                />
                <Legend />
                <Bar dataKey="targetProfit" name="목표영업이익" fill="#d4c8bc" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualProfit" name="실제영업이익" fill="#a08d7d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
