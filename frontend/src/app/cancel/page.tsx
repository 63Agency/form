import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";

export default function CancelPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-md text-center sm:max-w-lg lg:max-w-xl">
        <Card className="w-full border shadow-sm">
          <CardContent className="flex flex-col items-center px-5 py-10 sm:px-8 sm:py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl text-muted-foreground">
              ←
            </div>
            <CardTitle className="text-center text-lg sm:text-xl">
              Paiement annulé
            </CardTitle>
            <CardDescription className="mt-3 text-center text-base leading-relaxed sm:text-sm">
              Vous avez annulé le paiement.
            </CardDescription>
          </CardContent>
          <CardFooter className="justify-center border-t border-border">
            <Button asChild size="lg">
              <Link href="/">Retour</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
