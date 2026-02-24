"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  role?: "admin" | "team_leader" | "employee";
}

const adminMenuItems = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "직원 관리", href: "/dashboard/employees", icon: Users },
  { label: "급여 관리", href: "/dashboard/salary", icon: Wallet },
  { label: "매출 관리", href: "/dashboard/sales", icon: TrendingUp },
  { label: "인센티브", href: "/dashboard/incentive", icon: Gift },
  { label: "팀 현황", href: "/teampage", icon: Users },
  { label: "팀원 상세", href: "/teampage/members", icon: User },
  { label: "설정", href: "/dashboard/settings", icon: Settings },
];

const teamLeaderMenuItems = [
  { label: "팀 현황", href: "/teampage", icon: LayoutDashboard },
  { label: "팀원 상세", href: "/teampage/members", icon: Users },
  { label: "마이페이지", href: "/mypage", icon: User },
];

const employeeMenuItems = [
  { label: "마이페이지", href: "/mypage", icon: User },
];

export default function Sidebar({ role = "admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const menuItems =
    role === "admin"
      ? adminMenuItems
      : role === "team_leader"
      ? teamLeaderMenuItems
      : employeeMenuItems;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const sidebarContent = (
    <>
      {/* 로고 */}
      <div className="flex h-16 md:h-20 items-center gap-3 border-b border-border/50 px-4 md:px-6">
        <Image
          src="/logo.jpg"
          alt="살랑"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <span className="text-lg font-bold text-foreground">살랑</span>
          <p className="text-[10px] tracking-wider text-muted-foreground">
            INTERIOR DESIGN
          </p>
        </div>
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={() => setOpen(false)}
          className="ml-auto md:hidden p-1 rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1 p-3 md:p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : item.href === "/teampage"
              ? pathname === "/teampage"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-border/50 p-3 md:p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-card border border-border/50 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 모바일 사이드바 (슬라이드) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border/50 transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* 데스크톱 사이드바 (고정) */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border/50 bg-card shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
