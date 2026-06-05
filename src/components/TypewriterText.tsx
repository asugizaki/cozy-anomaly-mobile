import { useEffect, useMemo, useState } from "react";
import { Text, TextProps } from "react-native";

type Props = TextProps & {
  text: string;
  speedMs?: number;
  restartKey?: string | number | boolean;
};

export function TypewriterText({
  text,
  speedMs = 14,
  restartKey,
  ...props
}: Props) {
  const [count, setCount] = useState(0);

  const safeText = useMemo(() => text || "", [text]);

  useEffect(() => {
    setCount(0);

    if (!safeText) return;

    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      setCount(index);

      if (index >= safeText.length) {
        clearInterval(timer);
      }
    }, speedMs);

    return () => clearInterval(timer);
  }, [safeText, speedMs, restartKey]);

  return <Text {...props}>{safeText.slice(0, count)}</Text>;
}
