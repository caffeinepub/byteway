# ByteWay Blog App

## Current State
- Full admin (ALOK / 134221) can log in at /admin and manage blog posts, subscribers, photos, site config, and sub-admins.
- Sub-admin accounts can be created by the admin from the "Sub-Admins" tab.
- Sub-admins log in at /admin with their credentials and are routed to `SubadminDashboardPage`.
- `SubadminDashboardPage` renders `<BlogPostsPanel subadminMode />`.
- In `subadminMode`, `BlogPostsPanel` shows the full posts table (all posts) with "View only" for every row action — subadmins cannot edit/delete/approve, which is correct.
- The "Create Post" button is visible to subadmins and opens the create dialog.
- The create dialog calls `createAndPublishBlogPost` (publish immediately) or `createBlogPost` (draft).
- Backend blog functions have no auth — they work for any caller including anonymous.
- `useActor` initialises an anonymous actor when no Internet Identity is present, which is correct.

## Issues Identified
1. The `BlogPostsPanel` create dialog has a `coverImageId || undefined` field — this is functionally fine but the UX is confusing for subadmins who just want to post.
2. Sub-admin dashboard UX is poor: the subadmin sees the entire posts table (all admin-created posts too) with "View only" labels and no useful actions. It's confusing and not focused.
3. After a subadmin posts a blog, the new post appears in the table with "View only" actions — the subadmin has no feedback that it worked beyond a toast.
4. The `BlogPostsPanel` in subadmin mode doesn't filter to show only the current subadmin's posts.
5. Missing a dedicated, streamlined blog-post form for subadmins — the current shared panel is designed for full admin use.
6. There is no "my posts" view for subadmins to track what they've submitted.

## Requested Changes (Diff)

### Add
- New `SubadminBlogPanel` component: a dedicated, focused blog creation interface for subadmins.
  - Shows a simple "Write a Blog Post" form inline (not in a dialog) with title, author, content, tags, and cover image URL.
  - "Publish Now" button that calls `createAndPublishBlogPost` — posts go live immediately.
  - "Save as Draft" secondary action.
  - Below the form, shows a "My Posts" section — a list of posts authored by the current subadmin username, fetched from `getAllBlogPostsAdmin` and filtered client-side.
  - Each row in "My Posts" shows title, status badge, and date — no edit/delete/approve actions (read-only, correct permissions).
  - Clear success/error toast feedback.
- Sub-admin dashboard header updated to make the purpose clear: "Post a Blog Article".

### Modify
- `SubadminDashboardPage`: replace `<BlogPostsPanel subadminMode />` with `<SubadminBlogPanel />`.
- `SubadminBlogPanel` pre-fills the author field with the current sub-admin's username.

### Remove
- Remove `subadminMode` prop usage from `BlogPostsPanel` (the prop can stay for backward compat but is no longer used in SubadminDashboardPage).

## Implementation Plan
1. Create `src/frontend/src/components/admin/SubadminBlogPanel.tsx`:
   - Inline blog post form (title, author pre-filled with username, content textarea, tags, cover image URL).
   - Submit calls `createAndPublishBlogPost` or `createBlogPost` depending on toggle.
   - "My Posts" section below: fetch all posts, filter by author === currentUsername, display in a clean card/table.
2. Update `SubadminDashboardPage` to use `SubadminBlogPanel` instead of `BlogPostsPanel`.
3. Ensure all form fields have proper data-ocid markers.
4. Validate (typecheck + lint + build).
