const platformAssets = {
  playstation: "playstation",
  xbox: "xbox",
  nintendo: "nintendoswitch",
  pc: "windows",
} as const;

// Original brand silhouettes from Simple Icons; see docs/PLATFORM-ASSETS.md.
export function PlatformIcon({ name, className = "size-5" }: {
  name: keyof typeof platformAssets;
  className?: string;
}) {
  const mask = `url(/brands/${platformAssets[name]}.svg) center / contain no-repeat`;
  return <span aria-hidden="true" className={`inline-block shrink-0 ${className}`} style={{ backgroundColor: "currentColor", mask, WebkitMask: mask }} />;
}
