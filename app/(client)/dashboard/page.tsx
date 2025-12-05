import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Package, UserCheck, Phone } from "lucide-react";

export default async function ClientDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // TODO: Načíst skutečné statistiky z databáze pro daného klienta
  const stats = [
    {
      title: "Obrat tento měsíc",
      value: "0 Kč",
      change: "+0%",
      icon: TrendingUp,
    },
    {
      title: "Produkty ve skladu",
      value: "0",
      change: "0 změn",
      icon: Package,
    },
    {
      title: "Nové leads",
      value: "0",
      change: "tento týden",
      icon: UserCheck,
    },
    {
      title: "Aktivní čísla",
      value: "0",
      change: "telefonie",
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {session.user.clientName || "Vítejte v datové platformě"}
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
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Přehled obratů</CardTitle>
            <CardDescription>
              Vývoj obratů za posledních 30 dní
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Graf bude zobrazen po importu dat
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Poslední leads</CardTitle>
            <CardDescription>Nejnovější příchozí leads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Žádné leads k zobrazení
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
