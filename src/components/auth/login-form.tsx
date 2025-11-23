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
import { Gamepad2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

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

  // Check for Steam errors on mount
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
    }
  }, [searchParams]);

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
            <div className="text-center py-6 space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                  ⚠️ Important: Steam Login Requirements
                </p>
                <p className="text-muted-foreground text-left">
                  To sign in with Steam, you must first:
                </p>
                <ol className="text-left text-muted-foreground list-decimal list-inside mt-2 space-y-1">
                  <li>Create an account using Email & Password</li>
                  <li>Sign in to your account</li>
                  <li>Go to Settings and link your Steam account</li>
                  <li>Then you can use Steam login</li>
                </ol>
              </div>

              <p className="text-sm text-muted-foreground">
                Sign in with your Steam account (must be already linked)
              </p>
              <Button className="w-full" size="lg" onClick={handleSteamLogin}>
                <Gamepad2 className="w-5 h-5 mr-2" />
                Sign in with Steam
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
