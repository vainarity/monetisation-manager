import { useState, useRef, useEffect, useCallback } from "react";
import {
  Paintbrush,
  Download,
  Upload,
  RotateCw,
  ImagePlus,
  Loader2,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { AppState, GamePass, DeveloperProduct } from "../types";
import { listGamePasses, listDeveloperProducts, updateGamePass, updateDeveloperProduct } from "../api/roblox";
import { useToast } from "../components/ToastProvider";
import { cn } from "@/lib/utils";

const SIZES = [
  { label: "512 × 512", w: 512, h: 512 },
  { label: "1024 × 1024", w: 1024, h: 1024 },
  { label: "256 × 256", w: 256, h: 256 },
  { label: "150 × 150", w: 150, h: 150 },
];

interface ImageState {
  img: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

interface ExistingItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  isForSale?: boolean;
  iconUrl?: string;
  type: "gamepass" | "devproduct";
}

interface Props {
  appState: AppState;
}

function isConfigured(appState: AppState): boolean {
  return appState.apiKey !== "" && appState.universeId !== "";
}

// Cache for the expensive dilation result — reused when only color changes
let _dilationCache: {
  key: string;
  alphaMap: Uint8Array;
  dilated: Uint8Array;
  cw: number;
  ch: number;
} | null = null;

function getDilationCacheKey(imgState: ImageState, cw: number, ch: number, strokeWidth: number): string {
  const { x, y, scale, rotation, flipX, flipY, img } = imgState;
  return `${img.src}|${cw}|${ch}|${x}|${y}|${scale}|${rotation}|${flipX}|${flipY}|${strokeWidth}`;
}

/**
 * Proper shape-outline stroke using alpha detection.
 * 1. Draw image onto a temp canvas
 * 2. Read pixel data, dilate the alpha mask by strokeWidth
 * 3. Fill dilated area with stroke color
 * 4. Draw original image on top
 */
function drawScene(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  imgState: ImageState | null,
  strokeColor: string,
  strokeWidth: number,
) {
  ctx.clearRect(0, 0, cw, ch);

  // Background
  // Transparent background — don't fill anything
  if (!imgState) return;

  const { img, x, y, scale, rotation, flipX, flipY } = imgState;
  const fitScale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const drawW = img.naturalWidth * fitScale * scale;
  const drawH = img.naturalHeight * fitScale * scale;

  const applyTransform = (c: CanvasRenderingContext2D) => {
    c.translate(cw / 2 + x, ch / 2 + y);
    c.rotate((rotation * Math.PI) / 180);
    c.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  };

  if (strokeWidth > 0) {
    const cacheKey = getDilationCacheKey(imgState, cw, ch, strokeWidth);
    let alphaMap: Uint8Array;
    let dilated: Uint8Array;

    if (_dilationCache && _dilationCache.key === cacheKey) {
      // Reuse cached dilation (only color changed)
      alphaMap = _dilationCache.alphaMap;
      dilated = _dilationCache.dilated;
    } else {
      // Step 1: Render image to a temp canvas to get the alpha shape
      const tmp = document.createElement("canvas");
      tmp.width = cw;
      tmp.height = ch;
      const tc = tmp.getContext("2d")!;

      tc.save();
      applyTransform(tc);
      tc.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      tc.restore();

      // Step 2: Read pixel data and create dilated alpha mask
      const srcData = tc.getImageData(0, 0, cw, ch);
      const srcAlpha = srcData.data;

      alphaMap = new Uint8Array(cw * ch);
      for (let i = 0; i < cw * ch; i++) {
        alphaMap[i] = srcAlpha[i * 4 + 3] > 10 ? 1 : 0;
      }

      // Fast dilation using separable two-pass distance approach
      const sw = Math.ceil(strokeWidth);
      const swSq = sw * sw;
      dilated = new Uint8Array(cw * ch);

      const hDist = new Int32Array(cw * ch);
      const INF = cw + ch;

      for (let py = 0; py < ch; py++) {
        const rowOff = py * cw;
        let dist = INF;
        for (let px = 0; px < cw; px++) {
          if (alphaMap[rowOff + px]) { dist = 0; } else { dist = Math.min(dist + 1, INF); }
          hDist[rowOff + px] = dist;
        }
        dist = INF;
        for (let px = cw - 1; px >= 0; px--) {
          if (alphaMap[rowOff + px]) { dist = 0; } else { dist = Math.min(dist + 1, INF); }
          if (dist < hDist[rowOff + px]) hDist[rowOff + px] = dist;
        }
      }

      for (let px = 0; px < cw; px++) {
        for (let py = 0; py < ch; py++) {
          const idx = py * cw + px;
          if (alphaMap[idx]) { dilated[idx] = 1; continue; }
          const yStart = Math.max(0, py - sw);
          const yEnd = Math.min(ch - 1, py + sw);
          for (let sy = yStart; sy <= yEnd; sy++) {
            const dy = sy - py;
            const maxDx = Math.sqrt(swSq - dy * dy) | 0;
            if (hDist[sy * cw + px] <= maxDx) {
              dilated[idx] = 1;
              break;
            }
          }
        }
      }

      _dilationCache = { key: cacheKey, alphaMap, dilated, cw, ch };
    }

    // Step 3: Draw the stroke (dilated minus original) in stroke color
    const strokeData = new ImageData(cw, ch);
    const r = parseInt(strokeColor.slice(1, 3), 16);
    const g = parseInt(strokeColor.slice(3, 5), 16);
    const b = parseInt(strokeColor.slice(5, 7), 16);

    for (let i = 0; i < cw * ch; i++) {
      if (dilated[i] && !alphaMap[i]) {
        strokeData.data[i * 4] = r;
        strokeData.data[i * 4 + 1] = g;
        strokeData.data[i * 4 + 2] = b;
        strokeData.data[i * 4 + 3] = 255;
      }
    }

    const strokeCanvas = document.createElement("canvas");
    strokeCanvas.width = cw;
    strokeCanvas.height = ch;
    const sc = strokeCanvas.getContext("2d")!;
    sc.putImageData(strokeData, 0, 0);
    ctx.drawImage(strokeCanvas, 0, 0);
  }

  // Draw actual image on top
  ctx.save();
  applyTransform(ctx);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

/**
 * Load an image as a blob to avoid CORS tainting the canvas.
 * Proxies Roblox CDN URLs through our local proxy.
 */
async function loadImageSafe(url: string): Promise<HTMLImageElement> {
  // Proxy external roblox CDN URLs through our thumbnail proxy
  let fetchUrl = url;
  if (url.includes("rbxcdn.com") || url.includes("roblox.com")) {
    // Use our proxy: /api/proxy-image?url=...
    fetchUrl = `/__image-proxy?url=${encodeURIComponent(url)}`;
  }

  const res = await fetch(fetchUrl);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = blobUrl;
  });
}

