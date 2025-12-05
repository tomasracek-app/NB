import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
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
import {
  ArrowLeft,
  Edit,
  Users,
  TrendingUp,
  Package,
  UserCheck,
  Phone,
  FileText,
} from "lucide-react";
import { ClientForm } from "../client-form";
import { DeleteClientButton } from "./delete-button";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

// Mock data pro vývoj
const mockClient = {
  id: "1",
  name: "Demo Klient",
  slug: "demo-klient",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    activeModules: ["REVENUE", "LEADS"],
    companyName: "Demo Firma s.r.o.",
    companyIco: "12345678",
  },
  users: [
    { id: "u1", email: "user@demo.cz", name: "Jan Novák", role: "CLIENT" },
  ],
  _count: {
    revenueData: 150,
    products: 45,
    leads: 320,
    teleCustomers: 12,
    invoices: 8,
  },
};

export default async function ClientDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const { edit } = await searchParams;

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // TODO: Načíst skutečného klienta z API
  // const response = await fetch(`/api/admin/clients/${id}`);
  // if (!response.ok) notFound();
  // const { client } = await response.json();

  const client = id === "1" ? mockClient : null;

  if (!client) {
    notFound();
  }

  const isEditing = edit === "true";

  const stats = [
    { label: "Obratová data", value: client._count.revenueData, icon: TrendingUp },
    { label: "Produkty", value: client._count.products, icon: Package },
    { label: "Leads", value: client._count.leads, icon: UserCheck },
    { label: "Tel. zákazníci", value: client._count.teleCustomers, icon: Phone },
    { label: "Faktury", value: client._count.invoices, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">/{client.slug}</p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}?edit=true`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Upravit
              </Button>
            </Link>
            <DeleteClientButton clientId={id} clientName={client.name} />
          </div>
        )}
      </div>

      {isEditing ? (
        <ClientForm client={client} />
      ) : (
        <>
          {/* Statistiky */}
          <div className="grid gap-4 md:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Základní info a moduly */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Základní informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Firma: </span>
                  <span>{client.settings?.companyName || "Neuvedeno"}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">IČO: </span>
                  <span>{client.settings?.companyIco || "Neuvedeno"}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Vytvořeno: </span>
                  <span>{new Date(client.createdAt).toLocaleDateString("cs-CZ")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivní moduly</CardTitle>
                <CardDescription>
                  Moduly dostupné pro tohoto klienta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {client.settings?.activeModules?.length > 0 ? (
                    client.settings.activeModules.map((module: string) => (
                      <Badge key={module}>{module}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Žádné aktivní moduly
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uživatelé */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Uživatelé</CardTitle>
                <CardDescription>
                  Uživatelé s přístupem k tomuto klientovi
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Přidat uživatele
              </Button>
            </CardHeader>
            <CardContent>
              {client.users.length > 0 ? (
                <div className="space-y-3">
                  {client.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Žádní uživatelé
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
