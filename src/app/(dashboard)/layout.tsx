import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar: hidden on mobile, shown on md+ */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar: shown only below md */}
        <TopBar />

        <main className="flex-1 overflow-auto bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
