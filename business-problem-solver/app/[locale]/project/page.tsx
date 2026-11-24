import { Suspense } from "react";
import { WorkspaceView } from "@/components/views/workspace";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}>
      <WorkspaceView />
    </Suspense>
  );
}
