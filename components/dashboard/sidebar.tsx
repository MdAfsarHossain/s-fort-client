import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-card md:flex">
      <SidebarNav />
    </aside>
  );
}
