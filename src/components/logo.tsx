import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/Icon-No-BG.png" 
        alt="Timeflow Logo"
        width={24}
        height={24}
        className="h-6 w-6"
      />
      <span className="font-bold text-lg">Timeflow</span>
    </div>
  );
}
