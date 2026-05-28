// src/pages/cases/CaseDocumentZone.tsx
import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Chip,
  Fade,
  alpha,
  Collapse,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Add as AddIcon,
  CreateNewFolder as CreateNewFolderIcon,
  DeleteOutline as DeleteIcon,
  Check as CheckIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as XlsIcon,
  Image as ImageIcon,
  Archive as ArchiveIcon,
  DriveFolderUpload as DriveFolderUploadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { FolderPicker } from "../../shared/ui";
import { notificationService } from "../../shared/services/notifications";

export interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  parentLocalId?: string;
}

export interface QueuedFolder {
  id: string;
  name: string;
  parentLocalId?: string;
}

export interface CaseDocumentZoneHandle {
  getFiles: () => QueuedFile[];
  getFolders: () => QueuedFolder[];
  clear: () => void;
}

interface CaseDocumentZoneProps {
  selectedFolderId: string | null;
  selectedFolderName?: string | null;
  onFolderSelect: (folderId: string | null, folderName?: string | null) => void;
  /** Called when user creates a root folder.
   * @param name — folder name
   * @param parentFolderId — optional parent folder ID (null = root level)
   */
  onCreateRootFolder: (name: string, parentFolderId: string | null) => Promise<{ id: string; name: string }>;
}

let _fileIdCounter = 0;
function nextFileId(): string {
  _fileIdCounter += 1;
  return `file-${Date.now()}-${_fileIdCounter}`;
}

