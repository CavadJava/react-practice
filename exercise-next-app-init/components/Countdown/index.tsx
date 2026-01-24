"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  from,
  to}:{
  from?: number;
  to?: number;
}) {
  const [count, setCount] = useState(from ?? 10);

  useEffect(() => {
    if (count <= 0){
      alert("Countdown ended!");
      return;
    } 
    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer); 
  }, [count, to]);

  return (
    <div className="text-4xl font-mono">
      {count}
    </div>
  );
}