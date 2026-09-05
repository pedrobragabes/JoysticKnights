type RawRendered = {
  rendered: string;
  protected?: boolean;
};

export type RawSeo = {
  title?: string;
  description?: string;
  canonical?: string;
  social_image?: string;
};

export type RawAuthor = {
  id: number;
  name: string;
  slug: string;
  link?: string;
  description?: string;
  avatar_urls?: Record<string, string>;
};

export type RawTerm = {
  id: number;
  name: string;
  slug: string;
  link?: string;
  taxonomy?: string;
  parent?: number;
  count?: number;
  description?: string;
};

export type RawMedia = {
  source_url: string;
  alt_text?: string;
  caption?: RawRendered;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<
      string,
      {
        source_url?: string;
        width?: number;
        height?: number;
      }
    >;
  };
};

export type RawPostMeta = {
  promogames_deck?: string;
  promogames_editorial_type?: string;
  promogames_platforms?: string[] | string;
  promogames_review_score?: number | string;
  promogames_review_game?: string;
  promogames_review_developer?: string;
  promogames_review_publisher?: string;
  promogames_review_release_date?: string;
  promogames_review_tested_platform?: string;
  promogames_review_disclosure?: string;
  promogames_review_verdict?: string;
  promogames_review_pros?: string;
  promogames_review_cons?: string;
  promogames_featured?: boolean | string | number;
};

export type RawPost = {
  id: number;
  slug: string;
  link: string;
  date: string;
  date_gmt?: string | null;
  modified: string;
  modified_gmt?: string | null;
  title: RawRendered;
  excerpt: RawRendered;
  content?: RawRendered;
  author: number;
  featured_media: number;
  comment_status: "open" | "closed";
  categories: number[];
  tags: number[];
  meta?: RawPostMeta;
  promogames_review_rating?: number | null;
  promogames_seo?: RawSeo;
  _embedded?: {
    author?: RawAuthor[];
    "wp:featuredmedia"?: RawMedia[];
    "wp:term"?: RawTerm[][];
  };
};

export type RawComment = {
  id: number;
  post: number;
  parent: number;
  author_name: string;
  date: string;
  content: RawRendered;
  status: "approved" | "hold" | "spam" | "trash" | string;
  type: "comment" | string;
};

export type RawPage = {
  id: number;
  slug: string;
  link: string;
  date: string;
  date_gmt?: string | null;
  modified: string;
  modified_gmt?: string | null;
  title: RawRendered;
  excerpt?: RawRendered;
  content?: RawRendered;
  parent: number;
  menu_order: number;
  promogames_seo?: RawSeo;
};

export type RawCategory = RawTerm & {
  taxonomy?: "category";
};

export type RawTag = RawTerm & {
  taxonomy?: "post_tag";
};
