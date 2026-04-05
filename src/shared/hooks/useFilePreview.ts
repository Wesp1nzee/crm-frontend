import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../../entities/mail/api";

/**
 * Hook for managing file preview state and URL fetching.
 * Lazily fetches the presigned preview URL when a file is selected.
 */
export function useFilePreview(token: string) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewContentType, setPreviewContentType] = useState("");

  const isOpen = previewFileId !== null;

  const previewUrlQuery = useQuery({
    queryKey: ["oversized-preview-url", token, previewFileId],
    queryFn: async () => {
      if (!token || !previewFileId) return null;
      const response = await mailApi.getOversizedPreviewUrl(token, previewFileId);
      return response.data;
    },
    enabled: Boolean(token && previewFileId),
    staleTime: 1000 * 60 * 4, // 4 minutes (presigned URLs expire)
    retry: 1,
  });

  const openPreview = useCallback(
    (fileId: string, filename: string, contentType: string) => {
      setPreviewFileId(fileId);
      setPreviewFilename(filename);
      setPreviewContentType(contentType);
    },
    [],
  );

  const closePreview = useCallback(() => {
    setPreviewFileId(null);
    setPreviewFilename("");
    setPreviewContentType("");
  }, []);

  const previewUrl = previewUrlQuery.data?.url ?? null;

  return {
    isOpen,
    previewFileId,
    previewFilename,
    previewContentType,
    previewUrl,
    previewUrlLoading: previewUrlQuery.isLoading,
    previewUrlError: previewUrlQuery.error,
    openPreview,
    closePreview,
  };
}
