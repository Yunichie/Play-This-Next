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

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error === "invalid_state") {
      toast.error("Security validation failed. Please try again.");
    } else if (error === "steam_validation_failed") {
      toast.error("Failed to validate Steam login. Please try again.");
    } else if (error === "steam_user_fetch_failed") {
      toast.error("Failed to fetch Steam profile. Please try again.");
    } else if (error === "signin_failed") {
      toast.error("Failed to sign in. Please try logging in with Steam again.");
    } else if (error === "signup_failed") {
      toast.error("Failed to create account. Please try again.");
    } else if (error === "callback_failed") {
      toast.error("Authentication failed. Please try again.");
    } else if (error === "steam_already_linked") {
      toast.error("This Steam account is already linked to another account.");
    } else if (error === "account_exists_contact_support") {
      toast.error(
        "Account exists but having trouble signing in. Please contact support.",
      );
    } else if (error === "no_session") {
      toast.error("Failed to create session. Please try again.");
    } else if (error === "account_exists_signin_failed") {
      toast.error(
        "Account exists but couldn't sign in. Please try the Login tab instead.",
      );
    }

    if (message === "account_created_please_signin") {
      toast.success("Account created! Signing you in...");
    }

    if (error || message) {
      const params = new URLSearchParams(searchParams);
      params.delete("error");
      params.delete("message");
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
      const supabase = createClient();

      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        return;
      }

      if (!signInData.session) {
        toast.error("Failed to create session");
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
        options: {
          data: {
            username: data.email.split("@")[0],
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        await supabase.from("profiles").insert({
          user_id: authData.user.id,
          username: data.email.split("@")[0],
          total_games: 0,
          total_playtime: 0,
        });

        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

        if (signInError || !signInData.session) {
          toast.success("Account created! Please sign in.");
          signupForm.reset();
          return;
        }

        toast.success("Account created! Welcome!");
        router.push("/");
        router.refresh();
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
                <TabsTrigger value="login" data-steam-login>
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" data-steam-signup>
                  Sign Up
                </TabsTrigger>
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

                  <div className="text-xs text-center text-muted-foreground">
                    <p>
                      Signed up with Steam?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          const steamTab = document.querySelector(
                            '[value="steam"]',
                          ) as HTMLElement;
                          steamTab?.click();
                        }}
                        className="text-primary hover:underline"
                      >
                        Use Steam login instead
                      </button>
                    </p>
                  </div>
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
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="space-y-4 py-2">
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-700 dark:text-blue-400">
                      Login with Steam
                    </AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      <p className="text-sm">
                        Sign in to your existing account using your Steam
                        profile. Only works if you previously signed up with
                        Steam or linked your Steam account.
                      </p>
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSteamLogin}
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Login with Steam
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>
                      Don't have a Steam account linked?{" "}
                      <button
                        onClick={() => {
                          const signupTab = document.querySelector(
                            "[data-steam-signup]",
                          ) as HTMLElement;
                          signupTab?.click();
                        }}
                        className="text-primary hover:underline"
                      >
                        Sign up with Steam
                      </button>
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4 py-2">
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-700 dark:text-green-400">
                      Sign up with Steam
                    </AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      <p className="mb-2 text-sm">
                        Create a new Play This Next account using your Steam
                        profile:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Instant account creation</li>
                        <li>Automatic Steam library sync</li>
                        <li>Sign in with Steam anytime</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSteamLogin}
                    variant="default"
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Sign Up with Steam
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>
                      Already have an account?{" "}
                      <button
                        onClick={() => {
                          const loginTab = document.querySelector(
                            "[data-steam-login]",
                          ) as HTMLElement;
                          loginTab?.click();
                        }}
                        className="text-primary hover:underline"
                      >
                        Login with Steam
                      </button>
                    </p>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <p>
                        By signing up with Steam, you agree to link your Steam
                        account to Play This Next and accept our Terms of
                        Service.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
