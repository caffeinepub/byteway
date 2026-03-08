import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Rocket,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BlogPost } from "../../backend";
import {
  useApproveBlogPost,
  useCreateAndPublishBlogPost,
  useCreateBlogPost,
  useDeleteBlogPost,
  useGetAllBlogPostsAdmin,
  useRejectBlogPost,
  useUpdateBlogPost,
} from "../../hooks/useAdmin";

type PostFormState = {
  title: string;
  content: string;
  author: string;
  tags: string;
  coverImageId: string;
};

const emptyForm: PostFormState = {
  title: "",
  content: "",
  author: "",
  tags: "",
  coverImageId: "",
};

export default function BlogPostsPanel() {
  const { data: posts, isLoading } = useGetAllBlogPostsAdmin();
  const approveMutation = useApproveBlogPost();
  const rejectMutation = useRejectBlogPost();
  const createMutation = useCreateBlogPost();
  const createAndPublishMutation = useCreateAndPublishBlogPost();
  const updateMutation = useUpdateBlogPost();
  const deleteMutation = useDeleteBlogPost();

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [newPost, setNewPost] = useState<PostFormState>(emptyForm);

  // Edit dialog state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState<PostFormState>(emptyForm);

  // Delete dialog state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const isSubmitting =
    createMutation.isPending || createAndPublishMutation.isPending;

  /* ─── Create handlers ─── */

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Blog post published successfully!");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to publish post";
      toast.error(msg);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success("Blog post rejected");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to reject post";
      toast.error(msg);
    }
  };

  const resetCreateForm = () => {
    setNewPost(emptyForm);
    setPublishImmediately(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPost.title || !newPost.content || !newPost.author) {
      toast.error("Please fill in all required fields");
      return;
    }

    const input = {
      title: newPost.title,
      content: newPost.content,
      author: newPost.author,
      tags: newPost.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverImageId: newPost.coverImageId || undefined,
    };

    try {
      if (publishImmediately) {
        await createAndPublishMutation.mutateAsync(input);
        toast.success("Blog post published successfully!");
      } else {
        await createMutation.mutateAsync(input);
        toast.success("Blog post saved as draft");
      }
      setIsCreateDialogOpen(false);
      resetCreateForm();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to create post";
      toast.error(msg);
    }
  };

  /* ─── Edit handlers ─── */

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      content: post.content,
      author: post.author,
      tags: post.tags.join(", "),
      coverImageId: post.coverImageId ?? "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    if (!editForm.title || !editForm.content || !editForm.author) {
      toast.error("Please fill in all required fields");
      return;
    }

    const input = {
      title: editForm.title,
      content: editForm.content,
      author: editForm.author,
      tags: editForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverImageId: editForm.coverImageId || undefined,
    };

    try {
      await updateMutation.mutateAsync({ id: editingPost.id, input });
      toast.success("Blog post updated successfully!");
      setEditingPost(null);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update post";
      toast.error(msg);
    }
  };

  /* ─── Delete handlers ─── */

  const handleDelete = async () => {
    if (!deletingPostId) return;
    try {
      await deleteMutation.mutateAsync(deletingPostId);
      toast.success("Blog post deleted");
      setDeletingPostId(null);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to delete post";
      toast.error(msg);
    }
  };

  /* ─── UI helpers ─── */

  const getStatusBadge = (status: BlogPost["status"]) => {
    const styles = {
      pending:
        "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      approved:
        "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      rejected:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ─── Shared form fields renderer ─── */

  const renderFormFields = (
    form: PostFormState,
    onChange: (patch: Partial<PostFormState>) => void,
    idPrefix: string,
  ) => (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter a compelling post title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-author`}>
          Author <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-author`}
          value={form.author}
          onChange={(e) => onChange({ author: e.target.value })}
          placeholder="Author name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-content`}>
          Content <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`${idPrefix}-content`}
          value={form.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Write your post content here..."
          rows={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-tags`}>Tags (comma-separated)</Label>
        <Input
          id={`${idPrefix}-tags`}
          value={form.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          placeholder="technology, tips, tutorial"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-coverImage`}>Cover Image URL</Label>
        <Input
          id={`${idPrefix}-coverImage`}
          value={form.coverImageId}
          onChange={(e) => onChange({ coverImageId: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-ocid="blog.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Blog Posts</h2>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 gap-2"
              data-ocid="blog.open_modal_button"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>

          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            data-ocid="blog.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Create New Blog Post
              </DialogTitle>
              <DialogDescription>
                Fill in the details below. Toggle "Publish immediately" to go
                live right away.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              {/* Publish Immediately Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap
                      className={`h-4 w-4 transition-colors ${
                        publishImmediately
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Label
                      htmlFor="publish-immediately"
                      className="text-sm font-semibold cursor-pointer"
                    >
                      Publish immediately
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {publishImmediately
                      ? "Post will go live right away — visible to all readers"
                      : "Post will be saved as a draft — approve it later"}
                  </p>
                </div>
                <Switch
                  id="publish-immediately"
                  checked={publishImmediately}
                  onCheckedChange={setPublishImmediately}
                  data-ocid="blog.switch"
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              {renderFormFields(
                newPost,
                (patch) => setNewPost((p) => ({ ...p, ...patch })),
                "create",
              )}

              <div className="flex gap-3 justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                  data-ocid="blog.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={
                    publishImmediately
                      ? "bg-green-600 hover:bg-green-700 text-white gap-2"
                      : "gap-2"
                  }
                  data-ocid="blog.submit_button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {publishImmediately ? "Publishing..." : "Saving draft..."}
                    </>
                  ) : publishImmediately ? (
                    <>
                      <Rocket className="h-4 w-4" />
                      Publish Now
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Posts Table ── */}
      {!posts || posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-muted-foreground gap-3"
          data-ocid="blog.empty_state"
        >
          <FileText className="h-10 w-10 opacity-30" />
          <p className="font-medium">No blog posts yet</p>
          <p className="text-sm">
            Create your first post using the button above.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="blog.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post, index) => (
                <TableRow
                  key={post.id}
                  className="hover:bg-muted/30 transition-colors"
                  data-ocid={`blog.item.${index + 1}`}
                >
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(post.publishedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {/* Publish for pending */}
                      {post.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(post.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                          data-ocid={`blog.primary_button.${index + 1}`}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Rocket className="h-3.5 w-3.5" />
                          )}
                          Publish
                        </Button>
                      )}
                      {/* Restore for rejected */}
                      {post.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(post.id)}
                          disabled={approveMutation.isPending}
                          className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 gap-1 text-xs"
                          data-ocid={`blog.secondary_button.${index + 1}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                      )}
                      {/* Reject */}
                      {post.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(post.id)}
                          disabled={rejectMutation.isPending}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {/* Edit */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(post)}
                        className="hover:bg-chart-1/10 hover:text-chart-1 hover:border-chart-1/30"
                        data-ocid={`blog.edit_button.${index + 1}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingPostId(post.id)}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        data-ocid={`blog.delete_button.${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog
        open={!!editingPost}
        onOpenChange={(open) => {
          if (!open) setEditingPost(null);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="blog.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit2 className="h-5 w-5" />
              Edit Blog Post
            </DialogTitle>
            <DialogDescription>
              Update the post details below and save your changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-5 pt-2">
            {renderFormFields(
              editForm,
              (patch) => setEditForm((p) => ({ ...p, ...patch })),
              "edit",
            )}

            <div className="flex gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPost(null)}
                disabled={updateMutation.isPending}
                data-ocid="blog.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2"
                data-ocid="blog.edit.save_button"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deletingPostId}
        onOpenChange={(open) => {
          if (!open) setDeletingPostId(null);
        }}
      >
        <AlertDialogContent data-ocid="blog.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="blog.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
              data-ocid="blog.delete.confirm_button"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
