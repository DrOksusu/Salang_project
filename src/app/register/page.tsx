"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      localStorage.setItem("token", data.data.token);
      router.push("/dashboard");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 좌측 로고 영역 */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-[#c4b5a5] via-[#b8a99a] to-[#a08d7d]">
        <div className="text-center">
          <Image
            src="/logo.jpg"
            alt="살랑 인테리어 디자인"
            width={240}
            height={240}
            className="rounded-2xl shadow-2xl mx-auto"
            priority
          />
          <p className="mt-6 text-lg tracking-widest text-white/70">
            INTERIOR DESIGN
          </p>
        </div>
      </div>

      {/* 우측 폼 영역 */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-2 lg:hidden flex justify-center">
              <Image
                src="/logo.jpg"
                alt="살랑"
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">회원가입</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              새 계정을 만들어 시작하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                이름
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="h-11"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                이메일
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-11"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                비밀번호
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (6자 이상)"
                className="h-11"
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={loading}
            >
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
