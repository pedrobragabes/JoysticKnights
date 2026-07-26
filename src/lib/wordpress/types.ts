export type WordPressImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export type WordPressAuthor = {
  id: number;
  name: string;
  slug: string;
  href: string;
  sourceUrl?: string;
  description: string;
  avatarUrl?: string;
};

export type WordPressSeo = {
  title?: string;
  description?: string;
  canonical?: string;
  socialImage?: string;
};

export type WordPressTerm = {
  id: number;
  name: string;
  slug: string;
  href: string;
  sourceUrl?: string;
  taxonomy: string;
  parent?: number;
  count?: number;
  description?: string;
};

export type WordPressPage = {
  id: number;
  slug: string;
  href: string;
  sourceUrl: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  modifiedAt: string;
  parentId: number;
  menuOrder: number;
  seo?: WordPressSeo;
};

export type WordPressComment = {
  id: number;
  postId: number;
  parentId: number;
  authorName: string;
  publishedAt: string;
  content: string;
};

export type Story = {
  id: number;
  slug: string;
  href: string;
  sourceUrl: string;
  title: string;
  excerpt: string;
  content: string;
  deck?: string;
  publishedAt: string;
  modifiedAt: string;
  author: WordPressAuthor;
  image?: WordPressImage;
  seo?: WordPressSeo;
  commentStatus: "open" | "closed";
  categories: WordPressTerm[];
  tags: WordPressTerm[];
  primaryCategory?: WordPressTerm;
  readingMinutes: number;
  editorialType?: string;
  platforms: string[];
  reviewScore?: number;
  featured: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type StoryQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: number;
  tagId?: number;
  authorId?: number;
  exclude?: number[];
  sticky?: boolean;
};
