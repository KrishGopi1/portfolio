import { useEffect, useRef, useState } from "react";
import { scrollState, subscribeScroll } from "../store/scroll";

/** Re-renders only when scrollState.sectionIndex changes. */
export function useActiveSection() {
  const [active, setActive] = useState(scrollState.sectionIndex);
  const ref = useRef(active);
  useEffect(
    () =>
      subscribeScroll((s) => {
        if (s.sectionIndex !== ref.current) {
          ref.current = s.sectionIndex;
          setActive(s.sectionIndex);
        }
      }),
    [],
  );
  return active;
}
