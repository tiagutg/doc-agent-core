import { Sidebar } from "@/components/features/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pb-20 md:pb-0 md:pl-64">{children}</div>
    </div>
  );
}
