import { useSyncExternalStore } from "react";
import { toIsoDate } from "@/lib/engine/format";

const subscribe = () => () => {};

/**
 * Today's date in the viewer's time zone as yyyy-mm-dd. It is "" while the
 * static HTML hydrates (that HTML was built on some other day), then React
 * re-renders with the real date.
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, () => toIsoDate(new Date()), () => "");
}
