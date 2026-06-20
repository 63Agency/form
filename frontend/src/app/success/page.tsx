import { Suspense } from "react";

import { SuccessContent, SuccessLoadingCard } from "./success-content";

export default function SuccessPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Suspense fallback={<SuccessLoadingCard />}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
