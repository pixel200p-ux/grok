import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMilestones, fetchProfile, saveProfile, type ProfilePayload } from "@/lib/api/profile";
import { toast } from "sonner";

export const PROFILE_KEY = ["profile"] as const;
export const MILESTONES_KEY = ["milestones"] as const;

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: () => fetchProfile(), staleTime: 10_000 });
}

export function useMilestones() {
  return useQuery({ queryKey: MILESTONES_KEY, queryFn: () => fetchMilestones(), staleTime: 30_000 });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof saveProfile>[0]) => saveProfile(data),
    onSuccess: (data: ProfilePayload) => {
      qc.setQueryData(PROFILE_KEY, data);
      toast.success("Đã lưu Profile");
    },
    onError: (err: Error) => toast.error(err.message || "Không lưu được Profile"),
  });
}