"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast, ToastContainer } from "@/components/ui/toast";
import {
  PieChart,
  Pie,
  Cell,
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 따뜻한 베이지/갈색 계열 컬러 팔레트
const COLORS = {
  laborCost: "#a08d7d",    // 인건비 (프라이머리)
  targetProfit: "#d4c8bc", // 목표영업이익
  actualProfit: "#8b7355", // 실제영업이익
  excessProfit: "#6b8e6b", // 초과영업이익 (초록 계열)
  incentive: "#c4956a",    // 인센티브
  remaining: "#e8e0d8",    // 미달성 영역
};


export default function ProfitPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismissToast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get<ApiResponse<SummaryData>>(
          `/api/dashboard/summary?year=${year}&month=${month}`
        );
        if (res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // 달성률 계산
  const achievementRate =
    summary && summary.targetProfit > 0
      ? Math.round((summary.actualProfit / summary.targetProfit) * 100)
      : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">영업이익 현황</h1>
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

      {loading ? (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      ) : summary ? (
        <>
          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: COLORS.laborCost }} />
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">월 인건비</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-xl font-bold">
                  {summary.totalLaborCost.toLocaleString()}원
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: COLORS.targetProfit }} />
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">목표영업이익</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-xl font-bold">
                  {Math.round(summary.targetProfit).toLocaleString()}원
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: COLORS.actualProfit }} />
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">실제영업이익</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base md:text-xl font-bold">
                  {summary.actualProfit.toLocaleString()}원
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{
                  backgroundColor:
                    summary.excessProfit > 0 ? COLORS.excessProfit : COLORS.remaining,
                }}
              />
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">초과영업이익</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-base md:text-xl font-bold ${
                    summary.excessProfit > 0 ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {Math.round(summary.excessProfit).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 목표 달성률 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">목표 달성률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "달성",
                              value: Math.min(achievementRate, 100),
                              fill: achievementRate >= 100 ? COLORS.excessProfit : COLORS.actualProfit,
                            },
                            {
                              name: "미달성",
                              value: Math.max(0, 100 - achievementRate),
                              fill: COLORS.remaining,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={achievementRate >= 100 ? COLORS.excessProfit : COLORS.actualProfit} />
                          <Cell fill={COLORS.remaining} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* 중앙 텍스트 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-3xl font-bold ${
                          achievementRate >= 100 ? "text-green-600" : "text-foreground"
                        }`}
                      >
                        {achievementRate}%
                      </span>
                      <span className="text-xs text-muted-foreground">달성률</span>
                    </div>
                  </div>
                  <div className="mt-2 grid w-full grid-cols-2 gap-2 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground">목표</p>
                      <p className="font-semibold">
                        {Math.round(summary.targetProfit).toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">실제</p>
                      <p className="font-semibold">
                        {summary.actualProfit.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      ) : (
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          데이터가 없습니다
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
