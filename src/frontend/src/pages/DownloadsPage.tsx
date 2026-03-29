import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Package, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { FilePost } from "../backend";
import { FileType } from "../backend";
import SEO from "../components/SEO";
import { useActor } from "../hooks/useActor";

function SpiderWeb({
  className,
  style,
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      aria-hidden="true"
    >
      <line x1="100" y1="100" x2="100" y2="0" />
      <line x1="100" y1="100" x2="170" y2="29" />
      <line x1="100" y1="100" x2="200" y2="100" />
      <line x1="100" y1="100" x2="170" y2="171" />
      <line x1="100" y1="100" x2="100" y2="200" />
      <line x1="100" y1="100" x2="30" y2="171" />
      <line x1="100" y1="100" x2="0" y2="100" />
      <line x1="100" y1="100" x2="30" y2="29" />
      <ellipse cx="100" cy="100" rx="20" ry="20" />
      <ellipse cx="100" cy="100" rx="45" ry="45" />
      <ellipse cx="100" cy="100" rx="70" ry="70" />
      <ellipse cx="100" cy="100" rx="95" ry="95" />
    </svg>
  );
}

type FilterCategory = "All" | "APK" | "PDF" | "DOC" | "Other";

function getFileIcon(fileType: FileType): string {
  switch (fileType) {
    case FileType.APK:
      return "📱";
    case FileType.PDF:
      return "📄";
    case FileType.DOC:
      return "📝";
    case FileType.TXT:
      return "📋";
    case FileType.EXE:
      return "⚙️";
    default:
      return "📦";
  }
}

function getFileTypeLabel(fileType: FileType): string {
  switch (fileType) {
    case FileType.APK:
      return "APK";
    case FileType.PDF:
      return "PDF";
    case FileType.DOC:
      return "Document";
    case FileType.TXT:
      return "Text";
    case FileType.EXE:
      return "EXE";
    default:
      return "File";
  }
}

