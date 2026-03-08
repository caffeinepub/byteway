# ByteWay Blog App

## Current State
- Admin dashboard at /admin with login (ALOK / 134221)
- Blog Posts panel: create, publish, approve/reject posts
- No edit or delete for existing blog posts
- Subscribers panel: view subscribers (no delete)
- Site Configuration: update contact/social info
- Subscribe form on homepage works
- Photos panel for admin image posts

## Requested Changes (Diff)

### Add
- `updateBlogPost` backend function: update title, content, author, tags, coverImageId of existing post (no auth gate - frontend password gate)
- `deleteBlogPost` backend function: permanently delete a blog post by id (no auth gate - frontend password gate)
- `deleteSubscription` backend function: admin can remove a subscriber
- Edit blog post dialog in BlogPostsPanel: pencil icon button per row, opens prefilled form, saves changes
- Delete blog post button in BlogPostsPanel: trash icon per row, confirm before deleting
- Delete subscriber button in SubscribersPanel: trash icon per row, confirm before deleting
- Subscribe form improvements: clearer CTA, prominent placement, validation feedback
- Subscribe section visible and accessible on homepage and blog list page

### Modify
- BlogPostsPanel: add Edit (pencil) and Delete (trash) action buttons per post row
- SubscribersPanel: add Delete button per subscriber row with confirm dialog
- SubscribeForm: make it more prominent with better visual hierarchy
- HomePage: ensure subscribe section is clearly visible

### Remove
- Nothing removed

## Implementation Plan
1. Add `updateBlogPost`, `deleteBlogPost`, `deleteSubscription` to backend (main.mo)
2. Regenerate backend bindings
3. Add `useUpdateBlogPost`, `useDeleteBlogPost`, `useDeleteSubscription` hooks
4. Update BlogPostsPanel: add edit dialog (prefilled) and delete confirm dialog with trash button
5. Update SubscribersPanel: add delete button with confirm per row
6. Improve SubscribeForm visual prominence
7. Validate, build and deploy
