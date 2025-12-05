import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingUp, Package, Phone } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // TODO: Načíst skutečné statistiky z databáze
  const stats = [
    {
      title: "Aktivní klienti",
      value: "0",
      description: "Celkový počet klientů",
      icon: Users,
    },
    {
      title: "Obraty tento měsíc",
      value: "0 Kč",
      description: "Součet všech klientů",
      icon: TrendingUp,
    },
    {
      title: "Produkty ve skladu",
      value: "0",
      description: "Celkem produktů",
      icon: Package,
    },
    {
      title: "Telefonní čísla",
      value: "0",
      description: "Aktivní čísla",
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Vítejte zpět, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rychlé akce</CardTitle>
            <CardDescription>Časté operace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Přidat nového klienta
            </p>
            <p className="text-sm text-muted-foreground">
              • Importovat data
            </p>
            <p className="text-sm text-muted-foreground">
              • Synchronizovat XML feedy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poslední aktivita</CardTitle>
            <CardDescription>Nedávné změny v systému</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Žádná nedávná aktivita
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