function formatDate(timestamp: bigint) {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FileCard({ file, index }: { file: FilePost; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="web-swing"
      style={{ animationDelay: `${index * 0.07}s` }}
      data-ocid={`downloads.item.${index + 1}`}
    >
      <div
        className="relative rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
        style={{
          background: "linear-gradient(145deg, #150005, #0a001a)",
          border: "1px solid #7f1d1d",
          boxShadow: "0 4px 24px rgba(204,0,0,0.08)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: "linear-gradient(90deg, #cc0000, #1e3a8a, transparent)",
          }}
        />

        <div className="p-5 flex flex-col gap-4">
          {/* Icon + Type Badge */}
          <div className="flex items-start justify-between">
            <div
              className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl spider-pulse"
              style={{
                background: "linear-gradient(135deg, #7f1d1d33, #1e3a8a22)",
                border: "1px solid #991b1b55",
              }}
            >
              {getFileIcon(file.fileType)}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "#7f1d1d",
                  color: "#fca5a5",
                  border: "1px solid #dc2626",
                }}
              >
                {getFileTypeLabel(file.fileType)}
              </span>
              {file.version && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "#1e3a8a33",
                    color: "#93c5fd",
                    border: "1px solid #1e3a8a",
                  }}
                >
                  v{file.version}
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3
              className="font-bold text-base line-clamp-2"
              style={{ color: "#f5f5f5" }}
            >
              {file.title}
            </h3>
            {file.description && (
              <p className="text-sm line-clamp-2" style={{ color: "#a1a1aa" }}>
                {file.description}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            {file.fileSize && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "#ffffff0a",
                  color: "#888",
                  border: "1px solid #333",
                }}
              >
                {file.fileSize}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "#ffffff0a",
                color: "#888",
                border: "1px solid #333",
              }}
            >
              {formatDate(file.uploadedAt)}
            </span>
            {file.category && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "#ffffff0a",
                  color: "#888",
                  border: "1px solid #333",
                }}
              >
                {file.category}
              </span>
            )}
          </div>

          {/* Download Button */}
          <a
            href={file.fileUrl}
            download={file.title}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #cc0000, #991b1b)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(204,0,0,0.3)",
            }}
            data-ocid={`downloads.download_button.${index + 1}`}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function DownloadsPage() {
  const { actor, isFetching } = useActor();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");

  const { data: files, isLoading } = useQuery<FilePost[]>({
    queryKey: ["files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const categories: FilterCategory[] = ["All", "APK", "PDF", "DOC", "Other"];

  const filtered = (files ?? []).filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "APK" && f.fileType === FileType.APK) ||
      (activeCategory === "PDF" && f.fileType === FileType.PDF) ||
      (activeCategory === "DOC" &&
        (f.fileType === FileType.DOC || f.fileType === FileType.TXT)) ||
      (activeCategory === "Other" &&
        (f.fileType === FileType.EXE || f.fileType === FileType.OTHER));

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEO
        title="Downloads"
        description="Download APKs, PDFs, and documents from ByteWay"
      />

      <div style={{ background: "#080010", minHeight: "100vh" }}>
        {/* Hero Section */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #0a0000 0%, #00001a 50%, #0a0000 100%)",
            borderBottom: "1px solid #7f1d1d",
            padding: "60px 24px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Spider web decorations */}
          <SpiderWeb
            className="absolute -top-4 -right-4 w-72 h-72"
            style={{ color: "#cc0000", opacity: 0.08 }}
          />
          <SpiderWeb
            className="absolute -bottom-4 -left-4 w-56 h-56"
            style={{ color: "#1e3a8a", opacity: 0.07 }}
          />

          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto relative z-10"
          >
            <div
              style={{
                fontSize: 13,
                color: "#f87171",
                background: "#7f1d1d33",
                border: "1px solid #991b1b",
                borderRadius: 99,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 16px",
                marginBottom: 16,
              }}
            >
              <Package style={{ width: 13, height: 13 }} />
              Files &amp; Resources
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                background:
                  "linear-gradient(135deg, #ff4444 0%, #cc0000 40%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              📱 Downloads &amp; Files
            </h1>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: 16,
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              Download APKs, documents, PDFs and more — all in one place.
            </p>
          </motion.div>
        </div>

        <div className="container py-10">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search + Filter */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#f87171" }}
                />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  style={{
                    background: "#150005",
                    border: "1px solid #7f1d1d",
                    color: "#f5f5f5",
                  }}
                  data-ocid="downloads.search_input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#71717a" }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
                    style={{
                      background:
                        activeCategory === cat ? "#cc0000" : "#150005",
                      color: activeCategory === cat ? "#fff" : "#a1a1aa",
                      border:
                        activeCategory === cat
                          ? "1px solid #ef4444"
                          : "1px solid #7f1d1d55",
                      boxShadow:
                        activeCategory === cat
                          ? "0 0 12px rgba(204,0,0,0.4)"
                          : "none",
                    }}
                    data-ocid="downloads.filter.tab"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Loading */}
            {isLoading && (
              <div
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                data-ocid="downloads.loading_state"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 space-y-4"
                    style={{
                      background: "#150005",
                      border: "1px solid #7f1d1d",
                    }}
                  >
                    <div className="flex justify-between">
                      <Skeleton
                        className="h-14 w-14 rounded-2xl"
                        style={{ background: "#2a0a0a" }}
                      />
                      <Skeleton
                        className="h-6 w-16 rounded-full"
                        style={{ background: "#2a0a0a" }}
                      />
                    </div>
                    <Skeleton
                      className="h-5 w-3/4"
                      style={{ background: "#2a0a0a" }}
                    />
                    <Skeleton
                      className="h-4 w-full"
                      style={{ background: "#2a0a0a" }}
                    />
                    <Skeleton
                      className="h-10 w-full rounded-xl"
                      style={{ background: "#2a0a0a" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 rounded-2xl gap-4"
                style={{ border: "1px dashed #7f1d1d", color: "#71717a" }}
                data-ocid="downloads.empty_state"
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#150005",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                  }}
                >
                  📦
                </div>
                <div className="text-center space-y-1">
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: "#f5f5f5" }}
                  >
                    {searchQuery || activeCategory !== "All"
                      ? "No files match"
                      : "No files yet"}
                  </h2>
                  <p className="text-sm">
                    {searchQuery || activeCategory !== "All"
                      ? "Try changing your search or filter"
                      : "Files will appear here once uploaded by admin"}
                  </p>
                  {(searchQuery || activeCategory !== "All") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("All");
                      }}
                      className="mt-2"
                      style={{ color: "#f87171" }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Files Grid */}
            {!isLoading && filtered.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((file, index) => (
                  <FileCard key={file.id} file={file} index={index} />
                ))}
              </div>
            )}

            {/* Stats bar */}
            {!isLoading && (files ?? []).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 pt-4"
                style={{ borderTop: "1px solid #7f1d1d33" }}
              >
                <FileText className="h-4 w-4" style={{ color: "#f87171" }} />
                <span className="text-sm" style={{ color: "#71717a" }}>
                  {filtered.length} of {files?.length} files
                </span>
                {(files ?? []).some((f) => f.fileType === FileType.APK) && (
                  <Badge
                    style={{
                      background: "#7f1d1d33",
                      color: "#fca5a5",
                      border: "1px solid #991b1b",
                    }}
                  >
                    APKs available
                  </Badge>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
