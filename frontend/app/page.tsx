import Link from "next/link";

import { ApiHealthStatus } from "@/components/api-health-status";
import { LandingActions } from "@/components/landing-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80"
        >
          WorkLaneX
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 md:py-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              Team workspace for shipping together
            </CardTitle>
            <CardDescription>
              Tasks, docs, and updates in one place for small software teams and
              project groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiHealthStatus />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <LandingActions />
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
