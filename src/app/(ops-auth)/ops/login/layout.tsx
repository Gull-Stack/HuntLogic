export default function OpsLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"}
        </h1>
        <p className="mt-1 text-sm font-medium tracking-wider uppercase text-gray-400">
          Ops Portal
        </p>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm">
        {children}
      </div>

      {/* Safe area bottom padding for mobile */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
