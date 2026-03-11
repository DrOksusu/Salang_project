"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: "admin" | "team_leader" | "employee";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        const userInfo: UserInfo = data.data ?? data;

        // /dashboard/profit, /dashboard/shared 경로는 비관리자(employee, team_leader)도 접근 허용
        const publicPaths = ["/dashboard/profit", "/dashboard/shared"];
        if (!publicPaths.includes(pathname)) {
          if (userInfo.role === "employee") {
            router.push("/mypage");
            return;
          }
          if (userInfo.role === "team_leader") {
            router.push("/teampage");
            return;
          }
        }

        setUser(userInfo);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar role={user?.role} />
      <main className="flex-1 overflow-auto p-4 pt-14 md:pt-6 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
