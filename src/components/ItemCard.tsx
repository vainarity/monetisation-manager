import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, ImagePlus, Loader2, Trash2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

function RobuxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 960 1045" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="m479 0.12c9.78-0.04 22.13 0.53 28 1.31 5.77 0.77 14.55 2.34 19.5 3.5 4.95 1.15 13.27 3.49 18.5 5.19 5.23 1.71 14.23 5.19 20 7.75 5.77 2.56 74.85 41.74 153.5 87.06 78.65 45.32 145.7 84.2 149 86.4 3.3 2.19 9.83 7.02 14.5 10.73 4.67 3.71 13.46 11.84 19.52 18.09 6.06 6.24 13.55 14.72 16.63 18.85 3.09 4.12 7.99 11.32 10.9 16 2.92 4.68 7.67 13.45 10.57 19.5 2.91 6.05 6.68 14.82 8.39 19.5 1.72 4.68 4.4 13.68 5.98 20 1.57 6.32 3.45 14.87 4.18 19 1.07 6.05 1.33 42.64 1.33 189.5 0 169.93-0.12 182.63-1.77 191.5-0.98 5.23-2.86 13.77-4.19 19-1.34 5.23-3.83 13.33-5.54 18-1.71 4.67-5.37 13.23-8.12 19-2.76 5.77-7.07 13.87-9.58 18-2.51 4.12-7.74 11.77-11.62 17-3.87 5.23-11.58 14.16-17.11 19.86-5.54 5.7-13.45 13.09-17.57 16.42-4.13 3.33-11.77 8.86-17 12.27-5.23 3.42-71.6 42.1-147.5 85.95-75.9 43.85-142.27 81.87-147.5 84.49-5.23 2.62-14 6.43-19.5 8.48-5.5 2.05-14.95 4.99-21 6.55-6.05 1.55-16.06 3.53-22.25 4.4-6.86 0.96-18.28 1.58-29.25 1.58-10.97 0-22.39-0.62-29.25-1.58-6.19-0.87-16.2-2.85-22.25-4.4-6.05-1.56-15.5-4.5-21-6.55-5.5-2.05-14.27-5.86-19.5-8.48-5.23-2.62-72.05-41.09-148.5-85.5-76.45-44.41-142.15-82.77-146-85.24-3.85-2.48-10.83-7.56-15.5-11.29-4.67-3.74-12.86-11.22-18.2-16.62-5.33-5.41-12.03-12.76-14.89-16.34-2.86-3.58-7.89-10.55-11.19-15.5-3.29-4.95-9.07-15.3-12.85-23-3.77-7.7-8.61-19.4-10.76-26-2.14-6.6-4.82-16.5-5.95-22-1.13-5.5-2.53-13.83-3.11-18.5-0.7-5.66-1.05-66.56-1.05-182 0-115.44 0.35-176.34 1.05-182 0.58-4.68 1.97-13 3.1-18.5 1.12-5.5 3.83-15.4 6.03-22 2.19-6.6 6.57-17.4 9.73-24 3.15-6.6 8.39-16.27 11.64-21.5 3.25-5.23 9.33-13.78 13.53-19 4.19-5.23 12.53-14.23 18.52-20.02 6-5.78 14.27-13.03 18.4-16.11 4.12-3.07 9.97-7.17 13-9.1 3.03-1.93 68.95-40.1 146.5-84.82 77.55-44.71 145.16-83.24 150.25-85.62 5.09-2.38 14.31-6.07 20.5-8.2 6.19-2.12 15.52-4.87 20.75-6.09 5.23-1.23 13.77-2.81 19-3.53 5.23-0.72 17.38-1.34 27-1.39zm-39.5 87.98c-5.5 1.71-13.82 5.02-18.5 7.36-4.68 2.34-69.02 39.26-143 82.04-73.97 42.77-137.43 79.81-141 82.3-3.57 2.48-11.45 9.51-17.51 15.61-6.05 6.1-13.24 14.46-15.97 18.59-2.72 4.12-6.86 11.32-9.19 16-2.33 4.67-5.55 12.55-7.16 17.5-1.6 4.95-3.76 13.5-4.8 19-1.78 9.52-1.87 17.93-1.87 176.5v166.5c4.05 18.6 7.07 28.72 9.33 34.5 2.26 5.77 6.49 14.49 9.39 19.38 2.9 4.88 8.68 12.98 12.83 18 4.16 5.01 10.46 11.54 14 14.5 3.55 2.96 9.15 7.28 12.45 9.61 3.3 2.32 66.75 39.34 141 82.25 74.25 42.92 138.15 79.6 142 81.53 3.85 1.92 11.27 4.86 16.5 6.53 5.23 1.67 13.55 3.83 18.5 4.79 6.22 1.22 13.64 1.75 24 1.72 11.28-0.03 17.48-0.56 25-2.13 5.5-1.16 13.6-3.3 18-4.77 4.4-1.47 11.38-4.35 15.5-6.42 4.13-2.06 68.02-38.74 142-81.5 73.98-42.77 138.09-80.28 142.48-83.37 4.39-3.09 12.04-9.67 17-14.62 4.96-4.96 11.89-13.28 15.39-18.5 3.5-5.23 7.61-11.98 9.12-15 1.52-3.03 4.36-9.78 6.31-15 1.95-5.23 4.59-14.67 5.87-21l2.33-11.5c0-324.08-0.09-332.48-1.87-342-1.04-5.5-3.2-14.05-4.8-19-1.61-4.95-4.83-12.83-7.16-17.5-2.33-4.68-6.47-11.88-9.19-16-2.73-4.13-9.92-12.49-15.97-18.59-6.06-6.1-13.93-13.13-17.51-15.61-3.58-2.49-67.02-39.54-141-82.34-73.98-42.79-138.33-79.7-143-82.03-4.67-2.32-12.77-5.57-18-7.22-5.23-1.65-13.77-3.73-19-4.61-5.81-0.99-14.75-1.58-23-1.52-7.42 0.06-17.1 0.73-21.5 1.5-4.4 0.77-12.5 2.8-18 4.52zm43.5 82.35c11.24 0.29 17.56 0.94 23 2.38 4.13 1.1 10.42 3.09 14 4.44 3.58 1.35 8.98 3.7 12 5.23 3.02 1.53 52.08 29.55 109 62.26 56.92 32.71 106.65 61.56 110.5 64.11 3.85 2.54 10.09 7.55 13.87 11.13 3.78 3.57 9.58 10.1 12.87 14.5 3.3 4.4 8.18 12.5 10.85 18 2.67 5.5 6.09 14.27 10.37 29l0.3 135.5c0.27 123.01 0.14 136.28-1.37 144-0.91 4.67-2.77 11.65-4.14 15.5-1.36 3.85-4.33 10.6-6.6 15-2.27 4.4-6.66 11.37-9.76 15.5-3.1 4.12-8.51 10.21-12.01 13.52-3.51 3.31-9.3 8.01-12.88 10.44-3.58 2.44-54.2 31.86-112.5 65.38-58.3 33.52-109.6 62.66-114 64.75-4.4 2.09-12.5 5.06-18 6.6-9.31 2.62-11.27 2.81-28.5 2.81-17.24 0-19.18-0.19-28.5-2.81-5.5-1.55-13.15-4.28-17-6.07-3.85-1.8-54.25-30.39-112-63.54-57.75-33.15-108.6-62.62-113-65.5-4.4-2.87-11.09-8.12-14.88-11.65-3.78-3.54-9.57-10.03-12.87-14.43-3.3-4.4-7.69-11.38-9.75-15.5-2.06-4.13-4.89-10.65-6.28-14.5-1.39-3.85-3.26-10.83-4.14-15.5-1.44-7.6-1.59-22.76-1.07-278.5l2.37-8.5c1.3-4.68 4.01-12.32 6.01-17 2-4.68 6.31-12.55 9.57-17.5 3.27-4.95 9.56-12.6 13.99-17 4.43-4.4 11.2-10.09 15.05-12.64 3.85-2.55 55.26-32.36 114.25-66.25 58.99-33.88 109.61-62.66 112.5-63.94 2.89-1.29 8.4-3.38 12.25-4.66 3.85-1.27 10.15-2.91 14-3.63 4.64-0.88 12.23-1.19 22.5-0.93zm-123 471.55h240v-240h-240z"/>
    </svg>
  );
}

