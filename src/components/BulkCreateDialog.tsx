import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { Plus, Trash2, ImagePlus, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulkCreateItem, CreateResult } from "../types";

interface Props {
  open: boolean;
  onClose: (created?: boolean) => void;
  onCreate: (item: BulkCreateItem) => Promise<{ id: string; name: string; price: number }>;
  title: string;
  showDescription: boolean;
}

function emptyRow(): BulkCreateItem {
  return { name: "", description: "", price: 0, isRegionalPricingEnabled: false, imageFile: null };
}

function IconDropZone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Generate preview when file changes
  if (file && !preview) {
    const url = URL.createObjectURL(file);
    setPreview(url);
  }
  if (!file && preview) {
    setPreview(null);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  }, [onFile]);

  return (
    <div
      className={cn(
        "relative w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-all overflow-hidden cursor-pointer group",
        dragOver ? "border-foreground/30 bg-foreground/5" : file ? "border-border" : "border-border hover:border-foreground/20"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {file && preview ? (
        <>
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); setPreview(null); }}
            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
          <span className="text-[8px] text-muted-foreground/40 mt-0.5">Drop</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}

export default function BulkCreateDialog({
  open,
  onClose,
  onCreate,
  title,
  showDescription,
}: Props) {
  const [rows, setRows] = useState<BulkCreateItem[]>([emptyRow()]);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [results, setResults] = useState<CreateResult[]>([]);
  const { showToast } = useToast();

  const updateRow = (i: number, patch: Partial<BulkCreateItem>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleCreate = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) {
      setError("Add at least one item with a name.");
      return;
    }
    setError("");
    setCreating(true);
    setProgress(0);
    setResults([]);
    const collected: CreateResult[] = [];

    for (let i = 0; i < valid.length; i++) {
      try {
        const created = await onCreate(valid[i]);
        collected.push({
          name: created.name,
          id: created.id,
          price: created.price,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        collected.push({
          name: valid[i].name,
          id: "-",
          price: valid[i].price,
          error: msg,
        });
      }
      setProgress(((i + 1) / valid.length) * 100);
      setResults([...collected]);
      if (i < valid.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    setCreating(false);
  };

  const handleCopy = async () => {
    const successful = results.filter((r) => !r.error);
    const lines = successful.map(
      (r) => `${r.name}\t${r.id}\t${r.price}`
    );
    const text = `Name\tID\tPrice\n${lines.join("\n")}`;
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const handleClose = () => {
    if (creating) return;
    const hadSuccess = results.some((r) => !r.error);
    setRows([emptyRow()]);
    setProgress(0);
    setResults([]);
    setError("");
    onClose(hadSuccess);
  };

  const successCount = results.filter((r) => !r.error).length;
  const failCount = results.filter((r) => r.error).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {creating && (
          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {!creating && results.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-muted-foreground">
                {successCount} created{failCount > 0 ? `, ${failCount} failed` : ""}
              </span>
              {successCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  {failCount > 0 && <TableHead>Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow
                    key={i}
                    className={r.error ? "bg-destructive/5" : undefined}
                  >
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell className="text-right">R$ {r.price.toLocaleString()}</TableCell>
                    {failCount > 0 && (
                      <TableCell>
                        {r.error ? (
                          <span className="text-xs text-destructive">
                            {r.error.length > 60 ? r.error.slice(0, 60) + "..." : r.error}
                          </span>
                        ) : (
                          <span className="text-xs text-success">OK</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!creating && results.length === 0 && (
          <div className="flex flex-col gap-2.5 mt-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex gap-3 items-start">
                  {/* Icon drop zone */}
                  <IconDropZone
                    file={row.imageFile}
                    onFile={(f) => updateRow(i, { imageFile: f })}
                    onClear={() => updateRow(i, { imageFile: null })}
                  />

                  {/* Fields */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Name"
                        value={row.name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={row.price}
                        onChange={(e) => updateRow(i, { price: Number(e.target.value) })}
                        className="w-[100px]"
                      />
                    </div>
                    {showDescription && (
                      <Input
                        placeholder="Description"
                        value={row.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.isRegionalPricingEnabled}
                          onCheckedChange={(v) => updateRow(i, { isRegionalPricingEnabled: v })}
                        />
                        <Label className="text-xs text-muted-foreground">Regional Pricing</Label>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={() => removeRow(i)}
                        disabled={rows.length <= 1}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={addRow} className="self-start">
              <Plus className="h-4 w-4 mr-1" />
              Add Another
            </Button>
          </div>
        )}

        {error && <Alert variant="destructive" className="mt-2">{error}</Alert>}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={creating}>
            {results.length > 0 ? "Done" : "Cancel"}
          </Button>
          {results.length === 0 && (
            <Button onClick={handleCreate} disabled={creating}>
              Create All ({rows.filter((r) => r.name.trim()).length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
