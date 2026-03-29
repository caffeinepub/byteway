import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye, Play, Search, VideoOff, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import SEO from "../components/SEO";
import { useSearch } from "../context/SearchContext";
import { useGetAllVideos } from "../hooks/useVideos";
import type { VideoPost } from "../types/video";

function SpiderWeb({
  className,
  style,
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      aria-hidden="true"
      style={style}
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

function formatDate(timestamp: bigint) {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function seedViewCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash % 9800) + 200;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const filmHoles = Array.from({ length: 40 }, (_, i) => i);

function VideoCard({
  video,
  index,
  onPlay,
}: { video: VideoPost; index: number; onPlay: (v: VideoPost) => void }) {
  const views = seedViewCount(video.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      style={{
        background: "#1a0a0a",
        border: "1px solid #7f1d1d",
        borderRadius: "16px",
        overflow: "hidden",
      }}
      className="group hover:shadow-2xl transition-all duration-300"
      data-ocid={`videos.item.${index + 1}`}
    >
      {/* Video Thumbnail + Overlay */}
      <button
        type="button"
        className="relative overflow-hidden cursor-pointer w-full block"
        style={{
          aspectRatio: "16/9",
          background: "#0a0000",
          border: "none",
          padding: 0,
        }}
        onClick={() => onPlay(video)}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at center, #7f1d1d 0%, #0a0000 70%)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#cc0000",
                boxShadow: "0 0 40px #cc000088",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#cc0000",
              boxShadow: "0 0 32px #cc0000aa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play className="h-8 w-8 text-white" fill="white" />
          </div>
        </div>

        {/* View count badge */}
        <div
          className="absolute bottom-2 left-2"
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#ff4444",
            fontSize: 11,
            borderRadius: 4,
            padding: "2px 7px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Eye style={{ width: 11, height: 11 }} />
          {formatViews(views)} views
        </div>
      </button>

      {/* Card Info */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          className="text-left w-full group/title"
          onClick={() => onPlay(video)}
        >
          <h2
            className="text-base font-bold line-clamp-2 transition-colors duration-200 group-hover/title:text-red-400"
            style={{ color: "#f5f5f5" }}
          >
            {video.title}
          </h2>
        </button>

        {video.description && (
          <p className="text-sm line-clamp-2" style={{ color: "#a1a1aa" }}>
            {video.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span
            className="text-xs"
            style={{
              color: "#f87171",
              background: "#7f1d1d33",
              border: "1px solid #991b1b",
              borderRadius: 4,
              padding: "2px 8px",
            }}
          >
            {formatDate(video.uploadedAt)}
          </span>

          {/* Download Button */}
          <a
            href={video.videoUrl}
            download={`${video.title}.mp4`}
            onClick={(e) => e.stopPropagation()}
            className="video-dl-btn flex items-center gap-1 transition-colors"
            style={{
              background: "#7f1d1d",
              color: "#fca5a5",
              border: "1px solid #dc2626",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
            data-ocid={`videos.download_button.${index + 1}`}
          >
            <Download style={{ width: 13, height: 13 }} />
            Download
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function VideoModalPlayer({
  url,
  thumbnail,
}: { url: string; thumbnail?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  function handleLoadedMetadata() {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
    }
  }

  function handleError(e: React.SyntheticEvent<HTMLVideoElement>) {
    console.error("Video load error:", e);
    setVideoError(true);
  }

  if (videoError) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center rounded-lg"
        style={{ aspectRatio: "16/9", background: "#0a0000", color: "#f87171" }}
      >
        <VideoOff className="h-12 w-12 mb-3 opacity-60" />
        <p className="text-sm">
          Failed to load video. Try downloading instead.
        </p>
      </div>
    );
  }

  return (
    /* biome-ignore lint/a11y/useMediaCaption: user-uploaded content */
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      crossOrigin="anonymous"
      poster={thumbnail}
      className="w-full rounded-lg"
      style={{ aspectRatio: "16/9", background: "#000" }}
      onLoadedMetadata={handleLoadedMetadata}
      onError={handleError}
      data-ocid="videos.canvas_target"
    >
      <source src={url} type="video/mp4" />
      <source src={url} type="video/webm" />
      <source src={url} type="video/ogg" />
    </video>
  );
}

export default function VideosPage() {
  const { data: videos, isLoading } = useGetAllVideos();
  const { searchQuery, setSearchQuery } = useSearch();
  const [activeVideo, setActiveVideo] = useState<VideoPost | null>(null);

  const q = searchQuery.toLowerCase();
  const filteredVideos =
    searchQuery.length >= 1
      ? (videos ?? []).filter(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            (v.description ?? "").toLowerCase().includes(q),
        )
      : (videos ?? []);

  return (
    <>
      <SEO title="Videos" description="Watch and download videos on ByteWay" />

      {/* Page wrapper — Spider-Man cinema dark theme */}
      <div style={{ background: "#080008", minHeight: "100vh" }}>
        {/* Animated Hero Banner */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #0a0000 0%, #1a0010 40%, #00001a 100%)",
            borderBottom: "1px solid #7f1d1d",
            padding: "60px 24px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Spider Web Decoration */}
          <SpiderWeb
            className="absolute -top-8 -right-8 w-64 h-64 web-spread"
            style={{ color: "#cc0000", opacity: 0.08 } as React.CSSProperties}
          />
          <SpiderWeb
            className="absolute -bottom-8 -left-8 w-48 h-48 web-spread"
            style={
              {
                color: "#1e3a8a",
                opacity: 0.06,
                animationDelay: "0.5s",
              } as React.CSSProperties
            }
          />

          {/* Film strip top */}
          <div
            className="absolute top-0 left-0 right-0 h-6 flex gap-2 overflow-hidden"
            style={{ background: "#111", opacity: 0.25 }}
          >
            {filmHoles.map((i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 18,
                  background: "#cc0000",
                  borderRadius: 2,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
            ))}
          </div>
          {/* Film strip bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-6 flex gap-2 overflow-hidden"
            style={{ background: "#111", opacity: 0.25 }}
          >
            {filmHoles.map((i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 18,
                  background: "#1e3a8a",
                  borderRadius: 2,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
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
              <Play style={{ width: 13, height: 13 }} />
              Cinema Collection
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                background:
                  "linear-gradient(135deg, #ff4444 0%, #cc0000 40%, #1e3a8a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              🎬 Video Gallery
            </h1>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: 16,
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              Watch, explore, and download our curated video collection.
            </p>
          </motion.div>
        </div>

        <div className="container py-10">
          <div className="max-w-6xl mx-auto">
            {/* Active search badge */}
            {searchQuery && (
              <div className="flex items-center gap-2 mb-6 animate-in fade-in duration-300">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                  style={{
                    background: "#7f1d1d33",
                    color: "#fca5a5",
                    border: "1px solid #991b1b",
                  }}
                >
                  <Search className="h-3.5 w-3.5" />
                  Searching: <span className="font-bold">{searchQuery}</span>
                </Badge>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: "#71717a" }}
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                data-ocid="videos.loading_state"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 16,
                      border: "1px solid #7f1d1d",
                      overflow: "hidden",
                      background: "#1a0a0a",
                    }}
                  >
                    <Skeleton
                      className="w-full"
                      style={{ aspectRatio: "16/9", background: "#2a0a0a" }}
                    />
                    <div className="p-4 space-y-3">
                      <Skeleton
                        className="h-5 w-3/4"
                        style={{ background: "#2a0a0a" }}
                      />
                      <Skeleton
                        className="h-4 w-full"
                        style={{ background: "#2a0a0a" }}
                      />
                      <Skeleton
                        className="h-4 w-1/3"
                        style={{ background: "#2a0a0a" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && (!videos || videos.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 rounded-2xl gap-4"
                style={{ border: "1px dashed #7f1d1d", color: "#71717a" }}
                data-ocid="videos.empty_state"
              >
                <div
                  style={{
                    padding: 24,
                    borderRadius: "50%",
                    background: "#1a0a0a",
                  }}
                >
                  <VideoOff
                    className="h-12 w-12"
                    style={{ color: "#cc0000", opacity: 0.5 }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: "#f5f5f5" }}
                  >
                    No videos yet
                  </h2>
                  <p className="text-sm">
                    Videos will appear here once uploaded.
                  </p>
                </div>
              </motion.div>
            )}

            {/* No results */}
            {!isLoading &&
              videos &&
              videos.length > 0 &&
              filteredVideos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 rounded-2xl gap-4"
                  style={{ border: "1px dashed #7f1d1d", color: "#71717a" }}
                >
                  <Search
                    className="h-10 w-10"
                    style={{ color: "#cc0000", opacity: 0.5 }}
                  />
                  <div className="text-center">
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: "#f5f5f5" }}
                    >
                      No videos match
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-sm underline underline-offset-4 mt-2"
                      style={{ color: "#f87171" }}
                    >
                      Clear search
                    </button>
                  </div>
                </motion.div>
              )}

            {/* Videos Grid */}
            {!isLoading && filteredVideos.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    index={index}
                    onPlay={setActiveVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <Dialog
            open={!!activeVideo}
            onOpenChange={(open) => !open && setActiveVideo(null)}
          >
            <DialogContent
              className="max-w-4xl w-full p-0 overflow-hidden"
              style={{ background: "#0a0000", border: "1px solid #7f1d1d" }}
            >
              <div className="p-4" style={{ background: "#110000" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-lg font-bold truncate pr-4"
                    style={{ color: "#fca5a5" }}
                  >
                    {activeVideo.title}
                  </h3>
                  <a
                    href={activeVideo.videoUrl}
                    download={`${activeVideo.title}.mp4`}
                    className="flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: "#7f1d1d",
                      color: "#fca5a5",
                      border: "1px solid #dc2626",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                    data-ocid="videos.modal_download_button"
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Download
                  </a>
                </div>
                <VideoModalPlayer
                  url={activeVideo.videoUrl}
                  thumbnail={activeVideo.thumbnailUrl}
                />
                {activeVideo.description && (
                  <p className="mt-3 text-sm" style={{ color: "#a1a1aa" }}>
                    {activeVideo.description}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
