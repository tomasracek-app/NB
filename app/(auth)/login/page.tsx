import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow animate-pulse">
      <div className="space-y-4">
        <div className="h-8 w-32 mx-auto bg-muted rounded" />
        <div className="h-4 w-48 mx-auto bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}
