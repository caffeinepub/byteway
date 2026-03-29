import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VideoInput, VideoPost } from "../types/video";
import { useActor } from "./useActor";

export type { VideoPost, VideoInput };

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useCreateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VideoInput): Promise<string> => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.createVideo(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUpdateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: string; input: VideoInput }): Promise<void> => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.updateVideo(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.deleteVideo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
