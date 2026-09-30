"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/get-error-message";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function LoginPage() {
  useDocumentTitle("Sign in");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleGoogleLogin() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // console.log(`Login Button Click`);
    
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // console.log({ email, password });

      await login(email, password);
      toast.success("Logged in successfully");
      router.push(ROUTES.DASHBOARD_OVERVIEW);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid email or password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground hover:text-foreground"
        nativeButton={false}
        render={<Link href="/" />}
      >
        <ArrowLeftIcon />
        Back to home
      </Button>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage your blogs and newsletters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link> */}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-8"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute inset-y-0 right-0.5 my-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" />}
              Sign in
            </Button>
          </form>

          {/* <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div> */}

          {/* <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" className="size-4">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.48-1.13 2.74-2.4 3.58v2.98h3.87c2.27-2.09 3.58-5.17 3.58-8.75Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-2.98c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.25 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.3a7.19 7.19 0 0 1 0-4.6V6.63H1.27a11.98 11.98 0 0 0 0 10.74l4-3.07Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.07C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </Button> */}
        </CardContent>
      </Card>
    </div>
  );
}
