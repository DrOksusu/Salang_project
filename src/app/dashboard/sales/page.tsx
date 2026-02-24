"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast, ToastContainer } from "@/components/ui/toast";

interface SalesEntry {
  id: number;
  year: number;
  month: number;
  sale_date: string;
  amount: number;
  profit: number;
  description: string | null;
  created_at: string;
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
  actualSales: number;
  actualProfit: number;
  targetProfit: number;
  excessProfit: number;
  incentiveTotal: number;
  designTeamIncentive: number;
  fieldTeamIncentive: number;
  designTeamLaborCost: number;
  designTeamTargetProfit: number;
  designTeamExcessProfit: number;
  designTeamIncentiveRatio: number;
  fieldTeamLaborCost: number;
  fieldTeamTargetProfit: number;
  fieldTeamExcessProfit: number;
  fieldTeamIncentiveRatio: number;
  salesTeamLaborCost: number;
  salesTeamTargetProfit: number;
  salesTeamExcessProfit: number;
  salesTeamIncentiveRatio: number;
  salesTeamLaborCostRatio: number;
  salesTeamIncentive: number;
}

export default function SalesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, dismissToast } = useToast();

  // 입력 폼 상태
  const [saleDate, setSaleDate] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [saleProfit, setSaleProfit] = useState("");
  const [saleDescription, setSaleDescription] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, summaryRes, settingsRes] = await Promise.all([
        api.get<{
          success: boolean;
          data: { entries: SalesEntry[]; totalAmount: number; totalProfit: number };
        }>(`/api/sales?year=${year}&month=${month}`),
        api.get<{ success: boolean; data: SummaryData }>(
          `/api/dashboard/summary?year=${year}&month=${month}`
        ),
        api.get<{ success: boolean; data: Settings }>("/api/settings"),
      ]);

      setEntries(salesRes.data.entries);
      setTotalAmount(salesRes.data.totalAmount);
      setTotalProfit(salesRes.data.totalProfit);
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

  // 연/월 변경 시 날짜 입력 기본값 설정
  useEffect(() => {
    const defaultDate = `${year}-${String(month).padStart(2, "0")}-01`;
    setSaleDate(defaultDate);
  }, [year, month]);

  const totalLaborCost = summaryData?.totalLaborCost ?? 0;
  const laborCostRatio = summaryData?.laborCostRatio ?? 0;
  const targetProfit = summaryData?.targetProfit ?? 0;
  const excessProfit = summaryData?.excessProfit ?? 0;
  const incentiveTotal = summaryData?.incentiveTotal ?? 0;

  const handleAdd = async () => {
    if (!saleDate || !saleAmount) {
      toast({
        title: "입력 오류",
        description: "날짜와 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = Number(saleAmount.replace(/,/g, ""));
    if (isNaN(amountNum) || amountNum === 0) {
      toast({
        title: "입력 오류",
        description: "유효한 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const profitNum = Number(saleProfit.replace(/,/g, "")) || 0;

    try {
      await api.post("/api/sales", {
        sale_date: saleDate,
        amount: amountNum,
        profit: profitNum,
        description: saleDescription || undefined,
      });

      toast({ title: "추가 완료", description: "매출이 추가되었습니다." });
      setSaleAmount("");
      setSaleProfit("");
      setSaleDescription("");
      fetchData();
    } catch (error) {
      toast({
        title: "추가 실패",
        description: "매출 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 매출 건을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/api/sales/${id}`);
      toast({ title: "삭제 완료", description: "매출이 삭제되었습니다." });
      fetchData();
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "매출 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - 2 + i
  );
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
          {/* 매출 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>매출 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">날짜</label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-muted-foreground">
                    금액 (원)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="금액 입력"
                    value={saleAmount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || !isNaN(Number(raw))) {
                        setSaleAmount(
                          raw === "" ? "" : Number(raw).toLocaleString()
                        );
                      }
                    }}
                    className="sm:max-w-48"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-muted-foreground">
                    영업이익금 (원)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="영업이익금 입력"
                    value={saleProfit}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "" || !isNaN(Number(raw))) {
                        setSaleProfit(
                          raw === "" ? "" : Number(raw).toLocaleString()
                        );
                      }
                    }}
                    className="sm:max-w-48"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-muted-foreground">
                    메모 (선택)
                  </label>
                  <Input
                    type="text"
                    placeholder="메모"
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value)}
                    className="sm:max-w-48"
                  />
                </div>
                <Button onClick={handleAdd}>추가</Button>
              </div>
            </CardContent>
          </Card>

          {/* 매출 내역 테이블 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>매출 내역</CardTitle>
                <div className="flex gap-4 text-sm sm:text-lg font-bold">
                  <span>총 매출 {totalAmount.toLocaleString()}원</span>
                  <span className="text-blue-600">영업이익 {totalProfit.toLocaleString()}원</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  등록된 매출이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">날짜</th>
                        <th className="text-right py-2 px-2">금액</th>
                        <th className="text-right py-2 px-2">영업이익금</th>
                        <th className="text-left py-2 px-2">메모</th>
                        <th className="text-center py-2 px-2 w-16">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2 px-2">
                            {formatDate(entry.sale_date)}
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {Number(entry.amount).toLocaleString()}원
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {Number(entry.profit).toLocaleString()}원
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {entry.description || "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 요약 카드 5개 */}
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
                <CardTitle className="text-sm">목표영업이익</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {Math.round(targetProfit).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">초과영업이익</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-xl font-bold ${
                    excessProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.round(excessProfit).toLocaleString()}원
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

          {/* 팀별 카드 3개 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  디자인팀
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">인건비</span>
                  <span className="font-bold">
                    {(
                      summaryData?.designTeamLaborCost ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    목표영업이익
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.designTeamTargetProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    초과영업이익
                  </span>
                  <span
                    className={`font-bold ${
                      (summaryData?.designTeamExcessProfit ?? 0) > 0
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {Math.round(
                      summaryData?.designTeamExcessProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    인센티브
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.designTeamIncentive ?? 0
                    ).toLocaleString()}
                    원
                  </span>
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
                  <span className="font-bold">
                    {(
                      summaryData?.fieldTeamLaborCost ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    목표영업이익
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.fieldTeamTargetProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    초과영업이익
                  </span>
                  <span
                    className={`font-bold ${
                      (summaryData?.fieldTeamExcessProfit ?? 0) > 0
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {Math.round(
                      summaryData?.fieldTeamExcessProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    인센티브
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.fieldTeamIncentive ?? 0
                    ).toLocaleString()}
                    원
                  </span>
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
                  <span className="font-bold">
                    {(
                      summaryData?.salesTeamLaborCost ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    목표영업이익
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.salesTeamTargetProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    초과영업이익
                  </span>
                  <span
                    className={`font-bold ${
                      (summaryData?.salesTeamExcessProfit ?? 0) > 0
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {Math.round(
                      summaryData?.salesTeamExcessProfit ?? 0
                    ).toLocaleString()}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    인센티브
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      summaryData?.salesTeamIncentive ?? 0
                    ).toLocaleString()}
                    원
                  </span>
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
