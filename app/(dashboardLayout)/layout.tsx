import { AccountBlockedDialog } from "@/components/account-blocked-dialog";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex-1">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-64 ">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
      <AccountBlockedDialog />
    </div>
  );
}
