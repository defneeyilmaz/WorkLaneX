import { ApiHealthStatus } from "@/components/api-health-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">WorkLaneX</span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Team workspace for shipping together</CardTitle>
            <CardDescription>
              Tasks, docs, and updates in one place for small software teams and
              project groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-preview">Work email</Label>
              <Input
                id="email-preview"
                type="email"
                placeholder="you@team.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Sign-in form preview — wired up in the auth phase.
              </p>
            </div>
            <ApiHealthStatus />
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button disabled>Log in</Button>
            <Button variant="outline" disabled>
              Create account
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
