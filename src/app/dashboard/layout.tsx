import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white py-6">
        <div className="px-6 pb-6">
          <p className="text-sm font-semibold text-neutral-400">
            Conteúdo Redes
          </p>
          <p className="mt-1 text-xs text-neutral-400">{user?.email}</p>
        </div>
        <SidebarNav />
        <div className="mt-auto px-3 pt-6">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-neutral-50 p-8">{children}</main>
    </div>
  );
}
