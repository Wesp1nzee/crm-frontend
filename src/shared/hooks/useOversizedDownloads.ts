import { useCallback, useRef, useState } from "react";
import { mailApi } from "../../entities/mail/api";
import { notificationService } from "../services/notifications";

export type DownloadState = "idle" | "loading" | "success" | "error" | "cancelled";

export interface FileDownloadProgress {
  fileId: string;
  progress: number; // 0-100
  state: DownloadState;
}

export interface BatchDownloadProgress {
  state: DownloadState;
  total: number;
  completed: number;
  failed: number;
  files: Map<string, FileDownloadProgress>;
}

/**
 * Hook for managing oversized file downloads with progress tracking and cancellation.
 * Uses AbortController for cancellable downloads.
 */
export function useOversizedDownloads(token: string, password?: string) {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const batchAbortRef = useRef<AbortController | null>(null);

  const [fileProgress, setFileProgress] = useState<Map<string, FileDownloadProgress>>(new Map());
  const [batchProgress, setBatchProgress] = useState<BatchDownloadProgress>({
    state: "idle",
    total: 0,
    completed: 0,
    failed: 0,
    files: new Map(),
  });

  /**
   * Download a single file with progress tracking.
   * Triggers browser download by creating a blob URL.
   */
  const downloadFile = useCallback(
    async (fileId: string, filename: string) => {
      // Cancel any existing download for this file
      cancelFile(fileId);

      const controller = new AbortController();
      abortControllersRef.current.set(fileId, controller);

      setFileProgress((prev) => {
        const next = new Map(prev);
        next.set(fileId, { fileId, progress: 0, state: "loading" });
        return next;
      });

      try {
        const response = await mailApi.downloadOversizedFile(
          token,
          fileId,
          (pct) => {
            setFileProgress((prev) => {
              const next = new Map(prev);
              const existing = next.get(fileId);
              if (existing) {
                next.set(fileId, { ...existing, progress: pct });
              }
              return next;
            });
          },
          controller.signal,
          password,
        );

        // Create blob URL and trigger download
        const blob = new Blob([response.data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFileProgress((prev) => {
          const next = new Map(prev);
          next.set(fileId, { fileId, progress: 100, state: "success" });
          return next;
        });

        notificationService.success(`Файл "${filename}" загружен`);
      } catch (err: unknown) {
        const isCancelled = (err as { name?: string })?.name === "CanceledError" ||
          (err as { code?: string })?.code === "ERR_CANCELED";

        if (isCancelled) {
          setFileProgress((prev) => {
            const next = new Map(prev);
            next.set(fileId, { fileId, progress: 0, state: "cancelled" });
            return next;
          });
        } else {
          setFileProgress((prev) => {
            const next = new Map(prev);
            next.set(fileId, { fileId, progress: 0, state: "error" });
            return next;
          });
          notificationService.error(`Ошибка загрузки "${filename}"`);
        }
      } finally {
        abortControllersRef.current.delete(fileId);
      }
    },
    [token, password],
  );

  /**
   * Cancel a single file download.
   */
  const cancelFile = useCallback((fileId: string) => {
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
    }
  }, []);

  /**
   * Reset progress for a specific file.
   */
  const resetFile = useCallback((fileId: string) => {
    setFileProgress((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  /**
   * Reset all progress.
   */
  const resetAll = useCallback(() => {
    // Cancel all active downloads
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current.clear();
    if (batchAbortRef.current) {
      batchAbortRef.current.abort();
      batchAbortRef.current = null;
    }
    setFileProgress(new Map());
    setBatchProgress({ state: "idle", total: 0, completed: 0, failed: 0, files: new Map() });
  }, []);

  /**
   * Download multiple files in parallel with concurrency limit of 3.
   * Uses the /download-all endpoint to get presigned URLs, then fetches them.
   */
  const downloadBatch = useCallback(
    async (fileIds: string[], files: Array<{ id: string; filename: string }>) => {
      if (fileIds.length === 0) return;

      resetAll();

      const controller = new AbortController();
      batchAbortRef.current = controller;

      setBatchProgress({
        state: "loading",
        total: fileIds.length,
        completed: 0,
        failed: 0,
        files: new Map(
          fileIds.map((fid) => [fid, { fileId: fid, progress: 0, state: "loading" }]),
        ),
      });

      // NOTE: Try to use download-all endpoint for presigned URLs.
      // If the backend doesn't support it, fall back to individual downloads.
      try {
        const urlsResponse = await mailApi.getOversizedDownloadAll(token, password);
        const urlMap = new Map(urlsResponse.data.map((item) => [item.file_id, item.url]));

        // Concurrency-limited parallel downloads
        const CONCURRENCY = 3;
        let completed = 0;
        let failed = 0;

        const queue = [...fileIds];
        const running: Promise<void>[] = [];

        const runNext = async () => {
          while (queue.length > 0 && !controller.signal.aborted) {
            const fileId = queue.shift()!;
            const fileMeta = files.find((f) => f.id === fileId);
            if (!fileMeta) continue;

            const presignedUrl = urlMap.get(fileId);
            if (!presignedUrl) {
              // Fallback: use individual download endpoint
              try {
                await downloadFile(fileId, fileMeta.filename);
              } catch {
                failed++;
              }
              continue;
            }

            try {
              // Update progress
              setBatchProgress((prev) => {
                const nextFiles = new Map(prev.files);
                nextFiles.set(fileId, { fileId, progress: 0, state: "loading" });
                return { ...prev, files: nextFiles };
              });

              const fetchResp = await fetch(presignedUrl, { signal: controller.signal });
              if (!fetchResp.ok) throw new Error(`HTTP ${fetchResp.status}`);

              const contentLength = fetchResp.headers.get("content-length");
              const total = contentLength ? parseInt(contentLength, 10) : 0;

              const reader = fetchResp.body?.getReader();
              if (!reader) {
                // No streaming support, just get the blob
                const blob = await fetchResp.blob();
                const url = URL.createObjectURL(blob);
                triggerBrowserDownload(url, fileMeta.filename);
                completed++;
                setBatchProgress((prev) => ({
                  ...prev,
                  completed,
                  failed,
                  files: new Map(prev.files).set(fileId, { fileId, progress: 100, state: "success" }),
                }));
                continue;
              }

              // Stream with progress
              let loaded = 0;
              const chunks: Uint8Array[] = [];
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                if (total) {
                  const pct = Math.round((loaded * 100) / total);
                  setBatchProgress((prev) => {
                    const nextFiles = new Map(prev.files);
                    const fp = nextFiles.get(fileId);
                    if (fp) nextFiles.set(fileId, { ...fp, progress: pct });
                    return { ...prev, files: nextFiles };
                  });
                }
              }

              const blob = new Blob(chunks as BlobPart[]);
              const url = URL.createObjectURL(blob);
              triggerBrowserDownload(url, fileMeta.filename);
              completed++;

              setBatchProgress((prev) => {
                const nextFiles = new Map(prev.files);
                nextFiles.set(fileId, { fileId, progress: 100, state: "success" });
                return { ...prev, completed, failed, files: nextFiles };
              });
            } catch {
              failed++;
              setBatchProgress((prev) => {
                const nextFiles = new Map(prev.files);
                nextFiles.set(fileId, { fileId, progress: 0, state: "error" });
                return { ...prev, failed, files: nextFiles };
              });
            }
          }
        };

        // Start initial workers
        for (let i = 0; i < Math.min(CONCURRENCY, fileIds.length); i++) {
          running.push(runNext());
        }

        await Promise.all(running);

        setBatchProgress((prev) => ({
          ...prev,
          state: failed === 0 ? "success" : prev.completed > 0 ? "success" : "error",
        }));

        if (failed === 0) {
          notificationService.success(`Все файлы (${completed}) загружены`);
        } else if (completed > 0) {
          notificationService.warning(`Загружено ${completed} из ${fileIds.length}. Ошибок: ${failed}`);
        } else {
          notificationService.error("Не удалось загрузить файлы");
        }
      } catch {
        // download-all endpoint not available or failed — fall back to sequential individual downloads
        notificationService.info("Загрузка файлов по одному…");

        let completed = 0;
        let failed = 0;

        for (const fileId of fileIds) {
          if (controller.signal.aborted) break;
          const fileMeta = files.find((f) => f.id === fileId);
          if (!fileMeta) continue;

          try {
            await downloadFile(fileId, fileMeta.filename);
            completed++;
            setBatchProgress((prev) => ({
              ...prev,
              completed,
              failed,
              files: new Map(prev.files).set(fileId, { fileId, progress: 100, state: "success" }),
            }));
          } catch {
            failed++;
            setBatchProgress((prev) => ({
              ...prev,
              failed,
              files: new Map(prev.files).set(fileId, { fileId, progress: 0, state: "error" }),
            }));
          }
        }

        setBatchProgress((prev) => ({
          ...prev,
          state: failed === 0 ? "success" : prev.completed > 0 ? "success" : "error",
        }));
      }
    },
    [token, password, resetAll, downloadFile],
  );

  /**
   * Cancel batch download.
   */
  const cancelBatch = useCallback(() => {
    if (batchAbortRef.current) {
      batchAbortRef.current.abort();
      batchAbortRef.current = null;
    }
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current.clear();
    setBatchProgress((prev) => ({ ...prev, state: "cancelled" }));
  }, []);

  const isDownloading = batchProgress.state === "loading";

  return {
    fileProgress,
    batchProgress,
    isDownloading,
    downloadFile,
    cancelFile,
    resetFile,
    resetAll,
    downloadBatch,
    cancelBatch,
  };
}

function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
