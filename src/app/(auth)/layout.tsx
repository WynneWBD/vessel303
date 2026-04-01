export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center px-4">
      {children}
    </div>
  );
}
