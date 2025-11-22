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

const ERROR_MESSAGES: Record<string, string> = {
  steam_init_failed: "Failed to initialize Steam login. Please try again.",
  invalid_state: "Security validation failed. Please try again.",
  steam_validation_failed: "Steam login validation failed. Please try again.",
  steam_user_fetch_failed: "Failed to fetch Steam profile. Please try again.",
  not_authenticated: "You must be logged in to link a Steam account.",
  steam_already_linked: "This Steam account is already linked to another user.",
  link_failed: "Failed to link Steam account. Please try again.",
  callback_failed: "Steam login failed. Please try again.",
  auth_failed: "Authentication failed. Please try again.",
  user_creation_failed: "Failed to create user account. Please try again.",
  auth_data_missing: "Authentication data missing. Please try again.",
  signin_failed: "Sign-in failed. Please try again.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [steamLoading, setSteamLoading] = useState(false);

  const loginForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error && ERROR_MESSAGES[error]) {
      toast.error(ERROR_MESSAGES[error]);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (success === "steam_linked") {
      toast.success("Steam account linked successfully!");
    }
  }, [searchParams]);

  const handleSteamLogin = async () => {
    setSteamLoading(true);
    try {
      window.location.href = "/api/auth/steam";
    } catch (error) {
      toast.error("Failed to initiate Steam login");
      setSteamLoading(false);
    }
  };

  const handleEmailLogin = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select()
          .eq("user_id", authData.user.id)
          .single();

        if (!profile) {
          await supabase.from("profiles").insert({
            user_id: authData.user.id,
            username: data.email.split("@")[0],
          });
        }

        toast.success("Welcome back!");
        window.location.href = "/";
      }
    } catch (error) {
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

        toast.success("Account created! You can now sign in.");
        signupForm.reset();
      }
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Choose your preferred sign-in method</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="steam" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steam">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Steam
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steam" className="space-y-4">
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in with your Steam account to automatically sync your
                library
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={handleSteamLogin}
                disabled={steamLoading}
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                {steamLoading ? "Connecting to Steam..." : "Sign in with Steam"}
              </Button>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">Privacy & Security:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>
                        We only access your public Steam profile and game
                        library
                      </li>
                      <li>Your Steam credentials are never stored</li>
                      <li>Authentication is handled securely by Steam</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

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

                  <p className="text-xs text-center text-muted-foreground">
                    You can link your Steam account after signing in
                  </p>
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

                  <p className="text-xs text-center text-muted-foreground">
                    You can link your Steam account after signing up
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
