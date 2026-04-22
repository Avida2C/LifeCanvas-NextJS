import { Suspense } from "react";
import { InspireView } from "@/components/views/inspire-view";

/** Inspire feed route; suspense handles search-param hydration safely. */
export default function InspirePage() {
  return (
    <Suspense fallback={null}>
      <InspireView />
    </Suspense>
  );
}
