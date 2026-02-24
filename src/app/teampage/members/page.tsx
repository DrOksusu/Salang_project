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

interface SalaryRecord {
  user_id: number;
  user_name: string;
  year: number;
  month: number;
  amount: number;
}

interface IncentiveRecord {
  user_id: number;
  user_name: string;
  year: number;
  month: number;
  amount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MemberYearData {
  name: string;
  months: { [month: number]: { salary: number; incentive: number } };
  totalSalary: number;
  totalIncentive: number;
}

const TEAMS = ["디자인팀", "현장팀", "영업팀"] as const;

export default function TeamMembersPage() {
  const router = useRouter();
  const now = new Date();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [memberData, setMemberData] = useState<Map<number, MemberYearData>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismissToast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const isAdmin = user?.role === "admin";
  const currentTeam = isAdmin ? selectedTeam : user?.team || "";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserInfo }>("/api/auth/me");
        setUser(res.data);
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

    const fetchYearData = async () => {
      setLoading(true);
      try {
        // 12개월 급여/인센티브 병렬 조회
        const teamParam = isAdmin ? `&team=${encodeURIComponent(currentTeam)}` : "";
        const salaryPromises = Array.from({ length: 12 }, (_, i) =>
          api
            .get<ApiResponse<SalaryRecord[]>>(`/api/salary?year=${year}&month=${i + 1}${teamParam}`)
            .catch(() => ({ success: false, data: [] as SalaryRecord[] }))
        );
        const incentivePromises = Array.from({ length: 12 }, (_, i) =>
          api
            .get<ApiResponse<IncentiveRecord[]>>(`/api/incentive?year=${year}&month=${i + 1}${teamParam}`)
            .catch(() => ({ success: false, data: [] as IncentiveRecord[] }))
        );

        const [salaryResults, incentiveResults] = await Promise.all([
          Promise.all(salaryPromises),
          Promise.all(incentivePromises),
        ]);

        const dataMap = new Map<number, MemberYearData>();

        salaryResults.forEach((res, idx) => {
          const m = idx + 1;
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((s) => {
              if (!dataMap.has(s.user_id)) {
                dataMap.set(s.user_id, {
                  name: s.user_name,
                  months: {},
                  totalSalary: 0,
                  totalIncentive: 0,
                });
              }
              const member = dataMap.get(s.user_id)!;
              if (!member.months[m]) {
                member.months[m] = { salary: 0, incentive: 0 };
              }
              member.months[m].salary = Number(s.amount);
              member.totalSalary += Number(s.amount);
            });
          }
        });

        incentiveResults.forEach((res, idx) => {
          const m = idx + 1;
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((i) => {
              if (!dataMap.has(i.user_id)) {
                dataMap.set(i.user_id, {
                  name: i.user_name,
                  months: {},
                  totalSalary: 0,
                  totalIncentive: 0,
                });
              }
              const member = dataMap.get(i.user_id)!;
              if (!member.months[m]) {
                member.months[m] = { salary: 0, incentive: 0 };
              }
              member.months[m].incentive = Number(i.amount);
              member.totalIncentive += Number(i.amount);
            });
          }
        });

        setMemberData(dataMap);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.";
        toast({ title: "오류", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchYearData();
  }, [user, currentTeam, year]);

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

  const membersArray = Array.from(memberData.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">{currentTeam} 팀원 상세</h1>
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
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      ) : membersArray.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          해당 연도 데이터가 없습니다.
        </div>
      ) : (
        membersArray.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{member.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  연간 합계: {(member.totalSalary + member.totalIncentive).toLocaleString()}원
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>월</TableHead>
                    <TableHead className="text-right">급여</TableHead>
                    <TableHead className="text-right">인센티브</TableHead>
                    <TableHead className="text-right">합계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = i + 1;
                    const d = member.months[m];
                    const salary = d?.salary ?? 0;
                    const incentive = d?.incentive ?? 0;
                    const hasData = d !== undefined;

                    return (
                      <TableRow key={m}>
                        <TableCell className="font-medium">{m}월</TableCell>
                        <TableCell className="text-right">
                          {hasData && salary ? `${salary.toLocaleString()}원` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasData && incentive ? `${incentive.toLocaleString()}원` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasData ? `${(salary + incentive).toLocaleString()}원` : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>합계</TableCell>
                    <TableCell className="text-right">
                      {member.totalSalary.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {member.totalIncentive.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(member.totalSalary + member.totalIncentive).toLocaleString()}원
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
