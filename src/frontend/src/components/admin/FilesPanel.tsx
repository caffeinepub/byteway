import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderDown, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { FileInput, FilePost } from "../../backend";
import { FileType } from "../../backend";
import { useActor } from "../../hooks/useActor";

const defaultForm: FileInput = {
  title: "",
  description: "",
  fileSize: "",
  fileType: FileType.OTHER,
  version: "",
  category: "",
  fileUrl: "",
};

export default function FilesPanel() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FileInput>(defaultForm);

  const { data: files, isLoading } = useQuery<FilePost[]>({
    queryKey: ["admin-files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const input: FileInput = {
        ...form,
        version: form.version || undefined,
      };
      return actor.createFile(input);
    },
    onSuccess: () => {
      toast.success("File added successfully!");
      setForm(defaultForm);
      queryClient.invalidateQueries({ queryKey: ["admin-files"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error("Failed to add file."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFile(id);
    },
    onSuccess: () => {
      toast.success("File deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-files"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error("Failed to delete file."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.fileUrl) {
      toast.error("Title and File URL are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-8">
      {/* Add File Form */}
      <div className="rounded-2xl border border-border p-6 space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FolderDown className="h-5 w-5 text-primary" />
          Add New File
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-title">Title *</Label>
              <Input
                id="file-title"
                placeholder="e.g. ByteWay App v2.0"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="admin.files.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-url">File URL *</Label>
              <Input
                id="file-url"
                placeholder="https://..."
                value={form.fileUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fileUrl: e.target.value }))
                }
                data-ocid="admin.files.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-type">File Type</Label>
              <Select
                value={form.fileType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, fileType: v as FileType }))
                }
              >
                <SelectTrigger data-ocid="admin.files.select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FileType.APK}>📱 APK</SelectItem>
                  <SelectItem value={FileType.PDF}>📄 PDF</SelectItem>
                  <SelectItem value={FileType.DOC}>📝 Document</SelectItem>
                  <SelectItem value={FileType.TXT}>📋 Text</SelectItem>
                  <SelectItem value={FileType.EXE}>⚙️ EXE</SelectItem>
                  <SelectItem value={FileType.OTHER}>📦 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-size">File Size</Label>
              <Input
                id="file-size"
                placeholder="e.g. 24.5 MB"
                value={form.fileSize}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fileSize: e.target.value }))
                }
                data-ocid="admin.files.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-version">Version (optional)</Label>
              <Input
                id="file-version"
                placeholder="e.g. 2.0.1"
                value={form.version ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, version: e.target.value }))
                }
                data-ocid="admin.files.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-category">Category</Label>
              <Input
                id="file-category"
                placeholder="e.g. Tools, Games, Documents"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                data-ocid="admin.files.input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-desc">Description</Label>
            <Textarea
              id="file-desc"
              placeholder="Short description of the file..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              data-ocid="admin.files.textarea"
            />
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-ocid="admin.files.submit_button"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              "Add File"
            )}
          </Button>
        </form>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">All Files ({files?.length ?? 0})</h2>

        {isLoading && (
          <div
            className="flex justify-center py-8"
            data-ocid="admin.files.loading_state"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!files || files.length === 0) && (
          <div
            className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground"
            data-ocid="admin.files.empty_state"
          >
            No files uploaded yet.
          </div>
        )}

        {(files ?? []).map((file, i) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
            data-ocid={`admin.files.item.${i + 1}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {file.fileType === FileType.APK
                  ? "📱"
                  : file.fileType === FileType.PDF
                    ? "📄"
                    : file.fileType === FileType.DOC
                      ? "📝"
                      : "📦"}
              </span>
              <div>
                <p className="font-semibold text-sm">{file.title}</p>
                <p className="text-xs text-muted-foreground">
                  {file.fileType} · {file.fileSize || "Unknown size"} ·{" "}
                  {file.category || "Uncategorized"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(file.id)}
              disabled={deleteMutation.isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-ocid={`admin.files.delete_button.${i + 1}`}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
