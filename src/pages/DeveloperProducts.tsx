import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  ExternalLink,
  RefreshCw,
  Copy,
  Download,
  ArrowUp,
  ArrowDown,
  List,
  LayoutGrid,
  Search,
  Loader2,
  EyeOff,
  ShoppingCart,
  CheckSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AppState, DeveloperProduct } from "../types";
import {
  listDeveloperProducts,
  createDeveloperProduct,
  updateDeveloperProduct,
} from "../api/roblox";
import ItemCard from "../components/ItemCard";
import EditDialog from "../components/EditDialog";
import BulkCreateDialog from "../components/BulkCreateDialog";
import ExportDialog from "../components/ExportDialog";
import ImportFromUniverseDialog from "../components/ImportFromUniverseDialog";
import { useToast } from "../components/ToastProvider";

interface Props {
  appState: AppState;
}

export default function DeveloperProducts({ appState }: Props) {
  const { apiKey, universeId } = appState;
  const { showToast } = useToast();

  const [products, setProducts] = useState<DeveloperProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editTarget, setEditTarget] = useState<DeveloperProduct | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [sortPrice, setSortPrice] = useState<"asc" | "desc" | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [hideOffsale, setHideOffsale] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDeveloperProducts(apiKey, universeId);
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load developer products.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, universeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    let result = products;
    if (hideOffsale) result = result.filter((dp) => dp.isForSale);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((dp) => dp.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, search, hideOffsale]);

  const sorted = useMemo(() => {
    if (!sortPrice) return filtered;
    return [...filtered].sort((a, b) =>
      sortPrice === "desc" ? b.price - a.price : a.price - b.price
    );
  }, [filtered, sortPrice]);

  const handleDeleteIcon = useCallback(async (dp: DeveloperProduct) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 150;
      canvas.height = 150;
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );
      const file = new File([blob], "blank.png", { type: "image/png" });
      await updateDeveloperProduct(apiKey, universeId, dp.id, { imageFile: file });
      showToast(`Icon removed for "${dp.name}"`);
      await fetchProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to remove icon", "error");
    }
  }, [apiKey, universeId, fetchProducts, showToast]);

  const handleDropIcon = useCallback(async (dp: DeveloperProduct, file: File) => {
    try {
      await updateDeveloperProduct(apiKey, universeId, dp.id, { imageFile: file });
      showToast(`Icon updated for "${dp.name}"`);
      await fetchProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update icon", "error");
    }
  }, [apiKey, universeId, fetchProducts, showToast]);

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
    setSelected(new Set(sorted.map((dp) => dp.id)));
  }, [sorted]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const bulkToggle = useCallback(async (field: "isForSale" | "isRegionalPricingEnabled") => {
    const ids = Array.from(selected);
    const items = products.filter((dp) => ids.includes(dp.id));
    if (items.length === 0) return;

    const label = field === "isForSale" ? "For Sale" : "Regional Pricing";
    setBulkProgress(`Updating 0 of ${items.length}...`);
    let done = 0;
    let errors = 0;

    for (const dp of items) {
      try {
        await updateDeveloperProduct(apiKey, universeId, dp.id, {
          [field]: !dp[field],
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
    await fetchProducts();
  }, [selected, products, apiKey, universeId, fetchProducts, showToast]);

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
      await updateDeveloperProduct(apiKey, universeId, editTarget.id, {
        name: data.name,
        price: data.price,
        isForSale: data.isForSale,
        isRegionalPricingEnabled: data.isRegionalPricingEnabled,
        imageFile: data.imageFile,
      });
      showToast("Product updated successfully");
      await fetchProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update product", "error");
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
    return await createDeveloperProduct(apiKey, universeId, item);
  };

  const dashboardUrl = `https://create.roblox.com/dashboard/creations/experiences/${universeId}/monetization/developer-products`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-surface-raised flex items-center justify-center">
          <ShoppingCart className="h-4.5 w-4.5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Developer Products</h2>
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
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Import Universe
        </Button>
        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} disabled={loading || products.length === 0}>
          <Copy className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Roblox
          </a>
        </Button>

        {!loading && products.length > 0 && (
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

        {!loading && products.length > 0 && (
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

      {!loading && !error && products.length === 0 && (
        <Alert variant="info">
          No developer products found. Use "Bulk Create" to add some.
        </Alert>
      )}

      {/* All items — no pagination, just scroll */}
      <div className="relative">
        {loading && products.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {loading && products.length === 0 && (
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
          {sorted.map((dp, i) => (
            <ItemCard
              key={dp.id}
              name={dp.name}
              price={dp.price}
              isForSale={dp.isForSale}
              iconUrl={dp.iconUrl}
              isRegionalPricingEnabled={dp.isRegionalPricingEnabled}
              onEdit={() => setEditTarget(dp)}
              onDropIcon={(file) => handleDropIcon(dp, file)}
              onDeleteIcon={() => handleDeleteIcon(dp)}
              view={viewMode}
              index={i}
              selectable={selectMode}
              isSelected={selected.has(dp.id)}
              onSelect={() => toggleSelect(dp.id)}
            />
          ))}
        </div>
      </div>

      {editTarget && (
        <EditDialog
          open
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
          title={`Edit Product: ${editTarget.name}`}
          showDescription={false}
          initial={{
            name: editTarget.name,
            description: "",
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
          if (created) showToast("Developer products created successfully");
          fetchProducts();
        }}
        onCreate={handleBulkCreate}
        title="Bulk Create Developer Products"
        showDescription={false}
      />

      <ImportFromUniverseDialog
        open={importOpen}
        onClose={(created) => {
          setImportOpen(false);
          if (created) {
            showToast("Developer products imported successfully");
            fetchProducts();
          }
        }}
        title="Import Developer Products From Another Universe"
        emptyLabel="No developer products found in that source universe."
        showDescription={false}
        loadSourceItems={(sourceUniverseId) => listDeveloperProducts(apiKey, sourceUniverseId)}
        onCreate={(item) => createDeveloperProduct(apiKey, universeId, item)}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        items={products.map((dp) => ({ name: dp.name, id: dp.id, price: dp.price, isForSale: dp.isForSale }))}
        title="All Developer Products"
      />
    </div>
  );
}
