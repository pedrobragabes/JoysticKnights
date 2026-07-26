import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Brand({ compact = false }: { compact?: boolean }) {
  const isJoystickNights = siteConfig.profile === "joysticknights";

  return (
    <Link href="/" aria-label={`${siteConfig.name} — início`} className="inline-flex items-center gap-2">
      {isJoystickNights ? (
        <Image
          src={compact ? "/joysticknights-icon.png" : "/joysticknights-logo.webp"}
          alt=""
          width={compact ? 36 : 160}
          height={compact ? 36 : 48}
          className={compact ? "size-9 object-contain" : "h-10 w-auto object-contain"}
          priority
        />
      ) : (
        <span aria-hidden className="brand-mark relative grid size-9 rotate-3 place-items-center rounded-[10px] bg-brand text-white">
          <span className="font-display text-xl font-black">{siteConfig.brandMark}</span>
        </span>
      )}
      {!compact && !isJoystickNights ? (
        <span className="font-display flex flex-col text-[1.05rem] font-black uppercase leading-[0.78] tracking-[-0.055em] text-ink">
          <span>{siteConfig.brandLines[0]}</span>
          <span className="text-brand">{siteConfig.brandLines[1]}</span>
        </span>
      ) : null}
    </Link>
  );
}
