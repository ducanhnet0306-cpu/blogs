export type PostStatus = 'draft' | 'published' | 'archived';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  status: UserStatus;
  roles?: string[];
  permissions?: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status: boolean;
  parent?: Category | null;
  children?: Category[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  thumbnail?: string | null;
  status: PostStatus;
  is_featured: boolean;
  published_at?: string | null;
  view_count: number;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
  };
  author?: User;
  category?: Category;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Response cho single resource: { success, data } */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Response cho paginated list: { success, data[], meta } */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

/** Response cho non-paginated list: { success, data[] } — dùng cho categories và tags index */
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}
