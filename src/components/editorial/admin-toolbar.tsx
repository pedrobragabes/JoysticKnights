import { siteConfig } from "@/lib/site-config";
import { AdminToolbarClient } from "./admin-toolbar-client";

export function AdminToolbar({ postId = 0 }: { postId?: number }) {
  if (process.env.WORDPRESS_ADMIN_TOOLBAR_ENABLED !== "true") return null;
  const api = new URL(process.env.WORDPRESS_API_URL || siteConfig.defaultWordPressApiUrl);
  return <AdminToolbarClient endpoint={`${api.origin}/wp-admin/admin-ajax.php`} postId={postId} />;
}
