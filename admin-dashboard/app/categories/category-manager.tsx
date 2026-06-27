"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  Edit3,
  Search,
  Upload,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPickerButton } from "@/components/admin/media-library";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";
import { createSlug } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  level?: number;
  tags?: string[];
}

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Create form state
  const [createForm, setCreateForm] = React.useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    tags: "",
  });
  const [createSaving, setCreateSaving] = React.useState(false);
  const [createUploading, setCreateUploading] = React.useState(false);

  // Edit modal state
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    tags: "",
  });
  const [editSaving, setEditSaving] = React.useState(false);
  const [editUploading, setEditUploading] = React.useState(false);

  // Auto-fill level based on selected Parent
  const computeLevel = (parentId: string, list: Category[]): number => {
    if (!parentId) return 0;
    const parent = list.find((c) => c.id === parentId);
    return parent ? (parent.level ?? 0) + 1 : 0;
  };

  // Build Hierarchical Categories List
  const organizedCategories = React.useMemo(() => {
    // 1. Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return categories.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    // 2. Build Tree recursively
    const roots = categories.filter((c) => !c.parentId);
    const result: Category[] = [];

    const traverse = (node: Category) => {
      result.push(node);
      const children = categories.filter((c) => c.parentId === node.id);
      children.sort((a, b) => a.name.localeCompare(b.name));
      children.forEach(traverse);
    };

    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach(traverse);

    // Add orphaned categories (if parentId points to non-existent item)
    const processedIds = new Set(result.map((c) => c.id));
    const orphans = categories.filter((c) => !processedIds.has(c.id));
    orphans.forEach((orphan) => result.push(orphan));

    return result;
  }, [categories, searchQuery]);

  // Image Upload handler
  const handleUploadImage = async (file: File, isEdit = false) => {
    if (isEdit) setEditUploading(true);
    else setCreateUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");
      formData.append("record", "true");

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const reference = normalizeMediaReference(data.path ?? data.imageUrl);
      if (!reference) throw new Error("Missing media reference");

      if (isEdit) {
        setEditForm((prev) => ({ ...prev, image: reference }));
      } else {
        setCreateForm((prev) => ({ ...prev, image: reference }));
      }
      toast.success("Category image uploaded");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      if (isEdit) setEditUploading(false);
      else setCreateUploading(false);
    }
  };

  // Submit Category Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreateSaving(true);
    const computedLevel = computeLevel(createForm.parentId, categories);
    const finalSlug = createForm.slug.trim() || createSlug(createForm.name);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: finalSlug,
          description: createForm.description.trim() || undefined,
          image: normalizeMediaReference(createForm.image) || undefined,
          parentId: createForm.parentId || null,
          level: computedLevel,
          tags: createForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }

      toast.success("Category created successfully");
      setCreateForm({
        name: "",
        slug: "",
        description: "",
        image: "",
        parentId: "",
        tags: "",
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not save category");
    } finally {
      setCreateSaving(false);
    }
  };

  // Trigger Edit modal prep
  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image: cat.image ?? "",
      parentId: cat.parentId ?? "",
      tags: cat.tags?.join(", ") ?? "",
    });
  };

  // Submit Category Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editForm.name.trim()) return;

    setEditSaving(true);
    const computedLevel = computeLevel(editForm.parentId, categories);
    const finalSlug = editForm.slug.trim() || createSlug(editForm.name);

    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: finalSlug,
          description: editForm.description.trim() || undefined,
          image: normalizeMediaReference(editForm.image) || null, // null clears if empty
          parentId: editForm.parentId || null,
          level: computedLevel,
          tags: editForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update category");
      }

      toast.success("Category updated successfully");
      setEditingCategory(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not update category");
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Subcategories will become parentless.")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Category deleted");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Could not delete category");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  // Get Category Name Helper
  const getCategoryName = (id?: string | null) => {
    if (!id) return "—";
    const found = categories.find((c) => c.id === id);
    return found ? found.name : "Unknown Parent";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. Category Creator Form (Left Column) */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
              <FolderPlus className="h-5 w-5 text-stone-500" />
              Add New Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Category Name *</label>
                <Input
                  placeholder="e.g. Fine Art Prints"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  className="rounded-xl border-stone-200 focus:border-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Slug (Optional)</label>
                <Input
                  placeholder="auto-generated from name"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Description</label>
                <Textarea
                  placeholder="Summarize this category..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400 min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Category Banner Image</label>
                <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(file, false);
                    }}
                    className="text-xs text-stone-600 cursor-pointer"
                  />
                  <MediaPickerButton
                    folder="categories"
                    onSelect={(url) => setCreateForm((prev) => ({ ...prev, image: normalizeMediaReference(url) ?? url }))}
                  />
                  {createUploading && <span className="text-xs font-medium text-stone-500">Uploading...</span>}
                  {createForm.image ? (
                    <div className="relative aspect-[4/1.5] overflow-hidden rounded-lg border border-stone-200 mt-1">
                      <img src={resolveMediaUrl(createForm.image) || ""} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, image: "" })}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Input
                      placeholder="Or enter media path reference..."
                      value={createForm.image}
                      onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
                      className="rounded-lg h-9 border-stone-200 bg-white"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Parent Category (For Hierarchy)</label>
                <select
                  value={createForm.parentId}
                  onChange={(e) => setCreateForm({ ...createForm, parentId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 focus:ring-stone-400 bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Level {c.level ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Classification Tags (Comma separated)</label>
                <Input
                  placeholder="e.g. custom, glossy, print"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400"
                />
              </div>

              <Button
                disabled={createSaving || createUploading}
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 font-bold shadow-sm"
              >
                {createSaving ? "Saving..." : "Create Category"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 2. Interactive Category Hierarchy Tree View (Right Column) */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-stone-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-stone-900">Categories Hierarchy</CardTitle>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 rounded-lg border-stone-200 focus:border-stone-400"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-150">
              {organizedCategories.length === 0 ? (
                <div className="p-10 text-center text-stone-500 text-sm">
                  No categories found. Start by creating one.
                </div>
              ) : (
                organizedCategories.map((cat) => {
                  const level = cat.level ?? 0;
                  const preview = cat.image ? resolveMediaUrl(cat.image) : null;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 hover:bg-stone-50/50 transition"
                      style={{ paddingLeft: `${Math.max(16, level * 28 + 16)}px` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Tree connector helper */}
                        {level > 0 && (
                          <div className="flex items-center text-stone-300 select-none font-light pr-1">
                            └─
                          </div>
                        )}

                        {/* Category Banner preview thumbnail */}
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-stone-50 flex items-center justify-center">
                          {preview ? (
                            <img src={preview} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Folder className="h-4.5 w-4.5 text-stone-400 fill-current" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-stone-950 truncate text-sm">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              /{cat.slug}
                            </span>
                            {cat.parentId && (
                              <Badge variant="outline" className="text-[9px] bg-stone-100 border-stone-200 text-stone-600 font-bold px-1 py-0 uppercase">
                                Parent: {getCategoryName(cat.parentId)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 truncate mt-0.5 max-w-[280px] sm:max-w-md">
                            {cat.description || "No description provided."}
                          </p>
                          {cat.tags && cat.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cat.tags.map((tag) => (
                                <span key={tag} className="text-[9px] bg-stone-100 border border-stone-200 rounded text-stone-600 px-1 font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(cat)}
                          className="h-8 w-8 p-0 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                          title="Edit category"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat.id)}
                          className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal (Dialog Overlay) */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div>
                <h3 className="text-base font-bold text-stone-900">Edit Category</h3>
                <p className="text-xs text-stone-500 mt-0.5">Modify properties for &quot;{editingCategory.name}&quot;</p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="rounded-full p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Category Name *</label>
                <Input
                  placeholder="Category Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="rounded-xl border-stone-200 focus:border-stone-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Slug</label>
                <Input
                  placeholder="Slug (optional)"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Description</label>
                <Textarea
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400 min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Category Banner Image</label>
                <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(file, true);
                    }}
                    className="text-xs text-stone-600 cursor-pointer"
                  />
                  <MediaPickerButton
                    folder="categories"
                    onSelect={(url) => setEditForm((prev) => ({ ...prev, image: normalizeMediaReference(url) ?? url }))}
                  />
                  {editUploading && <span className="text-xs font-medium text-stone-500">Uploading...</span>}
                  {editForm.image ? (
                    <div className="relative aspect-[4/1.5] overflow-hidden rounded-lg border border-stone-200 mt-1">
                      <img src={resolveMediaUrl(editForm.image) || ""} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, image: "" })}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Input
                      placeholder="Or enter media path reference..."
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="rounded-lg h-9 border-stone-200 bg-white"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Parent Category</label>
                <select
                  value={editForm.parentId}
                  onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 focus:ring-stone-400 bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory.id) // Prevent circular inheritance
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Level {c.level ?? 0})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Classification Tags</label>
                <Input
                  placeholder="Tags (comma separated)"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="rounded-xl border-stone-200 focus:border-stone-400"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={editSaving}
                  className="rounded-xl border-stone-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSaving || editUploading}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5 font-bold shadow-sm"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
