import { useEffect, useState } from "react";

export function useKeyHeld(code: string) {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === code) setHeld(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === code) setHeld(false);
    };
    const onBlur = () => setHeld(false);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [code]);

  return held;
}

