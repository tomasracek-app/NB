import { Sidebar, clientNavItems } from "@/components/layout/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={clientNavItems} title="Datová platforma" />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
