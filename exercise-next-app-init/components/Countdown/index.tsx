"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  from,
  to,
  onEnd,
}: {
  from: number;
  to: number;
  onEnd?: () => void;
}) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= to) {
      onEnd?.();
      return;
    }
    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [count, to, onEnd]);

  return <div>{count}</div>;
}