// components/nav.tsx
'use client';

import { useRouter } from "next/navigation";

 interface NavProps {
  username: string;
}

export default function Nav({ username }: NavProps)  {
  const router = useRouter();

  return (
    <nav className="fixed right-0 left-0 z-50  bg-black/70 backdrop-blur-lg shadow-lg tracking-[0.08em] py-2 px-12" style={{ zoom: '0.54' }}>
      <div className="mx-auto flex max-w-9xl flex-col items-center justify-between px-6 md:flex-row">
        
        <div className="hidden items-center space-x-[4rem] text-lg text-white md:flex tracking-[0.1rem]">
          <div className="px-2"></div>

          <a href={`/dashboard/${username}`} className="transition hover:opacity-70">Dashboard</a>
          <a href="#" className="transition hover:opacity-70">Refunds</a>
          <a href={`/templates/${username}`} className="transition hover:opacity-70">Templates</a>
          <a href={`/lander`} className="transition hover:opacity-70">Home</a>
          <a href={`/pricing/${username}`} className="transition hover:opacity-70">Premium</a>
        </div>

        <a href={`/edit_new/${username}`} className="bg-red-600 text-white px-[2.8rem] tracking-[0.1rem] py-2.5 rounded-sm text-lg font-medium shadow-md hover:shadow-xl transition-all duration-300">
          Edit
        </a>

      </div>
    </nav>
  );
}