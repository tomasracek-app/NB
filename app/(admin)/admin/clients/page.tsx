import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Building2 } from "lucide-react";

// Dočasná data pro vývoj bez databáze
const mockClients = [
  {
    id: "1",
    name: "Demo Klient",
    slug: "demo-klient",
    createdAt: new Date().toISOString(),
    _count: { users: 2 },
    settings: { activeModules: ["REVENUE", "LEADS"] },
  },
];

export default async function ClientsPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // TODO: Načíst skutečné klienty z API
  // const response = await fetch('/api/admin/clients');
  // const { clients } = await response.json();
  const clients = mockClients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klienti</h1>
          <p className="text-muted-foreground">
            Správa klientů a jejich přístupů
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nový klient
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Žádní klienti</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Zatím nebyl vytvořen žádný klient
            </p>
            <Link href="/admin/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Vytvořit prvního klienta
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{client.name}</span>
                  </CardTitle>
                  <CardDescription>/{client.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{client._count.users} uživatelů</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {client.settings?.activeModules?.map((module: string) => (
                      <Badge key={module} variant="secondary" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                    {(!client.settings?.activeModules ||
                      client.settings.activeModules.length === 0) && (
                      <span className="text-xs text-muted-foreground">
                        Žádné aktivní moduly
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
