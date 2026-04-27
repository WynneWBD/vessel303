export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center px-4">
      {children}
    </div>
  );
}
