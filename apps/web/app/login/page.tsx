import LoginPanel from "@/components/auth/LoginPanel";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-white font-work-sans">
      <Link href="/" className="mb-8">
        <Image
          src="/logo.png"
          alt="Foundrly"
          width={144}
          height={30}
          className="h-[30px] w-auto"
        />
      </Link>
      <h1 className="text-2xl font-bold mb-6">Sign in to Foundrly</h1>
      <LoginPanel />
    </main>
  );
}
