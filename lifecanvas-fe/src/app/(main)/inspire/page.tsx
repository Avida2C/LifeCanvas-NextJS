import { Suspense } from "react";
import { InspireView } from "@/components/views/inspire-view";

export default function InspirePage() {
  return (
    <Suspense fallback={null}>
      <InspireView />
    </Suspense>
  );
}