interface Props {
  name: string;
  description?: string;
  price: number;
  isForSale: boolean;
  iconUrl?: string;
  onEdit: () => void;
  onDropIcon?: (file: File) => Promise<void>;
  onDeleteIcon?: () => Promise<void>;
  view?: "list" | "grid";
  index?: number;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  isRegionalPricingEnabled?: boolean;
}

export default function ItemCard({
  name,
  description,
  price,
  isForSale,
  iconUrl,
  onEdit,
  onDropIcon,
  onDeleteIcon,
  view = "list",
  index = 0,
  selectable = false,
  isSelected = false,
  onSelect,
  isRegionalPricingEnabled = false,
}: Props) {
  const stagger = { animationDelay: `${index * 30}ms` };
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteIcon = useCallback(async () => {
    if (!onDeleteIcon) return;
    setDeleting(true);
    try {
      await onDeleteIcon();
    } finally {
      setDeleting(false);
    }
  }, [onDeleteIcon]);

  // Use a counter instead of boolean to prevent flicker from child elements
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);
    if (!onDropIcon) return;

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      await onDropIcon(file);
    } finally {
      setUploading(false);
    }
  }, [onDropIcon]);

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  const statusDot = (
    <div className={cn(
      "absolute top-2 left-2 w-2.5 h-2.5 rounded-full z-10 shadow-sm",
      isForSale ? "bg-primary shadow-primary/40" : "bg-destructive shadow-destructive/40"
    )} />
  );

  const priceDisplay = (
    <div className="flex items-center gap-0.5 mt-1">
      <RobuxIcon className={cn("h-4 w-4 shrink-0", isForSale ? "text-white" : "text-muted-foreground")} />
      <span className={cn("text-sm font-bold tabular-nums", isForSale ? "text-white" : "text-muted-foreground")}>
        {price.toLocaleString()}
      </span>
    </div>
  );

  const iconOverlay = (
    <>
      {dragOver && (
        <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center z-20 pointer-events-none">
          <ImagePlus className="h-6 w-6 text-foreground animate-pulse" />
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 pointer-events-none">
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        </div>
      )}
    </>
  );

  if (view === "grid") {
    return (
      <Card
        className={cn(
          "flex flex-col relative group animate-[fadeInUp_0.3s_ease-out_both] overflow-hidden",
          selectable && "cursor-pointer",
          selectable && isSelected && "ring-2 ring-foreground"
        )}
        style={stagger}
        onClick={selectable ? onSelect : undefined}
      >
        <div
          className={cn(
            "relative w-full aspect-square",
            dragOver && "ring-2 ring-foreground/30 ring-inset"
          )}
          {...dragHandlers}
        >
          {iconUrl ? (
            <img src={iconUrl} alt={name} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-surface-raised flex flex-col items-center justify-center gap-1 pointer-events-none">
              <ImagePlus className="h-5 w-5 text-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/40">Drop image</span>
            </div>
          )}
          {iconOverlay}
        </div>

        {selectable ? (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <Checkbox checked={isSelected} className="h-4.5 w-4.5 bg-black/40 backdrop-blur-sm border-white/50 data-[state=checked]:bg-foreground pointer-events-none" />
          </div>
        ) : statusDot}

        <button
          onClick={(e) => { if (selectable) { e.stopPropagation(); return; } onEdit(); }}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer",
            selectable && "hidden"
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {iconUrl && onDeleteIcon && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteIcon(); }}
            disabled={deleting}
            title="Remove icon"
            className={cn(
              "absolute bottom-[52px] left-2 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10",
              selectable && "hidden"
            )}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        )}

        <div className="p-3 flex items-end justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            {priceDisplay}
          </div>
          {isRegionalPricingEnabled && (
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" title="Regional pricing enabled" />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex items-center group animate-[fadeInUp_0.3s_ease-out_both]",
        selectable && "cursor-pointer",
        selectable && isSelected && "ring-2 ring-foreground"
      )}
      style={stagger}
      onClick={selectable ? onSelect : undefined}
    >
      {selectable && (
        <div className="pl-3 shrink-0 pointer-events-none">
          <Checkbox checked={isSelected} className="pointer-events-none" />
        </div>
      )}
      <div
        className={cn(
          "relative w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] m-2.5 sm:m-3 rounded-lg overflow-hidden shrink-0",
          dragOver && "ring-2 ring-foreground/30"
        )}
        {...dragHandlers}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full bg-surface-raised flex items-center justify-center pointer-events-none">
            <ImagePlus className="h-4 w-4 text-muted-foreground/30" />
          </div>
        )}
        {iconOverlay}
        <div className={cn(
          "absolute top-1 left-1 w-2 h-2 rounded-full z-10 pointer-events-none",
          isForSale ? "bg-primary shadow-sm shadow-primary/40" : "bg-destructive shadow-sm shadow-destructive/40"
        )} />
      </div>
      <div className="flex-1 py-3 pr-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block">{name}</span>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
        {priceDisplay}
      </div>
      <div className="flex items-center shrink-0">
        {isRegionalPricingEnabled && (
          <Globe className="h-4 w-4 text-muted-foreground/50 mr-1" title="Regional pricing enabled" />
        )}
        {iconUrl && onDeleteIcon && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteIcon(); }}
            disabled={deleting}
            title="Remove icon"
            className={cn(
              "p-2 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100",
              selectable && "hidden"
            )}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={(e) => { if (selectable) { e.stopPropagation(); return; } onEdit(); }}
          className={cn(
            "mr-3 p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-surface-raised transition-all cursor-pointer opacity-0 group-hover:opacity-100",
            selectable && "hidden"
          )}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
