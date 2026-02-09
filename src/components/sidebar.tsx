"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  Gift,
  Settings,
  LogOut,
  User,
} from "lucide-react";

interface SidebarProps {
  role?: "admin" | "employee";
}

const adminMenuItems = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "직원 관리", href: "/dashboard/employees", icon: Users },
  { label: "급여 관리", href: "/dashboard/salary", icon: Wallet },
  { label: "매출 관리", href: "/dashboard/sales", icon: TrendingUp },
  { label: "인센티브", href: "/dashboard/incentive", icon: Gift },
  { label: "설정", href: "/dashboard/settings", icon: Settings },
];

const employeeMenuItems = [
  { label: "마이페이지", href: "/mypage", icon: User },
];

export default function Sidebar({ role = "admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = role === "employee" ? employeeMenuItems : adminMenuItems;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* 로고 */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Salang
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
