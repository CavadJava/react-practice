import Image from 'next/image';

export default function Detail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Detail Page
      <Image src="https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/models_gw/2025/hero.jpg" 
       alt="Header Image"
       width={600}
       height={400}
       className="mt-4 rounded-lg shadow-lg" /> 
    </div>
  );
}