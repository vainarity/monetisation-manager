import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Copy, Globe } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { fetchImageFileFromUrl, fetchUniverseInfo } from "../api/roblox";
import type { BulkCreateItem, CreateResult, ImportableItem } from "../types";

interface Props {
  open: boolean;
  onClose: (created?: boolean) => void;
  title: string;
  emptyLabel: string;
  showDescription: boolean;
  loadSourceItems: (sourceUniverseId: string) => Promise<ImportableItem[]>;
  onCreate: (
    item: BulkCreateItem & { isForSale: boolean }
  ) => Promise<{ id: string; name: string; price: number }>;
}

function sanitizeFileBaseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "icon";
}

export default function ImportFromUniverseDialog({
  open,
  onClose,
  title,
  emptyLabel,
  showDescription,
  loadSourceItems,
  onCreate,
}: Props) {
  const { showToast } = useToast();
  const [sourceUniverseId, setSourceUniverseId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [items, setItems] = useState<ImportableItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingSource, setLoadingSource] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [results, setResults] = useState<CreateResult[]>([]);

  const selectedCount = selectedIds.size;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const resetState = () => {
    setSourceUniverseId("");
    setSourceName("");
    setItems([]);
    setSelectedIds(new Set());
    setLoadingSource(false);
    setImporting(false);
    setProgress(0);
    setError("");
    setResults([]);
  };

  const handleClose = () => {
    if (importing) return;
    const hadSuccess = results.some((result) => !result.error);
    resetState();
    onClose(hadSuccess);
  };

  const handleLoad = async () => {
    const trimmed = sourceUniverseId.trim();
    if (!trimmed || isNaN(Number(trimmed))) {
      setError("Enter a valid source universe ID.");
      return;
    }

    setLoadingSource(true);
    setError("");
    setResults([]);

    try {
      const [sourceInfo, sourceItems] = await Promise.all([
        fetchUniverseInfo(trimmed),
        loadSourceItems(trimmed),
      ]);
      setSourceName(sourceInfo.name || `Universe ${trimmed}`);
      setItems(sourceItems);
      setSelectedIds(new Set(sourceItems.map((item) => item.id)));
      if (sourceItems.length === 0) {
        setError(emptyLabel);
      }
    } catch (e) {
      setItems([]);
      setSelectedIds(new Set());
      setError(e instanceof Error ? e.message : "Failed to load source universe.");
    } finally {
      setLoadingSource(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(items.map((item) => item.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      setError("Select at least one item to copy.");
      return;
    }

    setImporting(true);
    setProgress(0);
    setError("");
    const collected: CreateResult[] = [];

    for (let index = 0; index < selectedItems.length; index++) {
      const item = selectedItems[index];

      try {
        const imageFile = item.iconUrl
          ? await fetchImageFileFromUrl(item.iconUrl, sanitizeFileBaseName(item.name))
          : null;

        const created = await onCreate({
          name: item.name,
          description: item.description,
          price: item.price,
          isForSale: item.isForSale,
          isRegionalPricingEnabled: item.isRegionalPricingEnabled,
          imageFile,
        });

        collected.push({
          id: created.id,
          name: created.name,
          price: created.price,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        collected.push({
          id: "-",
          name: item.name,
          price: item.price,
          error: message,
        });
      }

      setResults([...collected]);
      setProgress(((index + 1) / selectedItems.length) * 100);

      if (index < selectedItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    setImporting(false);
  };

  const handleCopy = async () => {
    const successful = results.filter((result) => !result.error);
    const text = [
      "Name\tID\tPrice",
      ...successful.map((result) => `${result.name}\t${result.id}\t${result.price}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={sourceUniverseId}
              onChange={(e) => setSourceUniverseId(e.target.value)}
              placeholder="Source universe ID"
              disabled={loadingSource || importing}
            />
            <Button
              variant="outline"
              onClick={handleLoad}
              disabled={loadingSource || importing}
            >
              {loadingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Source"}
            </Button>
          </div>

          {loadingSource && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading source items...
            </div>
          )}

          {!loadingSource && sourceName && items.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{sourceName}</p>
                  <p className="text-xs text-muted-foreground">
                    Universe {sourceUniverseId.trim()} · {items.length} item{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={selectAll} disabled={importing}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection} disabled={importing}>
                  Clear
                </Button>
              </div>

              <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border/70">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 px-3 py-3 border-b border-border/70 last:border-b-0 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelection(item.id)}
                      disabled={importing}
                    />
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-raised shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        {!item.isForSale && (
                          <span className="text-[11px] text-muted-foreground">Off-sale</span>
                        )}
                        {item.isRegionalPricingEnabled && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            Regional Pricing
                          </span>
                        )}
                      </div>
                      {showDescription && item.description && (
                        <p className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">R$ {item.price.toLocaleString()}</p>
                    </div>
                  </label>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                {selectedCount} selected. Importing creates new items in the current universe with the same name,
                price, regional pricing flag, sale state, and icon.
              </p>
            </div>
          )}

          {importing && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {!importing && results.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-medium text-foreground">
                  {results.filter((result) => !result.error).length} imported
                  {results.some((result) => result.error)
                    ? `, ${results.filter((result) => result.error).length} failed`
                    : ""}
                </p>
                {results.some((result) => !result.error) && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
              <div className="max-h-[240px] overflow-y-auto rounded-lg border border-border/70">
                {results.map((result, index) => (
                  <div
                    key={`${result.name}-${index}`}
                    className="flex items-center gap-3 px-3 py-2 border-b border-border/70 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{result.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.error ? result.error : `Created as ${result.id}`}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">R$ {result.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <Alert variant="destructive">{error}</Alert>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={importing}>
            {results.length > 0 ? "Done" : "Cancel"}
          </Button>
          {results.length === 0 && (
            <Button
              onClick={handleImport}
              disabled={importing || loadingSource || selectedItems.length === 0}
            >
              Import Selected ({selectedItems.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
