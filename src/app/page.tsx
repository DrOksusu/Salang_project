import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#c4b5a5] via-[#b8a99a] to-[#a08d7d]">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <Image
          src="/logo.jpg"
          alt="살랑 인테리어 디자인"
          width={200}
          height={200}
          className="rounded-2xl shadow-2xl"
          priority
        />
        <div className="text-center">
          <p className="mt-2 text-lg tracking-widest text-white/80">
            INTERIOR DESIGN
          </p>
          <p className="mt-4 text-sm text-white/60">매출 관리 시스템</p>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              로그인
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-white text-[#5c4f44] shadow-lg hover:bg-white/90">
              회원가입
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
