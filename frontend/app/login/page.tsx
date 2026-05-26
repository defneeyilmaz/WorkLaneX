import { AuthPageShell } from "@/components/auth-page-shell";
import { GuestOnly } from "@/components/guest-only";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      description="Sign in to continue to your team workspace."
    >
      <GuestOnly>
        <LoginForm />
      </GuestOnly>
    </AuthPageShell>
  );
}