export default function IconEditor({ appState }: Props) {
  const { apiKey, universeId } = appState;
  const configured = isConfigured(appState);
  const { showToast } = useToast();
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  if (!offscreenRef.current && typeof document !== "undefined") {
    offscreenRef.current = document.createElement("canvas");
  }

  const [sizeIdx, setSizeIdx] = useState(0);
  const canvasW = SIZES[sizeIdx].w;
  const canvasH = SIZES[sizeIdx].h;

  const [strokeColor, setStrokeColor] = useState("#000000");
  const strokeColorRef = useRef("#000000");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorTextRef = useRef<HTMLInputElement>(null);
  const colorRafId = useRef<number>(0);
  const [strokeWidth, setStrokeWidth] = useState(0);

  const [img, setImg] = useState<ImageState | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

  const [existingItems, setExistingItems] = useState<ExistingItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [targetItemId, setTargetItemId] = useState<string>("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!configured) {
      setLoadingItems(false);
      return;
    }
    setLoadingItems(true);
    Promise.all([
      listGamePasses(apiKey, universeId).catch(() => [] as GamePass[]),
      listDeveloperProducts(apiKey, universeId).catch(() => [] as DeveloperProduct[]),
    ]).then(([gps, dps]) => {
      setExistingItems([
        ...gps.map((gp) => ({ id: gp.id, name: gp.name, description: gp.description, price: gp.price, isForSale: gp.isForSale, iconUrl: gp.iconUrl, type: "gamepass" as const })),
        ...dps.map((dp) => ({ id: dp.id, name: dp.name, description: dp.description, price: dp.price, isForSale: dp.isForSale, iconUrl: dp.iconUrl, type: "devproduct" as const })),
      ]);
      setLoadingItems(false);
    });
  }, [apiKey, universeId, configured]);

  const loadFromExisting = useCallback(async (itemId: string) => {
    const item = existingItems.find((i) => i.id === itemId);
    if (!item?.iconUrl) return;
    setSelectedItemId(itemId);
    setTargetItemId(itemId);
    setLoadingImage(true);
    try {
      const image = await loadImageSafe(item.iconUrl);
      setImg({ img: image, x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false });
    } catch {
      showToast("Failed to load icon — try downloading and dropping it manually", "error");
    } finally {
      setLoadingImage(false);
    }
  }, [existingItems, showToast]);

  const loadFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg({ img: image, x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false });
    };
    image.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  }, [loadFile]);

  // Render — throttled to one frame at a time so color picker stays responsive
  const renderRafId = useRef<number>(0);
  const renderInProgress = useRef(false);

  useEffect(() => {
    cancelAnimationFrame(renderRafId.current);
    renderRafId.current = requestAnimationFrame(() => {
      if (renderInProgress.current) return;
      renderInProgress.current = true;

      const offscreen = offscreenRef.current;
      const display = displayCanvasRef.current;
      if (!offscreen || !display) { renderInProgress.current = false; return; }

      offscreen.width = canvasW;
      offscreen.height = canvasH;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) { renderInProgress.current = false; return; }

      drawScene(offCtx, canvasW, canvasH, img, strokeColor, strokeWidth);

      display.width = canvasW;
      display.height = canvasH;
      const dispCtx = display.getContext("2d");
      if (dispCtx) {
        dispCtx.clearRect(0, 0, canvasW, canvasH);
        dispCtx.drawImage(offscreen, 0, 0);
      }
      renderInProgress.current = false;
    });

    return () => cancelAnimationFrame(renderRafId.current);
  }, [img, canvasW, canvasH, strokeColor, strokeWidth]);

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!img) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, imgX: img.x, imgY: img.y };
  }, [img]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !img || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const scaleRatio = canvasW / rect.width;
    const dx = (e.clientX - dragStart.current.x) * scaleRatio;
    const dy = (e.clientY - dragStart.current.y) * scaleRatio;
    setImg({ ...img, x: dragStart.current.imgX + dx, y: dragStart.current.imgY + dy });
  }, [dragging, img, canvasW]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const alignH = (pos: "left" | "center" | "right") => {
    if (!img) return;
    setImg({ ...img, x: pos === "left" ? -(canvasW / 4) : pos === "right" ? canvasW / 4 : 0 });
  };
  const alignV = (pos: "top" | "center" | "bottom") => {
    if (!img) return;
    setImg({ ...img, y: pos === "top" ? -(canvasH / 4) : pos === "bottom" ? canvasH / 4 : 0 });
  };

  // Export blob — completely fresh canvas so no taint issues
  const getBlob = useCallback((): Promise<Blob> => {
    return new Promise((res, rej) => {
      const c = document.createElement("canvas");
      c.width = canvasW;
      c.height = canvasH;
      const ctx = c.getContext("2d");
      if (!ctx) return rej(new Error("No canvas context"));
      drawScene(ctx, canvasW, canvasH, img, strokeColor, strokeWidth);
      c.toBlob((b) => (b ? res(b) : rej(new Error("Export failed"))), "image/png");
    });
  }, [canvasW, canvasH, img, strokeColor, strokeWidth]);

  const exportCanvas = useCallback(async () => {
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icon-${canvasW}x${canvasH}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast("Failed to export — " + (e instanceof Error ? e.message : "unknown error"), "error");
    }
  }, [getBlob, canvasW, canvasH, showToast]);

  // Upload to existing item
  const uploadToItem = useCallback(async () => {
    if (!targetItemId) return;
    const item = existingItems.find((i) => i.id === targetItemId);
    if (!item) return;

    setUploading(true);
    try {
      const blob = await getBlob();
      console.log("[IconEditor] Got blob:", blob.size, "bytes, type:", blob.type);
      const file = new File([blob], "icon.png", { type: "image/png" });
      console.log("[IconEditor] Uploading to", item.type, item.id, item.name, "file size:", file.size);

      const form = new FormData();
      // Gamepasses use "file", dev products use "imageFile"
      if (item.type === "gamepass") {
        form.append("file", file, "icon.png");
      } else {
        form.append("imageFile", file, "icon.png");
      }

      const endpoint = item.type === "gamepass"
        ? `/api/roblox/game-passes/v1/universes/${universeId}/game-passes/${item.id}`
        : `/api/roblox/developer-products/v2/universes/${universeId}/developer-products/${item.id}`;

      console.log("[IconEditor] PATCH", endpoint, "fields:", { name: item.name, price: item.price, isForSale: item.isForSale });

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "x-api-key": apiKey },
        body: form,
      });

      console.log("[IconEditor] Response:", res.status, res.statusText);
      const responseText = await res.text();
      console.log("[IconEditor] Response body:", responseText);
      if (!res.ok) {
        throw new Error(`Roblox API ${res.status}: ${responseText}`);
      }
      showToast(`Icon updated for "${item.name}"`, "success");
    } catch (e) {
      console.error("[IconEditor] Upload failed:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      showToast(`Failed to update icon: ${msg}`, "error");
    } finally {
      setUploading(false);
    }
  }, [targetItemId, existingItems, apiKey, universeId, getBlob, showToast]);

  const previewSize = Math.min(420, canvasW);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-surface-raised flex items-center justify-center">
          <Paintbrush className="h-4.5 w-4.5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Icon Editor</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Create or edit icons with strokes that follow the image shape. Apply directly to gamepasses or dev products.
      </p>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex flex-col items-center gap-3">
          <div
            ref={previewRef}
            className={cn(
              "relative border-2 border-dashed border-border rounded-xl overflow-hidden select-none",
              "bg-[length:20px_20px] bg-[position:0_0,10px_10px]",
              "[background-image:linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%),linear-gradient(45deg,#27272a_25%,transparent_25%,transparent_75%,#27272a_75%)] bg-[#18181b]",
              img ? "cursor-move" : "cursor-default"
            )}
            style={{ width: previewSize, height: previewSize }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
          >
            <canvas ref={displayCanvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} />
            {!img && !loadingImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <ImagePlus className="h-10 w-10 text-muted-foreground/20" />
                <span className="text-sm text-muted-foreground/40">Drop an image here</span>
              </div>
            )}
            {loadingImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {/* Circle crop guide overlay */}
            {img && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <mask id="circle-mask">
                      <rect width="100" height="100" fill="white" />
                      <circle cx="50" cy="50" r="50" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#circle-mask)" />
                  <circle cx="50" cy="50" r="49.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
                </svg>
              </div>
            )}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/60 font-mono z-20">
              {canvasW}×{canvasH}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <ImagePlus className="h-3.5 w-3.5 mr-1" />
                Load Image
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFile(f);
                }} />
              </label>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCanvas} disabled={!img}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-[280px]">
          {/* Source */}
          <div className={cn("rounded-xl border border-border bg-surface p-4 flex flex-col gap-3", !configured && "opacity-50")}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</span>
            <Label className="text-xs text-muted-foreground">
              {configured ? "Load from existing item" : "Connect an experience to load existing items"}
            </Label>
            <Select
              value={selectedItemId || "_none"}
              onValueChange={(v) => {
                if (v === "_none") { setSelectedItemId(""); return; }
                loadFromExisting(v);
              }}
              disabled={!configured}
            >
              <SelectTrigger>
                <SelectValue placeholder={configured ? "Choose a gamepass or product..." : "No experience connected"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None — use custom image</SelectItem>
                {loadingItems && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                {existingItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      {item.iconUrl && <img src={item.iconUrl} alt="" className="w-5 h-5 rounded object-cover" />}
                      <span>{item.name}</span>
                      <span className="text-muted-foreground text-[10px] ml-1">
                        {item.type === "gamepass" ? "GP" : "DP"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Canvas Size</span>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSizeIdx(i)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer",
                    sizeIdx === i
                      ? "bg-foreground text-background font-medium"
                      : "bg-surface-raised text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke */}
          <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image Stroke</span>
            <p className="text-[11px] text-muted-foreground -mt-1">Outlines the shape of your image — follows transparent edges like a real stroke.</p>
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-muted-foreground">Thickness</Label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={40} value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="flex-1 accent-primary" />
                  <span className="text-xs text-muted-foreground font-mono w-8 text-right">{strokeWidth}px</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" ref={colorInputRef} defaultValue={strokeColor}
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      strokeColorRef.current = val;
                      if (colorTextRef.current) colorTextRef.current.value = val;
                      cancelAnimationFrame(colorRafId.current);
                      colorRafId.current = requestAnimationFrame(() => {
                        setStrokeColor(strokeColorRef.current);
                      });
                    }}
                    onChange={(e) => {
                      strokeColorRef.current = e.target.value;
                      if (colorTextRef.current) colorTextRef.current.value = e.target.value;
                      setStrokeColor(e.target.value);
                    }}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5" />
                  <input ref={colorTextRef} defaultValue={strokeColor}
                    onChange={(e) => {
                      strokeColorRef.current = e.target.value;
                      if (colorInputRef.current) colorInputRef.current.value = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setStrokeColor(e.target.value);
                    }}
                    className="flex h-9 w-[90px] rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-foreground/15 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Transform */}
          {img && (
            <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Transform</span>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Scale</Label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0.1} max={3} step={0.05} value={img.scale}
                    onChange={(e) => setImg({ ...img, scale: Number(e.target.value) })}
                    className="flex-1 accent-primary" />
                  <span className="text-xs text-muted-foreground font-mono w-10 text-right">{(img.scale * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rotation</Label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={360} value={img.rotation}
                    onChange={(e) => setImg({ ...img, rotation: Number(e.target.value) })}
                    className="flex-1 accent-primary" />
                  <span className="text-xs text-muted-foreground font-mono w-10 text-right">{img.rotation}°</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setImg({ ...img, rotation: (img.rotation + 90) % 360 })}>
                  <RotateCw className="h-3.5 w-3.5 mr-1" /> 90°
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImg({ ...img, flipX: !img.flipX })}>
                  <FlipHorizontal className="h-3.5 w-3.5 mr-1" /> Flip H
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImg({ ...img, flipY: !img.flipY })}>
                  <FlipVertical className="h-3.5 w-3.5 mr-1" /> Flip V
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Horizontal Align</Label>
                <div className="flex items-center gap-1.5">
                  {(["left", "center", "right"] as const).map((pos) => (
                    <button key={pos} onClick={() => alignH(pos)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer capitalize",
                        img.x === (pos === "left" ? -(canvasW / 4) : pos === "right" ? canvasW / 4 : 0)
                          ? "bg-surface-raised text-foreground font-medium"
                          : "bg-surface-raised text-muted-foreground hover:text-foreground"
                      )}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Vertical Align</Label>
                <div className="flex items-center gap-1.5">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button key={pos} onClick={() => alignV(pos)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer capitalize",
                        img.y === (pos === "top" ? -(canvasH / 4) : pos === "bottom" ? canvasH / 4 : 0)
                          ? "bg-surface-raised text-foreground font-medium"
                          : "bg-surface-raised text-muted-foreground hover:text-foreground"
                      )}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="self-start"
                onClick={() => setImg({ ...img, x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false })}>
                Reset All
              </Button>
            </div>
          )}

          {/* Apply to any item */}
          <div className={cn("rounded-xl border border-border bg-surface p-4 flex flex-col gap-3", !configured && "opacity-50")}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Apply to Item</span>
            <Label className="text-xs text-muted-foreground">
              {configured ? "Choose which gamepass or product to update" : "Connect an experience to upload icons"}
            </Label>
            <Select
              value={targetItemId || "_none"}
              onValueChange={(v) => setTargetItemId(v === "_none" ? "" : v)}
              disabled={!configured}
            >
              <SelectTrigger>
                <SelectValue placeholder={configured ? "Select target..." : "No experience connected"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select a target...</SelectItem>
                {existingItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      {item.iconUrl && <img src={item.iconUrl} alt="" className="w-5 h-5 rounded object-cover" />}
                      <span>{item.name}</span>
                      <span className="text-muted-foreground text-[10px] ml-1">
                        {item.type === "gamepass" ? "GP" : "DP"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={uploadToItem} disabled={uploading || !img || !targetItemId || !configured} className="self-start">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? "Uploading..." : `Apply Icon${targetItemId ? " to " + (existingItems.find((i) => i.id === targetItemId)?.name ?? "") : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
