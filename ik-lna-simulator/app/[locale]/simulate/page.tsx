import { Suspense } from "react";
import { SimulateView } from "@/components/views/simulate";

// The attempt id is a query parameter so the page can be statically exported.
export default function Page() {
  return (
    <Suspense>
      <SimulateView />
    </Suspense>
  );
}
