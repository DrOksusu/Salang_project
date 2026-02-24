"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string | null;
}

interface SummaryData {
  totalLaborCost: number;
  actualSales: number;
  actualProfit: number;
  targetProfit: number;
  excessProfit: number;
  incentiveTotal: number;
  designTeamLaborCost: number;
  designTeamTargetProfit: number;
  designTeamExcessProfit: number;
  designTeamIncentive: number;
  designTeamLaborCostRatio: number;
  fieldTeamLaborCost: number;
  fieldTeamTargetProfit: number;
  fieldTeamExcessProfit: number;
  fieldTeamIncentive: number;
  fieldTeamLaborCostRatio: number;
  salesTeamLaborCost: number;
  salesTeamTargetProfit: number;
  salesTeamExcessProfit: number;
  salesTeamIncentive: number;
  salesTeamLaborCostRatio: number;
}

interface SalaryRecord {
  user_id: number;
  user_name: string;
  amount: number;
}

interface IncentiveRecord {
  user_id: number;
  user_name: string;
  amount: number;
}

// 팀 이름 → summary 필드 매핑
function getTeamData(team: string, summary: SummaryData) {
  switch (team) {
    case "디자인팀":
      return {
        laborCost: summary.designTeamLaborCost,
        laborCostRatio: summary.designTeamLaborCostRatio,
        targetProfit: summary.designTeamTargetProfit,
        excessProfit: summary.designTeamExcessProfit,
        incentive: summary.designTeamIncentive,
      };
    case "현장팀":
      return {
        laborCost: summary.fieldTeamLaborCost,
        laborCostRatio: summary.fieldTeamLaborCostRatio,
        targetProfit: summary.fieldTeamTargetProfit,
        excessProfit: summary.fieldTeamExcessProfit,
        incentive: summary.fieldTeamIncentive,
      };
    case "영업팀":
      return {
        laborCost: summary.salesTeamLaborCost,
        laborCostRatio: summary.salesTeamLaborCostRatio,
        targetProfit: summary.salesTeamTargetProfit,
        excessProfit: summary.salesTeamExcessProfit,
        incentive: summary.salesTeamIncentive,
      };
    default:
      return null;
  }
}

const TEAMS = ["디자인팀", "현장팀", "영업팀"] as const;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function TeamPage() {
  const router = useRouter();
  const now = new Date();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [incentives, setIncentives] = useState<IncentiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismissToast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const isAdmin = user?.role === "admin";
  // 현재 보고 있는 팀: admin이면 선택된 팀, team_leader면 본인 팀
  const currentTeam = isAdmin ? selectedTeam : user?.team || "";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserInfo }>("/api/auth/me");
        setUser(res.data);
        // admin이면 첫 번째 팀을 기본 선택
        if (res.data.role === "admin") {
          setSelectedTeam(TEAMS[0]);
        }
      } catch {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user || !currentTeam) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const teamParam = isAdmin ? `&team=${encodeURIComponent(currentTeam)}` : "";
        const [summaryRes, salaryRes, incentiveRes] = await Promise.all([
          api.get<ApiResponse<SummaryData>>(
            `/api/dashboard/summary?year=${year}&month=${month}`
          ),
          api.get<ApiResponse<SalaryRecord[]>>(
            `/api/salary?year=${year}&month=${month}${teamParam}`
          ),
          api.get<ApiResponse<IncentiveRecord[]>>(
            `/api/incentive?year=${year}&month=${month}${teamParam}`
          ),
        ]);

        if (summaryRes.success && summaryRes.data) {
          setSummary(summaryRes.data);
        }
        // admin은 전체 데이터를 받으므로 선택 팀으로 필터
        if (salaryRes.success && salaryRes.data) {
          setSalaries(salaryRes.data);
        }
        if (incentiveRes.success && incentiveRes.data) {
          setIncentives(incentiveRes.data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentTeam, year, month]);

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (!isAdmin && !user.team) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        팀이 지정되지 않았습니다. 관리자에게 문의하세요.
      </div>
    );
  }

  const teamData = summary && currentTeam ? getTeamData(currentTeam, summary) : null;

  // 팀원별 급여/인센티브 합산 테이블 데이터
  const memberMap = new Map<number, { name: string; salary: number; incentive: number }>();
  salaries.forEach((s) => {
    const existing = memberMap.get(s.user_id) || { name: s.user_name, salary: 0, incentive: 0 };
    existing.salary = Number(s.amount);
    memberMap.set(s.user_id, existing);
  });
  incentives.forEach((i) => {
    const existing = memberMap.get(i.user_id) || { name: i.user_name, salary: 0, incentive: 0 };
    existing.incentive = Number(i.amount);
    memberMap.set(i.user_id, existing);
  });
  const members = Array.from(memberMap.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">{currentTeam} 현황</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-28"
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          )}
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
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      ) : (
        <>
          {teamData && (
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">인건비</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base md:text-xl font-bold">
                    {teamData.laborCost.toLocaleString()}원
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">인건비율</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base md:text-xl font-bold">
                    {teamData.laborCostRatio}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">목표영업이익</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base md:text-xl font-bold">
                    {Math.round(teamData.targetProfit).toLocaleString()}원
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">초과영업이익</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-base md:text-xl font-bold ${teamData.excessProfit > 0 ? "text-green-500" : ""}`}>
                    {Math.round(teamData.excessProfit).toLocaleString()}원
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">인센티브</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base md:text-xl font-bold">
                    {Math.round(teamData.incentive).toLocaleString()}원
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>팀원별 급여/인센티브</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead className="text-right">급여</TableHead>
                    <TableHead className="text-right">인센티브</TableHead>
                    <TableHead className="text-right">합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        해당 월 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-right">
                          {m.salary ? `${m.salary.toLocaleString()}원` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.incentive ? `${m.incentive.toLocaleString()}원` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(m.salary + m.incentive).toLocaleString()}원
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
