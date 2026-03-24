import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden border-t border-border/40 md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Kuma Tracker &middot; Card images &copy; BANDAI
        </p>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/guide" className="transition-colors hover:text-foreground">
            คู่มือ
          </Link>
          <a
            href="mailto:support@kumatracker.com"
            className="transition-colors hover:text-foreground"
          >
            ติดต่อ
          </a>
        </nav>
      </div>
    </footer>
  );
}
