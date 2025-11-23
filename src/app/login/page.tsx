import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Gamepad2 } from "lucide-react";

function LoginFormWrapper() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="h-96 bg-card rounded-lg animate-pulse" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      {}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl">
                <Gamepad2 className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">
              Play This Next
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI-powered gaming companion
            </p>
          </div>
        </div>

        {}
        <LoginFormWrapper />

        {}
        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <span className="underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}
