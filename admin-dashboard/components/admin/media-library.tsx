"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, FileText, ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEDIA_FOLDERS } from "@/lib/media";

export type MediaLibraryFile = {
  key: string;
  name: string;
  publicUrl: string;
  previewUrl: string;
  contentType?: string;
  sizeBytes?: number;
  folder?: string;
  createdAt?: string;
};

type MediaLibraryProps = {
  mode?: "manage" | "select";
  accept?: "all" | "image" | "document" | "video";
  folder?: string;
  onSelect?: (url: string, file: MediaLibraryFile) => void;
};

function isImage(file: MediaLibraryFile) {
  return file.contentType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
}

function isVideo(file: MediaLibraryFile) {
  return file.contentType?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
}

function formatBytes(bytes?: number) {
  if (!bytes) {
    return "-";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ mode = "manage", accept = "all", folder = "custom-uploads", onSelect }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaLibraryFile[]>([]);
  const [query, setQuery] = useState("");
  const [uploadFolder, setUploadFolder] = useState(folder);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = (await response.json()) as { files?: MediaLibraryFile[]; configured?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load media");
      }
      setConfigured(data.configured !== false);
      setFiles(data.files ?? []);
    } catch (error: any) {
      toast.error(error.message || "Could not load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(loadFiles, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      if (accept === "image") return isImage(file);
      if (accept === "video") return isVideo(file);
      if (accept === "document") return !isImage(file) && !isVideo(file);
      return true;
    });
  }, [accept, files]);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", uploadFolder);
        formData.append("record", "true");

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? `Could not upload ${file.name}`);
        }
      }
      toast.success(selectedFiles.length === 1 ? "File uploaded" : "Files uploaded");
      await loadFiles();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Public URL copied");
  };

  const deleteFile = async (file: MediaLibraryFile) => {
    if (!confirm(`Delete ${file.name} from QOENS storage?`)) {
      return;
    }

    setDeletingKey(file.key);
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: file.key, publicUrl: file.publicUrl }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete file");
      }
      setFiles((prev) => prev.filter((item) => item.key !== file.key));
      toast.success("File deleted");
    } catch (error: any) {
      toast.error(error.message || "Could not delete file");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by file name, folder, URL, or type"
            className="pl-9"
          />
        </div>
        <select
          value={uploadFolder}
          onChange={(event) => setUploadFolder(event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          aria-label="Upload folder"
        >
          {Object.values(MEDIA_FOLDERS).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading" : "Upload"}
          <input type="file" multiple className="hidden" onChange={uploadFiles} />
        </label>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          QOENS storage is not configured. Add `OQENS_API_KEY` and `NEXT_PUBLIC_OQENS_PUBLIC_CDN_BASE_URL` before uploading media.
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading media library
        </div>
      ) : null}

      {!loading && !visibleFiles.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No media files found.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleFiles.map((file) => {
          const image = isImage(file);
          return (
            <div key={file.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-50">
                {image ? (
                  <img src={file.previewUrl} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div className="space-y-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950" title={file.name}>
                    {file.name}
                  </p>
                  <p className="truncate text-xs text-slate-500" title={file.key}>
                    {file.key}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{file.folder ?? "media"}</Badge>
                  <span className="text-xs text-slate-500">{formatBytes(file.sizeBytes)}</span>
                  {image ? <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> : null}
                </div>
                <div className="flex items-center gap-1.5">
                  {mode === "select" ? (
                    <Button type="button" size="sm" className="h-8 flex-1 gap-1.5" onClick={() => onSelect?.(file.publicUrl, file)}>
                      <Check className="h-3.5 w-3.5" />
                      Select
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => copyUrl(file.publicUrl)} title="Copy public URL">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" asChild title="Preview">
                    <a href={file.previewUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {mode === "manage" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                      disabled={deletingKey === file.key}
                      onClick={() => deleteFile(file)}
                      title="Delete file"
                    >
                      {deletingKey === file.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MediaPickerButton({
  label = "Choose from Media Library",
  accept = "image",
  folder,
  onSelect,
}: {
  label?: string;
  accept?: MediaLibraryProps["accept"];
  folder?: string;
  onSelect: (url: string, file: MediaLibraryFile) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <ImageIcon className="h-4 w-4" />
        {label}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-slate-50 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Media Library</h2>
                <p className="text-sm text-slate-500">Select an existing QOENS media file.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <MediaLibrary
              mode="select"
              accept={accept}
              folder={folder}
              onSelect={(url, file) => {
                onSelect(url, file);
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
