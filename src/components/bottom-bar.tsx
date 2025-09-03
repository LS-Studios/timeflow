export function BottomBar() {
  return (
    <div className="hidden md:block bg-background border-t border-border py-4 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
          <a 
            href="https://leshift.de/impressum" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Impressum
          </a>
          <span className="text-border">|</span>
          <a 
            href="https://leshift.de/datenschutz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Datenschutz
          </a>
        </div>
      </div>
    </div>
  );
}