import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  ExternalLink,
  RefreshCw,
  Copy,
  ArrowUp,
  ArrowDown,
  List,
  LayoutGrid,
  Search,
  Loader2,
  EyeOff,
  Ticket,
  CheckSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AppState, GamePass } from "../types";
import { listGamePasses, createGamePass, updateGamePass } from "../api/roblox";
import ItemCard from "../components/ItemCard";
import EditDialog from "../components/EditDialog";
import BulkCreateDialog from "../components/BulkCreateDialog";
import ExportDialog from "../components/ExportDialog";
import { useToast } from "../components/ToastProvider";

interface Props {
  appState: AppState;
}

export default function Gamepasses({ appState }: Props) {
  const { apiKey, universeId } = appState;
  const { showToast } = useToast();

  const [passes, setPasses] = useState<GamePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editTarget, setEditTarget] = useState<GamePass | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [sortPrice, setSortPrice] = useState<"asc" | "desc" | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [hideOffsale, setHideOffsale] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState("");

  const fetchPasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listGamePasses(apiKey, universeId);
      setPasses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gamepasses.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, universeId]);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  const filtered = useMemo(() => {
    let result = passes;
    if (hideOffsale) result = result.filter((gp) => gp.isForSale);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((gp) => gp.name.toLowerCase().includes(q));
    }
    return result;
  }, [passes, search, hideOffsale]);

  const sorted = useMemo(() => {
    if (!sortPrice) return filtered;
    return [...filtered].sort((a, b) =>
      sortPrice === "desc" ? b.price - a.price : a.price - b.price
    );
  }, [filtered, sortPrice]);

  const handleDeleteIcon = useCallback(async (gp: GamePass) => {
    try {
      // Create a tiny 1x1 transparent PNG to "clear" the icon
      const canvas = document.createElement("canvas");
      canvas.width = 150;
      canvas.height = 150;
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );
      const file = new File([blob], "blank.png", { type: "image/png" });
      await updateGamePass(apiKey, universeId, gp.id, { imageFile: file });
      showToast(`Icon removed for "${gp.name}"`);
      await fetchPasses();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to remove icon", "error");
    }
  }, [apiKey, universeId, fetchPasses, showToast]);

  const handleDropIcon = useCallback(async (gp: GamePass, file: File) => {
    try {
      await updateGamePass(apiKey, universeId, gp.id, { imageFile: file });
      showToast(`Icon updated for "${gp.name}"`);
      await fetchPasses();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update icon", "error");
    }
  }, [apiKey, universeId, fetchPasses, showToast]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((v) => !v);
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(sorted.map((gp) => gp.id)));
  }, [sorted]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const bulkToggle = useCallback(async (field: "isForSale" | "isRegionalPricingEnabled") => {
    const ids = Array.from(selected);
    const items = passes.filter((gp) => ids.includes(gp.id));
    if (items.length === 0) return;

    const label = field === "isForSale" ? "For Sale" : "Regional Pricing";
    setBulkProgress(`Updating 0 of ${items.length}...`);
    let done = 0;
    let errors = 0;

    for (const gp of items) {
      try {
        await updateGamePass(apiKey, universeId, gp.id, {
          [field]: !gp[field],
        });
      } catch {
        errors++;
      }
      done++;
      setBulkProgress(`Updating ${done} of ${items.length}...`);
    }

    setBulkProgress("");
    if (errors > 0) {
      showToast(`${label} toggled with ${errors} error(s)`, "error");
    } else {
      showToast(`${label} toggled for ${items.length} item(s)`);
    }
    setSelected(new Set());
    setSelectMode(false);
    await fetchPasses();
  }, [selected, passes, apiKey, universeId, fetchPasses, showToast]);

  const handleEditSave = async (data: {
    name: string;
    description: string;
    price: number;
    isForSale: boolean;
    isRegionalPricingEnabled: boolean;
    imageFile: File | null;
  }) => {
    if (!editTarget) return;
    try {
      await updateGamePass(apiKey, universeId, editTarget.id, {
        name: data.name,
        description: data.description,
        price: data.price,
        isForSale: data.isForSale,
        isRegionalPricingEnabled: data.isRegionalPricingEnabled,
        imageFile: data.imageFile,
      });
      showToast("Gamepass updated successfully");
      await fetchPasses();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update gamepass", "error");
      throw e;
    }
  };

  const handleBulkCreate = async (item: {
    name: string;
    description: string;
    price: number;
    isRegionalPricingEnabled: boolean;
    imageFile: File | null;
  }) => {
    return await createGamePass(apiKey, universeId, item);
  };

  const dashboardUrl = `https://create.roblox.com/dashboard/creations/experiences/${universeId}/monetization/passes`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-surface-raised flex items-center justify-center">
          <Ticket className="h-4.5 w-4.5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Gamepasses</h2>
        <span className="text-xs text-muted-foreground ml-1">
          {!loading && `${sorted.length} item${sorted.length !== 1 ? "s" : ""}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Drag an image onto any icon to update it instantly. Deletion is only available on the Roblox Creator Dashboard.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button size="sm" onClick={() => setBulkOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Bulk Create
        </Button>
        <Button variant="outline" size="sm" onClick={fetchPasses} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} disabled={loading || passes.length === 0}>
          <Copy className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Roblox
          </a>
        </Button>

        {!loading && passes.length > 0 && (
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectMode}
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            {selectMode ? "Done" : "Select"}
          </Button>
        )}

        <div className="flex-1" />

        {/* Controls — inline with actions */}
        {!loading && passes.length > 0 && (
          <>
            <div className="relative w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Button
              variant={sortPrice ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSortPrice((prev) =>
                  prev === null ? "desc" : prev === "desc" ? "asc" : null
                )
              }
            >
              {sortPrice === "asc" ? <ArrowUp className="h-3.5 w-3.5 mr-1" /> : <ArrowDown className="h-3.5 w-3.5 mr-1" />}
              {sortPrice === "desc" ? "High→Low" : sortPrice === "asc" ? "Low→High" : "Price"}
            </Button>

            <Button
              variant={hideOffsale ? "default" : "outline"}
              size="sm"
              onClick={() => setHideOffsale((v) => !v)}
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" />
              {hideOffsale ? "On-Sale Only" : "Hide Off-Sale"}
            </Button>

            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "list" | "grid")}>
              <ToggleGroupItem value="list"><List className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="grid"><LayoutGrid className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </>
        )}
      </div>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-lg bg-surface-raised border border-border">
          <span className="text-xs text-muted-foreground font-medium">
            {selected.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
          <div className="flex-1" />
          {bulkProgress ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {bulkProgress}
            </span>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => bulkToggle("isForSale")}
              >
                Toggle For Sale
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selected.size === 0}
                onClick={() => bulkToggle("isRegionalPricingEnabled")}
              >
                Toggle Regional Pricing
              </Button>
              <Button size="sm" variant="ghost" onClick={toggleSelectMode}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

      {!loading && !error && passes.length === 0 && (
        <Alert variant="info">
          No gamepasses found. Use "Bulk Create" to add some.
        </Alert>
      )}

      {/* All items — no pagination, just scroll */}
      <div className="relative">
        {loading && passes.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {loading && passes.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
              : "flex flex-col gap-2"
          }
        >
          {sorted.map((gp, i) => (
            <ItemCard
              key={gp.id}
              name={gp.name}
              description={gp.description}
              price={gp.price}
              isForSale={gp.isForSale}
              iconUrl={gp.iconUrl}
              isRegionalPricingEnabled={gp.isRegionalPricingEnabled}
              onEdit={() => setEditTarget(gp)}
              onDropIcon={(file) => handleDropIcon(gp, file)}
              onDeleteIcon={() => handleDeleteIcon(gp)}
              view={viewMode}
              index={i}
              selectable={selectMode}
              isSelected={selected.has(gp.id)}
              onSelect={() => toggleSelect(gp.id)}
            />
          ))}
        </div>
      </div>

      {editTarget && (
        <EditDialog
          open
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
          title={`Edit Gamepass: ${editTarget.name}`}
          showDescription
          initial={{
            name: editTarget.name,
            description: editTarget.description,
            price: editTarget.price,
            isForSale: editTarget.isForSale,
            isRegionalPricingEnabled: editTarget.isRegionalPricingEnabled,
          }}
        />
      )}

      <BulkCreateDialog
        open={bulkOpen}
        onClose={(created) => {
          setBulkOpen(false);
          if (created) showToast("Gamepasses created successfully");
          fetchPasses();
        }}
        onCreate={handleBulkCreate}
        title="Bulk Create Gamepasses"
        showDescription
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        items={passes.map((gp) => ({ name: gp.name, id: gp.id, price: gp.price, isForSale: gp.isForSale }))}
        title="All Gamepasses"
      />
    </div>
  );
}
