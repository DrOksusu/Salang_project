import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">Salang</h1>
      <p className="text-lg text-foreground/60">프로젝트에 오신 것을 환영합니다.</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="outline">로그인</Button>
        </Link>
        <Link href="/register">
          <Button>회원가입</Button>
        </Link>
      </div>
    </div>
  );
}
