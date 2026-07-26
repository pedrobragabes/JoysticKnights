import Link from "next/link";
import { Icon } from "@/components/icons";
import { ConsentSettingsButton } from "@/components/platform/consent-settings-button";
import { siteConfig } from "@/lib/site-config";
import { Brand } from "./brand";
import { MobileHeader } from "./mobile-header";
import { navigationLinks } from "./navigation-data";
import { ThemeToggle } from "./theme-toggle";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-line bg-surface px-5 py-7 lg:flex">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <ThemeToggle />
        </div>
        <nav aria-label="Navegação principal" className="mt-9 space-y-1">
          {navigationLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.92rem] font-bold transition hover:bg-canvas hover:text-brand ${index === 0 ? "bg-canvas text-brand" : "text-muted"}`}
            >
              <Icon name={link.icon} className="size-[1.15rem] transition group-hover:scale-110" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-7 border-t border-line pt-7">
          <Link
            href="/buscar/"
            className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
          >
            <Icon name="search" className="size-[1.15rem]" />
            Buscar no {siteConfig.name}
          </Link>
        </div>
        <div className="mt-auto">
          {process.env.NEXT_PUBLIC_NEWSLETTER_ACTION ? <div className="rounded-card bg-[#151219] p-4 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-lilac">Checkpoint</p>
            <p className="mt-2 text-sm font-semibold leading-5">As histórias que importam, sem perder o seu tempo.</p>
            <a href="#newsletter" className="mt-4 inline-flex text-xs font-black text-white underline underline-offset-4">
              Entrar na lista
            </a>
          </div> : null}
          <p className="mt-5 text-xs text-muted">© {new Date().getFullYear()} {siteConfig.name}</p>
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <MobileHeader />
        {children}
        <footer className="border-t border-line bg-surface px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1460px] gap-8 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto]">
            <div>
              <Brand />
              <p className="mt-4 max-w-md text-sm leading-6 text-muted">{siteConfig.shortDescription}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">Institucional</p>
              <nav aria-label="Links institucionais" className="mt-3 flex flex-col gap-2 text-sm font-semibold text-muted">
                <Link href="/sobre/" className="hover:text-brand">Sobre</Link>
                <Link href="/politica-de-privacidade/" className="hover:text-brand">Política de privacidade</Link>
                <Link href="/termos-e-condicoes/" className="hover:text-brand">Termos e condições</Link>
                <Link href="/politica-de-cookies-br/" className="hover:text-brand">Política de cookies</Link>
                <ConsentSettingsButton />
              </nav>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">Contato</p>
              <a href={`mailto:${siteConfig.contactEmail}`} className="mt-3 inline-flex text-sm font-bold text-brand hover:underline">{siteConfig.contactEmail}</a>
              <div className="mt-4 flex gap-3 text-sm font-bold text-muted">
                {siteConfig.social.x ? <a href={siteConfig.social.x} target="_blank" rel="noreferrer" className="hover:text-brand">X</a> : null}
                {siteConfig.social.instagram ? <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="hover:text-brand">Instagram</a> : null}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
