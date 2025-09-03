
import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-8 relative overflow-hidden">
        <div 
            className="absolute inset-0 flex items-center justify-center text-[400px] font-black text-secondary/50 -z-10 select-none"
            aria-hidden="true"
        >
            404
        </div>
        <div className="flex flex-col items-center justify-center gap-4 max-w-md">
            <div className="p-4 bg-destructive/10 rounded-full">
                <Compass className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold mt-4">Huch! Sie scheinen vom Weg abgekommen zu sein.</h1>
            <p className="text-muted-foreground">
                Die von Ihnen gesuchte Seite konnte nicht gefunden werden. Vielleicht hat sie sich in der Zeit verirrt.
            </p>
            <Button asChild className="mt-4">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Zurück zur Startseite
                </Link>
            </Button>
        </div>
    </div>
  );
}
