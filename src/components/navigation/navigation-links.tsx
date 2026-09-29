"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { navigationGroups } from "./navigation-data";

export function NavigationLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <div className="space-y-5">
    {navigationGroups.map((group) => <div key={group.label}>
      <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">{group.label}</p>
      <div className="space-y-1">
        {group.links.map((link) => {
          const base = link.href.replace(/\/$/, "");
          const active = link.href === "/"
            ? pathname === "/" || pathname.startsWith("/page/")
            : pathname.replace(/\/$/, "") === base || pathname.startsWith(`${base}/`);
          return <Link key={link.href} href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 font-bold transition hover:bg-canvas hover:text-brand ${mobile ? "min-h-12" : "min-h-11 text-[0.92rem]"} ${active ? "bg-canvas text-brand" : "text-muted"}`}>
            <Icon name={link.icon} className="size-5 shrink-0 transition group-hover:scale-110" />
            {link.label}
          </Link>;
        })}
      </div>
    </div>)}
  </div>;
}
