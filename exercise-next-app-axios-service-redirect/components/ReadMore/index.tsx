"use client";
import { useRouter } from "next/navigation";



export function ReadMoreBtn(
  { children,to }: {children: React.ReactNode, to: string}) {
    const {push} = useRouter();
  return (
    <button onClick={() => push(to)}
     className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{children}</button>
  );
}