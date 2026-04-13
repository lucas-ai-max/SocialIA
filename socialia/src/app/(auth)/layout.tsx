export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1A73E8] via-[#0d5bbd] to-[#0a3061] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="SocialIA" className="mx-auto h-14 w-auto" />
          <p className="mt-2 text-sm text-white/70">
            Gerencie suas redes sociais com inteligência artificial
          </p>
        </div>
        <div className="rounded-[22px]">{children}</div>
      </div>
    </div>
  );
}
