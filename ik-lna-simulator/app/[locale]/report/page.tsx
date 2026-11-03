import { Suspense } from "react";
import { ReportView } from "@/components/views/report";

export default function Page() {
  return (
    <Suspense>
      <ReportView />
    </Suspense>
  );
}
