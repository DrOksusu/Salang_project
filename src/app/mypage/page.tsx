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

interface IncentiveRecord {
  id: number;
  user_id: number;
  year: number;
  month: number;
  amount: number;
}

export default function MyPage() {
  const router = useRouter();
  const now = new Date();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyIncentive, setMonthlyIncentive] = useState<{
    [month: number]: number | null;
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
        const data: { [month: number]: number | null } = {};
        for (let m = 1; m <= 12; m++) {
          data[m] = null;
        }

        const incentivePromises = Array.from({ length: 12 }, (_, i) =>
          api
            .get<{ success: boolean; data: IncentiveRecord[] }>(
              `/api/incentive?year=${year}&month=${i + 1}`
            )
            .catch(() => ({ success: false, data: [] as IncentiveRecord[] }))
        );

        const incentiveResults = await Promise.all(incentivePromises);

        incentiveResults.forEach((res, idx) => {
          const m = idx + 1;
          if (res.data && Array.isArray(res.data)) {
            const myRecord = res.data.find(
              (i) => Number(i.user_id) === user.id
            );
            if (myRecord) {
              data[m] = Number(myRecord.amount);
            }
          }
        });

        setMonthlyIncentive(data);
      } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, year]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const annualIncentive = Object.values(monthlyIncentive).reduce<number>(
    (sum, d) => sum + (d ?? 0),
    0
  );

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
                <TableHead className="text-right">인센티브</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const incentive = monthlyIncentive[m];

                return (
                  <TableRow key={m}>
                    <TableCell className="font-medium">{m}월</TableCell>
                    <TableCell className="text-right">
                      {incentive !== null
                        ? `${incentive.toLocaleString()}원`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Card>
            <CardHeader>
              <CardTitle>연간 인센티브 총계</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {annualIncentive.toLocaleString()}원
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
