import { useMutation, useQuery } from "@tanstack/react-query";
import { mailApi } from "../../entities/mail/api";
import type {
  MailAttachmentsListParams,
  MailAttachmentsResponse,
} from "../../entities/mail/types";

export const useMailAttachments = (params?: MailAttachmentsListParams) => {
  return useQuery<MailAttachmentsResponse>({
    queryKey: ["mail-attachments", params],
    queryFn: () => mailApi.getAttachmentsList(params).then((res) => res.data),
  });
};

export const useDownloadMailAttachment = () => {
  return useMutation({
    mutationFn: async ({
      messageId,
      attachmentId,
      onDownloadProgress,
    }: {
      messageId: string;
      attachmentId: string;
      onDownloadProgress?: (progress: number) => void;
    }) => {
      const url = mailApi.getDownloadAttachmentUrl(messageId, attachmentId);
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }

      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(
        /filename\*?=(?:UTF-8''|")?([^";]+)/i,
      );
      const fileName = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1].replace(/"/g, ""))
        : `attachment_${attachmentId}`;

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      if (onDownloadProgress) {
        onDownloadProgress(100);
      }
    },
  });
};

export const formatMailAttachmentSize = (bytes: number): string => {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getMailAttachmentFileIcon = (contentType: string, filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  if (contentType.includes("pdf") || ext === "pdf") {
    return "📄 PDF";
  }
  if (
    contentType.includes("word") ||
    contentType.includes("msword") ||
    ["doc", "docx"].includes(ext)
  ) {
    return "📝 Word";
  }
  if (
    contentType.includes("excel") ||
    contentType.includes("spreadsheet") ||
    ["xls", "xlsx"].includes(ext)
  ) {
    return "📊 Excel";
  }
  if (contentType.includes("image")) {
    return "🖼️ Изображение";
  }
  if (contentType.includes("video")) {
    return "🎥 Видео";
  }
  if (
    contentType.includes("zip") ||
    contentType.includes("rar") ||
    contentType.includes("archive")
  ) {
    return "📦 Архив";
  }
  return "📎 Файл";
};
