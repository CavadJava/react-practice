import { useState, useEffect } from 'react';

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, []);
  return t;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Unit({ val, label }: { val: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.5rem]">
      <span className="text-xl sm:text-2xl font-black leading-none">{pad(val)}</span>
      <span className="text-[9px] tracking-widest mt-0.5 opacity-90">{label}</span>
    </div>
  );
}

export default function AnnouncementBar() {
  const target = new Date(Date.now() + 21 * 3600000 + 32 * 60000 + 32000);
  const { days, hours, mins, secs } = useCountdown(target);

  return (
    <div className="bg-[#cc0000] text-white text-center py-2 px-4">
      <div className="text-xs sm:text-sm font-semibold mb-1.5">
        Tesla Birthday Sale 65% OFF&nbsp;|&nbsp;
        <a href="#best-sellers" className="underline font-bold hover:opacity-80">SEE MORE</a>
      </div>
      <div className="flex items-start justify-center gap-2 sm:gap-3">
        <Unit val={days} label="DAYS" />
        <span className="text-xl font-black leading-none mt-0.5">:</span>
        <Unit val={hours} label="HRS" />
        <span className="text-xl font-black leading-none mt-0.5">:</span>
        <Unit val={mins} label="MINS" />
        <span className="text-xl font-black leading-none mt-0.5">:</span>
        <Unit val={secs} label="SECS" />
      </div>
    </div>
  );
}
