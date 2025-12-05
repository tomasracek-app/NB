import { Sidebar, adminNavItems } from "@/components/layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={adminNavItems} title="Admin Panel" />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
