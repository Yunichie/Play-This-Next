"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Mail, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = emailSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Check for errors on mount
  useEffect(() => {
    const error = searchParams.get("error");
    const steamName = searchParams.get("steam_name");

    if (error === "steam_not_linked" && steamName) {
      toast.error(
        `This Steam account (${steamName}) is not linked to any account. Please create an account manually first, then link your Steam account in Settings.`,
        {
          duration: 8000,
        },
      );
    } else if (error === "steam_already_linked") {
      toast.error("This Steam account is already linked to another account.", {
        duration: 5000,
      });
    } else if (error === "invalid_state") {
      toast.error("Security validation failed. Please try again.");
    } else if (error === "steam_validation_failed") {
      toast.error("Failed to validate Steam login. Please try again.");
    } else if (error === "steam_user_fetch_failed") {
      toast.error("Failed to fetch Steam profile. Please try again.");
    } else if (error === "signin_failed") {
      toast.error("Failed to sign in. Please try again.");
    } else if (error === "signup_failed") {
      toast.error("Failed to create account. Please try again.");
    } else if (error === "callback_failed") {
      toast.error("Authentication failed. Please try again.");
    }

    // Clear error params
    if (error) {
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      params.delete("steam_name");
      router.replace(`/login?${params.toString()}`);
    }
  }, [searchParams, router]);

  const loginForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleEmailLogin = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
        return;
      }

      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        await supabase.from("profiles").insert({
          user_id: authData.user.id,
          username: data.email.split("@")[0],
        });

        toast.success("Account created! Please sign in.");
        signupForm.reset();
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSteamLogin = () => {
    window.location.href = "/api/auth/steam";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Choose your preferred sign-in method</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="steam">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Steam
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit(handleEmailLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...loginForm.register("email")}
                      placeholder="your@email.com"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder="••••••••"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form
                  onSubmit={signupForm.handleSubmit(handleEmailSignup)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      {...signupForm.register("email")}
                      placeholder="your@email.com"
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signupForm.register("password")}
                      placeholder="••••••••"
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...signupForm.register("confirmPassword")}
                      placeholder="••••••••"
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="steam" className="space-y-4">
            <div className="space-y-4 py-4">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-400">
                  Sign in with Steam
                </AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  <p className="mb-2">When you sign in with Steam:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      If your Steam account is not linked, we'll create a new
                      account for you
                    </li>
                    <li>
                      If your Steam account is already linked, you'll be signed
                      in automatically
                    </li>
                    <li>Your Steam library will be available for syncing</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button className="w-full" size="lg" onClick={handleSteamLogin}>
                <Gamepad2 className="w-5 h-5 mr-2" />
                Continue with Steam
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                <p>
                  By signing in with Steam, you agree to link your Steam account
                  to Play This Next.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
