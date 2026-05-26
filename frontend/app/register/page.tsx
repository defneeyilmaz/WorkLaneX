import { AuthPageShell } from "@/components/auth-page-shell";
import { GuestOnly } from "@/components/guest-only";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create your account"
      description="Set up access for you and your team."
    >
      <GuestOnly>
        <RegisterForm />
      </GuestOnly>
    </AuthPageShell>
  );
}
