import Countdown from "@/components/Countdown";

export default function About() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      About Page
      <Countdown from={10} to={0} />
    </div>
  );
}
