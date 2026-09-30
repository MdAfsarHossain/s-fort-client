import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Password recovery isn&apos;t set up yet. Please contact an
          administrator to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link href={ROUTES.LOGIN} />}
        >
          Back to login
        </Button>
      </CardContent>
    </Card>
  );
}
