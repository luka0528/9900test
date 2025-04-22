import * as React from "react";

const HALF_SCREEN_BREAKPOINT = 1024;

export function useIsHalfScreen() {
  const [isHalfScreen, setIsHalfScreen] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${HALF_SCREEN_BREAKPOINT - 1}px)`,
    );
    const onChange = () => {
      setIsHalfScreen(window.innerWidth < HALF_SCREEN_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsHalfScreen(window.innerWidth < HALF_SCREEN_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isHalfScreen;
}
