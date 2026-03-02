import Image from "next/image";
import { AuthHeader } from "./auth-header";

type AuthLayoutProps = {
  children: React.ReactNode;
  imageSrc?: string;
};

export function AuthLayout({ children, imageSrc = "/auth.webp" }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left — form column */}
      <div className="relative hidden md:block">
        <Image src={imageSrc} alt="" fill className="object-cover" priority sizes="50vw" />
      </div>

      {/* Right — image column (hidden on mobile) */}

      <div className="flex flex-col">
        <AuthHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
          {children}
        </main>
      </div>
    </div>
  );
}
