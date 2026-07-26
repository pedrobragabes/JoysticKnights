import Image from "next/image";
import type { WordPressImage } from "@/lib/wordpress/types";

export function StoryImage({
  image,
  alt,
  priority = false,
  sizes,
  className = "",
}: {
  image?: WordPressImage;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={`story-image relative overflow-hidden bg-[linear-gradient(135deg,#6426d9,#f02f7d_55%,#ffb000)] ${className}`}>
      {image ? (
        <Image
          fill
          src={image.url}
          alt={image.alt || alt}
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center font-display text-2xl font-black text-white/90">
          PROMOGAMES
        </div>
      )}
    </div>
  );
}
