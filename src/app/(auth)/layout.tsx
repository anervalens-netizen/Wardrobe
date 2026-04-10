export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.93 0.04 300) 0%, oklch(0.88 0.06 300) 40%, oklch(0.88 0.06 185) 100%)",
      }}
    >
      {/* Decorative blob top-right */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.70 0.14 185)" }}
      />
      {/* Decorative blob bottom-left */}
      <div
        className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.59 0.21 293)" }}
      />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
