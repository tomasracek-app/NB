import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientForm } from "../client-form";

export default async function NewClientPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nový klient</h1>
        <p className="text-muted-foreground">
          Vytvořte nového klienta pro platformu
        </p>
      </div>

      <ClientForm />
    </div>
  );
}
