"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const isEditing = !!client;

  const [name, setName] = useState(client?.name || "");
  const [slug, setSlug] = useState(client?.slug || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automaticky generovat slug z názvu
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Odstranění diakritiky
      .replace(/[^a-z0-9]+/g, "-") // Nahrazení speciálních znaků
      .replace(/^-|-$/g, ""); // Odstranění pomlček na začátku/konci
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Automaticky generovat slug pouze při vytváření nového klienta
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/clients/${client.id}`
        : "/api/admin/clients";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nastala chyba");
      }

      router.push("/admin/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nastala chyba");
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? "Upravit klienta" : "Vytvořit klienta"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Upravte základní údaje klienta"
            : "Vyplňte základní údaje nového klienta"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Název klienta *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Např. Firma s.r.o."
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="firma-sro"
                required
                disabled={isLoading}
                pattern="[a-z0-9-]+"
                title="Pouze malá písmena, čísla a pomlčky"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              URL identifikátor - pouze malá písmena, čísla a pomlčky
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Uložit změny" : "Vytvořit klienta"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
