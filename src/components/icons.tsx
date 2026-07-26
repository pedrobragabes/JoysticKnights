export type IconName =
  | "home"
  | "playstation"
  | "xbox"
  | "nintendo"
  | "pc"
  | "news"
  | "anime"
  | "review"
  | "guide"
  | "deal"
  | "search"
  | "menu"
  | "close"
  | "sun"
  | "moon";

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <><path {...common} d="m3 10 9-7 9 7" /><path {...common} d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    playstation: <><path {...common} d="M7 18V5c4-1 7 1 7 4 0 2-1 3-3 3V8" /><path {...common} d="M4 16c3-1 5-1 7 0M12 15c4-2 7-2 9-1-2 3-5 4-8 4" /></>,
    xbox: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="m7 7 5 5 5-5M6 18l6-6 6 6" /></>,
    nintendo: <><rect {...common} x="4" y="3" width="16" height="18" rx="5" /><path {...common} d="M12 3v18" /><circle cx="8" cy="9" r="1" fill="currentColor" /><circle cx="16" cy="15" r="1" fill="currentColor" /></>,
    pc: <><rect {...common} x="3" y="4" width="18" height="13" rx="2" /><path {...common} d="M8 21h8M12 17v4" /></>,
    news: <><path {...common} d="M5 4h14v16H5z" /><path {...common} d="M8 8h8M8 12h8M8 16h5" /></>,
    anime: <><path {...common} d="M4 12c2.2-4 5-6 8-6s5.8 2 8 6c-2.2 4-5 6-8 6s-5.8-2-8-6Z" /><circle {...common} cx="12" cy="12" r="3" /></>,
    review: <path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    guide: <><path {...common} d="M4 5c3-1 5 0 8 2v14c-3-2-5-3-8-2V5Z" /><path {...common} d="M20 5c-3-1-5 0-8 2v14c3-2 5-3 8-2V5Z" /></>,
    deal: <><path {...common} d="M20 13 12 21l-9-9V4h8l9 9Z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /></>,
    search: <><circle {...common} cx="10.5" cy="10.5" r="6.5" /><path {...common} d="m16 16 5 5" /></>,
    menu: <><path {...common} d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <path {...common} d="m5 5 14 14M19 5 5 19" />,
    sun: <><circle {...common} cx="12" cy="12" r="3.5" /><path {...common} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path {...common} d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" />,
  };

  return <svg aria-hidden viewBox="0 0 24 24" className={className}>{paths[name]}</svg>;
}