let _folderIdCounter = 0;
function nextFolderId(): string {
  _folderIdCounter += 1;
  return `folder-${Date.now()}-${_folderIdCounter}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIconForName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return <PdfIcon sx={{ color: "#D32F2F", fontSize: 20 }} />;
    case "doc":
    case "docx":
      return <DocIcon sx={{ color: "#2196F3", fontSize: 20 }} />;
    case "xls":
    case "xlsx":
    case "csv":
      return <XlsIcon sx={{ color: "#4CAF50", fontSize: 20 }} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg":
    case "bmp":
      return <ImageIcon sx={{ color: "#FF9800", fontSize: 20 }} />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <ArchiveIcon sx={{ color: "#795548", fontSize: 20 }} />;
    default:
      return <FileIcon sx={{ color: "text.secondary", fontSize: 20 }} />;
  }
}

function plural(count: number, one: string, few: string, many: string) {
  const n = Math.abs(count) % 100;
  if (n >= 5 && n <= 20) return many;
  const last = n % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function getFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readAllEntries(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(all);
        } else {
          all.push(...entries);
          readBatch();
        }
      });
    };
    readBatch();
  });
}

async function traverseEntry(
  entry: FileSystemEntry,
  parentLocalId?: string,
): Promise<{ files: QueuedFile[]; folders: QueuedFolder[] }> {
  if (entry.isFile) {
    try {
      const file = await getFile(entry as FileSystemFileEntry);
      return {
        files: [
          {
            id: nextFileId(),
            file,
            name: file.name,
            size: file.size,
            parentLocalId,
          },
        ],
        folders: [],
      };
    } catch {
      notificationService.warning(`Не удалось прочитать файл "${entry.name}"`);
      return { files: [], folders: [] };
    }
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(reader);
    const folderId = nextFolderId();
    const result: { files: QueuedFile[]; folders: QueuedFolder[] } = {
      files: [],
      folders: [
        { id: folderId, name: entry.name, parentLocalId },
      ],
    };

    for (const child of entries) {
      const childResult = await traverseEntry(child, folderId);
      result.files.push(...childResult.files);
      result.folders.push(...childResult.folders);
    }
    return result;
  }

  return { files: [], folders: [] };
}

export const CaseDocumentZone = forwardRef<
  CaseDocumentZoneHandle,
  CaseDocumentZoneProps
>(({ selectedFolderId, selectedFolderName, onFolderSelect, onCreateRootFolder }, ref) => {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [queuedFolders, setQueuedFolders] = useState<QueuedFolder[]>([]);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isDraggingFolder, setIsDraggingFolder] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState("");
  const [showSubFolderInput, setShowSubFolderInput] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useImperativeHandle(ref, () => ({
    getFiles: () => [...files],
    getFolders: () => [...queuedFolders],
    clear: () => {
      setFiles([]);
      setQueuedFolders([]);
      setExpandedFolders(new Set());
    },
  }), [files, queuedFolders]);

  const { rootFiles, folderFileMap, totalSize } = useMemo(() => {
    const root: QueuedFile[] = [];
    const byFolder = new Map<string, QueuedFile[]>();
    let total = 0;
    for (const f of files) {
      total += f.size;
      if (f.parentLocalId) {
        const arr = byFolder.get(f.parentLocalId) || [];
        arr.push(f);
        byFolder.set(f.parentLocalId, arr);
      } else {
        root.push(f);
      }
    }
    return { rootFiles: root, folderFileMap: byFolder, totalSize: total };
  }, [files]);

  const toggleExpand = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const topLevelFolders = useMemo(
    () => queuedFolders.filter((f) => !f.parentLocalId),
    [queuedFolders],
  );

  const addFlatFiles = useCallback(
    (newFiles: File[], parentLocalId?: string) => {
      const queued: QueuedFile[] = newFiles.map((file) => ({
        id: nextFileId(),
        file,
        name: file.name,
        size: file.size,
        parentLocalId,
      }));
      setFiles((prev) => [...prev, ...queued]);
    },
    [],
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const removeFolderWithFiles = useCallback(
    (folderId: string) => {
      const descendantIds = new Set<string>();
      const collect = (id: string) => {
        descendantIds.add(id);
        for (const f of queuedFolders) {
          if (f.parentLocalId === id) collect(f.id);
        }
      };
      collect(folderId);

      setQueuedFolders((prev) => prev.filter((f) => !descendantIds.has(f.id)));
      setFiles((prev) =>
        prev.filter(
          (f) =>
            f.parentLocalId !== folderId &&
            !descendantIds.has(f.parentLocalId ?? ""),
        ),
      );
    },
    [queuedFolders],
  );

  const addSubFolder = useCallback(() => {
    const name = newSubFolderName.trim();
    if (!name) return;
    if (queuedFolders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      notificationService.warning("Папка с таким именем уже добавлена");
      return;
    }
    setQueuedFolders((prev) => [...prev, { id: nextFolderId(), name }]);
    setNewSubFolderName("");
    setShowSubFolderInput(false);
  }, [newSubFolderName, queuedFolders]);

  const handleSubFolderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSubFolder();
      } else if (e.key === "Escape") {
        setShowSubFolderInput(false);
        setNewSubFolderName("");
      }
    },
    [addSubFolder],
  );

  const handleCreateFolderInPicker = useCallback(
    async (name: string, parentId: string | null) => {
      return await onCreateRootFolder(name, parentId);
    },
    [onCreateRootFolder],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          const entry = (item as any).webkitGetAsEntry?.();
          if (entry?.isDirectory) {
            setIsDraggingFolder(true);
            break;
          }
        }
      }
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOver(false);
      setIsDraggingFolder(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      setIsDraggingFolder(false);
      dragCounter.current = 0;

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const entries: FileSystemEntry[] = [];
      let hasDirectories = false;

      for (let i = 0; i < items.length; i++) {
        const entry = (items[i] as any).webkitGetAsEntry?.();
        if (entry) {
          entries.push(entry);
          if (entry.isDirectory) hasDirectories = true;
        }
      }

      if (hasDirectories && entries.length > 0) {
        const allFiles: QueuedFile[] = [];
        const allFolders: QueuedFolder[] = [];

        for (const entry of entries) {
          const result = await traverseEntry(entry);
          allFiles.push(...result.files);
          allFolders.push(...result.folders);
        }

        if (allFiles.length > 0 || allFolders.length > 0) {
          setFiles((prev) => [...prev, ...allFiles]);
          setQueuedFolders((prev) => [...prev, ...allFolders]);
          // Auto-expand newly added top-level folders
          const newTopIds = allFolders.filter((f) => !f.parentLocalId).map((f) => f.id);
          if (newTopIds.length > 0) {
            setExpandedFolders((prev) => {
              const next = new Set(prev);
              for (const id of newTopIds) next.add(id);
              return next;
            });
          }
          notificationService.success(
            `Добавлено: ${allFolders.length} папк(и), ${allFiles.length} файл(ов)`,
          );
        }
        return;
      }

      // Fallback: flat files
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFlatFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFlatFiles],
  );

  // ── file input handlers ────────────────────────────────────────────
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFlatFiles(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [addFlatFiles],
  );

  const handleFolderInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const pathMap = new Map<string, { files: File[]; subPaths: Set<string> }>();

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relPath = (file as any).webkitRelativePath || file.name;
        const parts = relPath.split("/");

        if (parts.length <= 1) {
          addFlatFiles([file]);
          continue;
        }

        const rootFolderName = parts[0];

        if (!pathMap.has(rootFolderName)) {
          pathMap.set(rootFolderName, { files: [], subPaths: new Set() });
        }
        const entry = pathMap.get(rootFolderName)!;
        entry.files.push(
          new File([file], parts.slice(1).join("/"), {
            type: file.type,
            lastModified: file.lastModified,
          }),
        );
      }

      // Create folder groups from pathMap
      for (const [folderName, { files: folderFiles }] of pathMap) {
        const folderId = nextFolderId();
        setQueuedFolders((prev) => [...prev, { id: folderId, name: folderName }]);
        setExpandedFolders((prev) => new Set(prev).add(folderId));

        const queued: QueuedFile[] = folderFiles.map((file) => ({
            id: nextFileId(),
            file,
            name: file.name,
            size: file.size,
            parentLocalId: folderId,
          }));
        setFiles((prev) => [...prev, ...queued]);
      }

      notificationService.success(
        `Добавлено папок: ${pathMap.size}, файлов: ${Array.from(pathMap.values()).reduce((s, v) => s + v.files.length, 0)}`,
      );

      e.target.value = "";
    },
    [addFlatFiles],
  );

  const handleFolderPickerOpen = useCallback(() => setFolderPickerOpen(true), []);
  const handleFolderPickerClose = useCallback(() => setFolderPickerOpen(false), []);

  const handleFolderSelect = useCallback(
    (folderId: string | null, folderName?: string | null) => {
      onFolderSelect(folderId, folderName);
    },
    [onFolderSelect],
  );

  // ── derived ────────────────────────────────────────────────────────
  const hasContent = files.length > 0 || queuedFolders.length > 0 || !!selectedFolderId;

  // ── render helper: file row ────────────────────────────────────────
  const renderFileRow = useCallback(
    (qf: QueuedFile, indent: number = 0) => (
      <Box
        key={qf.id}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 0.6,
          ml: indent * 2.5,
          borderRadius: "6px",
          bgcolor: alpha("#f1f5f9", 0.6),
          border: "1px solid",
          borderColor: alpha("#e2e8f0", 0.8),
          "&:hover": {
            bgcolor: alpha("#e2e8f0", 0.6),
            borderColor: alpha("#1a2332", 0.12),
          },
        }}
      >
        {fileIconForName(qf.name)}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 500,
              fontSize: "0.8rem",
            }}
          >
            {qf.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.7rem" }}>
          {formatSize(qf.size)}
        </Typography>
        <Tooltip title="Удалить" arrow>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(qf.id);
            }}
            sx={{
              color: "text.secondary",
              p: 0.25,
              "&:hover": { color: "error.main", bgcolor: alpha("#d32f2f", 0.08) },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [removeFile],
  );

  // ── render helper: folder group ────────────────────────────────────
  const renderFolderGroup = useCallback(
    (folder: QueuedFolder, depth: number = 0) => {
      const isExpanded = expandedFolders.has(folder.id);
      const childFolders = queuedFolders.filter((f) => f.parentLocalId === folder.id);
      const childFiles = folderFileMap.get(folder.id) || [];
      const totalChildren = childFolders.length + childFiles.length;

      return (
        <Box key={folder.id} sx={{ ml: depth * 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: "8px",
              bgcolor: alpha("#e8f0fe", 0.7),
              border: "1px solid",
              borderColor: alpha("#4285f4", 0.25),
              cursor: totalChildren > 0 ? "pointer" : "default",
              "&:hover": { bgcolor: alpha("#d2e3fc", 0.7) },
            }}
            onClick={() => totalChildren > 0 && toggleExpand(folder.id)}
          >
            {isExpanded ? (
              <FolderOpenIcon sx={{ color: "#4285f4", fontSize: 20 }} />
            ) : (
              <FolderIcon sx={{ color: "#4285f4", fontSize: 20 }} />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.82rem" }}>
                {folder.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                {totalChildren}{" "}
                {plural(totalChildren, "элемент", "элемента", "элементов")}
              </Typography>
            </Box>
            {totalChildren > 0 && (
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            )}
            <Chip
              label="Будет создана"
              size="small"
              sx={{
                fontSize: "0.6rem",
                height: 18,
                bgcolor: alpha("#4285f4", 0.1),
                color: "#1a56db",
                fontWeight: 500,
              }}
            />
            <Tooltip title="Удалить папку и всё содержимое" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFolderWithFiles(folder.id);
                }}
                sx={{
                  color: "text.secondary",
                  p: 0.25,
                  "&:hover": { color: "error.main", bgcolor: alpha("#d32f2f", 0.08) },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Collapse in={isExpanded}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
              {childFolders.map((cf) => renderFolderGroup(cf, depth + 1))}
              {childFiles.map((f) => renderFileRow(f, depth + 1))}
            </Box>
          </Collapse>
        </Box>
      );
    },
    [expandedFolders, queuedFolders, folderFileMap, toggleExpand, removeFolderWithFiles, renderFileRow],
  );

  return (
    <>
      <FolderPicker
        open={folderPickerOpen}
        onClose={handleFolderPickerClose}
        onChange={handleFolderSelect}
        value={selectedFolderId}
        excludeCaseFolders={true}
        title="Выберите корневую папку дела"
        confirmText="Выбрать папку"
        onCreateFolder={handleCreateFolderInPicker}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is widely supported
        webkitdirectory=""
        // @ts-expect-error directory attribute
        directory=""
        onChange={handleFolderInputChange}
        style={{ display: "none" }}
      />

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: "background.paper",
          transition: "all 0.2s",
          boxShadow: hasContent ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: alpha("#f8fafc", 0.8),
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1.25, display: "block" }}
          >
            Корневая папка дела
          </Typography>

          {selectedFolderId ? (
            /* Selected folder card */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderRadius: "10px",
                bgcolor: alpha("#e8f0fe", 0.6),
                border: "1px solid",
                borderColor: alpha("#4285f4", 0.3),
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: alpha("#4285f4", 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FolderOpenIcon sx={{ color: "#4285f4", fontSize: 22 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
                  {selectedFolderName || "Корневая папка"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  ID: {selectedFolderId}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Сменить папку" arrow>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleFolderPickerOpen}
                    sx={{
                      fontSize: "0.72rem",
                      px: 1.25,
                      height: 28,
                      borderColor: alpha("#4285f4", 0.4),
                      color: "#1a56db",
                      textTransform: "none",
                      fontWeight: 500,
                      "&:hover": { borderColor: "#4285f4", bgcolor: alpha("#4285f4", 0.06) },
                    }}
                  >
                    Сменить
                  </Button>
                </Tooltip>
                <Tooltip title="Убрать выбор" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onFolderSelect(null)}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main", bgcolor: alpha("#d32f2f", 0.08) },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<FolderIcon />}
                onClick={handleFolderPickerOpen}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": { borderColor: "primary.main", bgcolor: alpha("#1a2332", 0.03) },
                }}
              >
                Выбрать корневую папку
              </Button>
            </Box>
          )}
        </Box>

        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            position: "relative",
            px: 2.5,
            py: files.length > 0 || queuedFolders.length > 0 ? 2 : 3.5,
            cursor: "pointer",
            transition: "all 0.2s",
            bgcolor: dragOver ? alpha("#1a2332", 0.05) : "transparent",
            borderBottom:
              files.length > 0 || queuedFolders.length > 0 ? "1px solid" : "none",
            borderColor: "divider",
            "&:hover": { bgcolor: alpha("#1a2332", 0.02) },
          }}
        >
          <Fade in={dragOver}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha("#1a2332", 0.06),
                border: "2px dashed",
                borderColor: "primary.main",
              }}
            >
              {isDraggingFolder ? (
                <DriveFolderUploadIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
              ) : (
                <CloudUploadIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
              )}
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {isDraggingFolder
                  ? "Отпустите для загрузки папок"
                  : "Отпустите для загрузки"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                {isDraggingFolder
                  ? "Структура папок будет сохранена"
                  : "Поддерживаются файлы и папки"}
              </Typography>
            </Box>
          </Fade>

          {files.length === 0 && queuedFolders.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                py: 1.5,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 38, color: "text.disabled", opacity: 0.6 }} />
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 360 }}>
                Перетащите файлы или папки сюда, или выберите вариант загрузки
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<FileIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.82rem",
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": { borderColor: "primary.main", bgcolor: alpha("#1a2332", 0.03) },
                  }}
                >
                  Выбрать файлы
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<DriveFolderUploadIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.82rem",
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": { borderColor: "primary.main", bgcolor: alpha("#1a2332", 0.03) },
                  }}
                >
                  Выбрать папку
                </Button>
              </Box>
            </Box>
          )}

          {(files.length > 0 || queuedFolders.length > 0) && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {topLevelFolders.map((folder) => renderFolderGroup(folder, 0))}

              {rootFiles.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {queuedFolders.length > 0 && (
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ mt: 0.5, mb: 0.25 }}
                    >
                      Файлы в корне
                    </Typography>
                  )}
                  {rootFiles.map((f) => renderFileRow(f))}
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  sx={{
                    fontSize: "0.75rem",
                    textTransform: "none",
                    color: "primary.main",
                    fontWeight: 500,
                  }}
                >
                  + Добавить файлы
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<DriveFolderUploadIcon sx={{ fontSize: 18 }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  sx={{
                    fontSize: "0.75rem",
                    textTransform: "none",
                    color: "primary.main",
                    fontWeight: 500,
                  }}
                >
                  Загрузить папку
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* ── Manual sub-folder creation ──────────────────────────── */}
        <Box sx={{ px: 2.5, py: 1.75, display: "flex", flexDirection: "column", gap: 1 }}>
          {showSubFolderInput ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: "8px",
                bgcolor: alpha("#f1f5f9", 0.5),
                border: "1px solid",
                borderColor: "primary.main",
              }}
            >
              <CreateNewFolderIcon sx={{ color: "primary.main", fontSize: 20 }} />
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="Название подпапки"
                value={newSubFolderName}
                onChange={(e) => setNewSubFolderName(e.target.value)}
                onKeyDown={handleSubFolderKeyDown}
                onBlur={() => {
                  setTimeout(() => {
                    if (document.activeElement?.tagName !== "BUTTON") {
                      setShowSubFolderInput(false);
                      setNewSubFolderName("");
                    }
                  }, 150);
                }}
                InputProps={{
                  endAdornment: newSubFolderName.trim() ? (
                    <IconButton size="small" onClick={addSubFolder} sx={{ color: "primary.main" }}>
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  ) : undefined,
                }}
                sx={{
                  "& .MuiInputBase-root": { height: 36, fontSize: "0.875rem" },
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setShowSubFolderInput(false);
                  setNewSubFolderName("");
                }}
                sx={{ color: "text.secondary" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button
              size="small"
              variant="text"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => setShowSubFolderInput(true)}
              sx={{
                alignSelf: "flex-start",
                fontSize: "0.8rem",
                textTransform: "none",
                color: "text.secondary",
                fontWeight: 500,
                "&:hover": { color: "primary.main", bgcolor: alpha("#1a2332", 0.04) },
              }}
            >
              Создать подпапку
            </Button>
          )}
        </Box>

        {/* ── Summary footer ──────────────────────────────────────── */}
        {(files.length > 0 || queuedFolders.length > 0) && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: alpha("#f8fafc", 0.8),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {[
                  files.length > 0 &&
                    `${files.length} ${plural(files.length, "файл", "файла", "файлов")}`,
                  queuedFolders.length > 0 &&
                    `${queuedFolders.length} ${plural(queuedFolders.length, "папка", "папки", "папок")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
              <Chip
                label="Ожидают создания дела"
                size="small"
                sx={{
                  fontSize: "0.62rem",
                  height: 20,
                  bgcolor: alpha("#f59e0b", 0.1),
                  color: "#92400e",
                  fontWeight: 500,
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.disabled">
                {formatSize(totalSize)}
              </Typography>
              <Tooltip title="Очистить всё" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setFiles([]);
                    setQueuedFolders([]);
                    setExpandedFolders(new Set());
                  }}
                  sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
});

CaseDocumentZone.displayName = "CaseDocumentZone";

export default CaseDocumentZone;
