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
  position?: string;
}

interface SalaryRecord {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
}

interface IncentiveRecord {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
}

interface MonthlyData {
  salary: number | null;
  incentive: number | null;
}

export default function MyPage() {
  const router = useRouter();
  const now = new Date();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState<{
    [month: number]: MonthlyData;
  }>({});
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismissToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserInfo }>(
          "/api/auth/me"
        );
        setUser(res.data);
      } catch {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchYearData = async () => {
      setLoading(true);
      try {
        const data: { [month: number]: MonthlyData } = {};
        for (let m = 1; m <= 12; m++) {
          data[m] = { salary: null, incentive: null };
        }

        const salaryPromises = Array.from({ length: 12 }, (_, i) =>
          api
            .get<{ success: boolean; data: SalaryRecord[] }>(
              `/api/salary?year=${year}&month=${i + 1}`
            )
            .catch(() => ({ success: false, data: [] as SalaryRecord[] }))
        );

        const incentivePromises = Array.from({ length: 12 }, (_, i) =>
          api
            .get<{ success: boolean; data: IncentiveRecord[] }>(
              `/api/incentive?year=${year}&month=${i + 1}`
            )
            .catch(() => ({ success: false, data: [] as IncentiveRecord[] }))
        );

        const [salaryResults, incentiveResults] = await Promise.all([
          Promise.all(salaryPromises),
          Promise.all(incentivePromises),
        ]);

        salaryResults.forEach((res, idx) => {
          const m = idx + 1;
          if (res.data && Array.isArray(res.data)) {
            const myRecord = res.data.find(
              (s) => Number(s.user_id) === user.id
            );
            if (myRecord) {
              data[m].salary = Number(myRecord.amount);
            }
          }
        });

        incentiveResults.forEach((res, idx) => {
          const m = idx + 1;
          if (res.data && Array.isArray(res.data)) {
            const myRecord = res.data.find(
              (i) => Number(i.user_id) === user.id
            );
            if (myRecord) {
              data[m].incentive = Number(myRecord.amount);
            }
          }
        });

        setMonthlyData(data);
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

    fetchYearData();
  }, [user, year]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const annualSalary = Object.values(monthlyData).reduce(
    (sum, d) => sum + (d.salary ?? 0),
    0
  );
  const annualIncentive = Object.values(monthlyData).reduce(
    (sum, d) => sum + (d.incentive ?? 0),
    0
  );
  const annualTotal = annualSalary + annualIncentive;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">마이페이지</h1>

      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">이름</p>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">직급</p>
              <p className="text-lg font-medium">{user.position ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {loading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : (
        <>
          <Table>
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
                const d = monthlyData[m];
                const salary = d?.salary;
                const incentive = d?.incentive;
                const hasData = salary !== null || incentive !== null;
                const total = (salary ?? 0) + (incentive ?? 0);

                return (
                  <TableRow key={m}>
                    <TableCell className="font-medium">{m}월</TableCell>
                    <TableCell className="text-right">
                      {salary !== null
                        ? `${salary.toLocaleString()}원`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {incentive !== null
                        ? `${incentive.toLocaleString()}원`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasData
                        ? `${total.toLocaleString()}원`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Card>
            <CardHeader>
              <CardTitle>연간 총계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">급여 합계</p>
                  <p className="text-xl font-bold">
                    {annualSalary.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">인센티브 합계</p>
                  <p className="text-xl font-bold">
                    {annualIncentive.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 합계</p>
                  <p className="text-xl font-bold">
                    {annualTotal.toLocaleString()}원
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
