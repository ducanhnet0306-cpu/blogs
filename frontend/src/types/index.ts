export type PostStatus = 'draft' | 'published' | 'archived';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface Role {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  status: UserStatus;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status: boolean;
  parent_id?: number | null;
  created_at: string;
  updated_at: string;
  parent?: Category | null;
  children?: Category[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
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
  user_id: number;
  category_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: Category;
  tags?: Tag[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Response cho single resource: { data } */
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

/** Response cho paginated list: { data[], meta } */
export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

/** Response cho non-paginated list: { data[] } */
export interface ApiListResponse<T> {
  data: T[];
}
