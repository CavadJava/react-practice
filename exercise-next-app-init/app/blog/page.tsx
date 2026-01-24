"use client";

import Countdown from "@/components/Countdown";

export default function About() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1>About</h1>
      <Countdown from={10} to={0} onEnd={() => alert("Countdown ended!")} />
    </div>
  );
}
