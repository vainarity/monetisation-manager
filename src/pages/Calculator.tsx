import { useState, useCallback, useRef, useEffect } from "react";
import { Calculator as CalcIcon, Info, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Format a numeric string with commas (1000000 → 1,000,000). Returns [displayValue, rawNumber]. */
function fmtRobux(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function parseRobux(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, "")) || 0;
}

function useRobuxInput(initial = "") {
  const [display, setDisplay] = useState(initial);
  const value = parseRobux(display);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(fmtRobux(e.target.value));
  }, []);
  return { display, value, onChange } as const;
}

type ItemType = "clothing" | "ugc";

// Sorted: popular first, then alphabetical
const CURRENCIES: { code: string; symbol: string; rate: number }[] = [
  // Popular
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "JPY", symbol: "¥", rate: 149.5 },
  { code: "CAD", symbol: "CA$", rate: 1.36 },
  { code: "AUD", symbol: "A$", rate: 1.53 },
  { code: "CHF", symbol: "CHF", rate: 0.88 },
  { code: "CNY", symbol: "¥", rate: 7.24 },
  { code: "INR", symbol: "₹", rate: 83.1 },
  { code: "BRL", symbol: "R$", rate: 5.05 },
  { code: "KRW", symbol: "₩", rate: 1330 },
  { code: "MXN", symbol: "MX$", rate: 17.15 },
  { code: "PLN", symbol: "zł", rate: 3.95 },
  { code: "SEK", symbol: "kr", rate: 10.45 },
  { code: "NOK", symbol: "kr", rate: 10.55 },
  { code: "DKK", symbol: "kr", rate: 6.87 },
  { code: "TRY", symbol: "₺", rate: 32.4 },
  { code: "RUB", symbol: "₽", rate: 92.5 },
  { code: "ZAR", symbol: "R", rate: 18.6 },
  { code: "SGD", symbol: "S$", rate: 1.34 },
  { code: "HKD", symbol: "HK$", rate: 7.82 },
  { code: "NZD", symbol: "NZ$", rate: 1.64 },
  { code: "THB", symbol: "฿", rate: 35.5 },
  { code: "TWD", symbol: "NT$", rate: 31.5 },
  // Alphabetical rest
  { code: "AED", symbol: "د.إ", rate: 3.67 },
  { code: "ARS", symbol: "AR$", rate: 875 },
  { code: "BGN", symbol: "лв", rate: 1.80 },
  { code: "CLP", symbol: "CL$", rate: 935 },
  { code: "COP", symbol: "CO$", rate: 3950 },
  { code: "CZK", symbol: "Kč", rate: 22.8 },
  { code: "EGP", symbol: "E£", rate: 30.9 },
  { code: "GEL", symbol: "₾", rate: 2.65 },
  { code: "HRK", symbol: "kn", rate: 6.93 },
  { code: "HUF", symbol: "Ft", rate: 355 },
  { code: "IDR", symbol: "Rp", rate: 15700 },
  { code: "ILS", symbol: "₪", rate: 3.65 },
  { code: "ISK", symbol: "kr", rate: 137 },
  { code: "KES", symbol: "KSh", rate: 153 },
  { code: "MAD", symbol: "MAD", rate: 10.05 },
  { code: "MYR", symbol: "RM", rate: 4.72 },
  { code: "NGN", symbol: "₦", rate: 1550 },
  { code: "PEN", symbol: "S/.", rate: 3.72 },
  { code: "PHP", symbol: "₱", rate: 56.2 },
  { code: "PKR", symbol: "₨", rate: 278 },
  { code: "QAR", symbol: "QR", rate: 3.64 },
  { code: "RON", symbol: "lei", rate: 4.58 },
  { code: "SAR", symbol: "SR", rate: 3.75 },
  { code: "UAH", symbol: "₴", rate: 41.2 },
  { code: "UYU", symbol: "UY$", rate: 39.5 },
  { code: "VND", symbol: "₫", rate: 24500 },
];

const TAX_CONFIGS = {
  clothing: {
    label: "Clothing & Gamepass",
    tiers: [
      { label: "Direct Sale", creator: 70, roblox: 30, game: 0 },
      { label: "In-Game Sale (Pls Donate)", creator: 60, roblox: 30, game: 10 },
    ],
  },
  ugc: {
    label: "UGC",
    tiers: [
      { label: "Direct Sale", creator: 30, roblox: 70, game: 0 },
      { label: "In-Game Sale (Pls Donate)", creator: 30, roblox: 30, game: 40 },
    ],
  },
} as const;

export default function Calculator() {
  const [itemType, setItemType] = useState<ItemType>("clothing");
  const [tierIdx, setTierIdx] = useState(0);
  const priceInput = useRobuxInput();

  const devexRobux = useRobuxInput();
  const [devexTax, setDevexTax] = useState("");
  const devexRemaining = useRobuxInput();
  const [currency, setCurrency] = useState("USD");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyScrollRef = useRef<HTMLDivElement>(null);
  const currencyWrapRef = useRef<HTMLDivElement>(null);

  // Scroll selected currency into view when opening
  useEffect(() => {
    if (currencyOpen && currencyScrollRef.current) {
      const active = currencyScrollRef.current.querySelector("[data-active]") as HTMLElement | null;
      if (active) active.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [currencyOpen]);

  // Convert vertical scroll to horizontal on the currency list
  useEffect(() => {
    const el = currencyScrollRef.current;
    if (!el || !currencyOpen) return;
    const handler = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [currencyOpen]);

  // Close on click outside
  useEffect(() => {
    if (!currencyOpen) return;
    const handler = (e: MouseEvent) => {
      if (currencyWrapRef.current && !currencyWrapRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [currencyOpen]);

  const config = TAX_CONFIGS[itemType];
  const tier = config.tiers[tierIdx];
  const priceNum = priceInput.value;
  const creatorShare = tier.creator / 100;
  const earningsFromPrice = Math.floor(priceNum * creatorShare);
  const priceForEarnings = Math.ceil(priceNum / creatorShare);

  const robuxNum = devexRobux.value;
  const taxPct = Number(devexTax) || 0;
  const remainingNum = devexRemaining.value;

  const OLD_DEVEX_RATE = 0.0035;
  const NEW_DEVEX_RATE = 0.0038;

  // If no remaining set, show both rates on the full amount
  const allOldUsd = robuxNum * OLD_DEVEX_RATE;
  const allNewUsd = robuxNum * NEW_DEVEX_RATE;
  const allOldAfterTax = allOldUsd * (1 - taxPct / 100);
  const allNewAfterTax = allNewUsd * (1 - taxPct / 100);

  // Split payout: first `remainingNum` at old rate, the rest at new rate
  const atOldRate = Math.min(remainingNum, robuxNum);
  const atNewRate = Math.max(0, robuxNum - remainingNum);
  const splitOldUsd = atOldRate * OLD_DEVEX_RATE;
  const splitNewUsd = atNewRate * NEW_DEVEX_RATE;
  const splitTotal = splitOldUsd + splitNewUsd;
  const splitTotalAfterTax = splitTotal * (1 - taxPct / 100);

  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const fmtMoney = (usd: number) => {
    const converted = usd * cur.rate;
    return `${cur.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-surface-raised flex items-center justify-center">
          <CalcIcon className="h-4.5 w-4.5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tax Calculator</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Calculate your earnings after Roblox marketplace fees and DevEx conversions.
      </p>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ── Left: Calculators ── */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Item Tax Calculator */}
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Marketplace Tax</h3>
              <p className="text-sm text-muted-foreground">
                See how much you keep after Roblox fees.
              </p>
            </div>

            {/* Item type toggle */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-raised w-fit">
              {(["clothing", "ugc"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setItemType(type); setTierIdx(0); }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all cursor-pointer",
                    itemType === type
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TAX_CONFIGS[type].label}
                </button>
              ))}
            </div>

            {/* Sale type toggle */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-raised w-fit">
              {config.tiers.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setTierIdx(i)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition-all cursor-pointer",
                    tierIdx === i
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Rate breakdown mini bar */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Creator {tier.creator}%</span>
              <span>&middot;</span>
              <span>Roblox {tier.roblox}%</span>
              {tier.game > 0 && (
                <>
                  <span>&middot;</span>
                  <span>Game {tier.game}%</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Robux Amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1,000"
                value={priceInput.display}
                onChange={priceInput.onChange}
                className="h-12 text-base"
              />
            </div>

            {priceNum > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 animate-[fadeInUp_0.2s_ease-out]">
                <div className="rounded-xl bg-surface-raised p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                    If priced at R$ {priceNum.toLocaleString()}
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    R$ {earningsFromPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You earn after {100 - tier.creator}% fee
                  </p>
                </div>
                <div className="rounded-xl bg-surface-raised p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                    To earn R$ {priceNum.toLocaleString()}
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    R$ {priceForEarnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Item must cost this
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* DevEx Calculator */}
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">DevEx Calculator</h3>
                <p className="text-sm text-muted-foreground">
                  Convert Robux at the old &amp; new DevEx rates.
                </p>
              </div>
              <div className="relative shrink-0" ref={currencyWrapRef}>
                {/* Collapsed: just the current currency pill */}
                <button
                  onClick={() => setCurrencyOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised text-xs font-medium cursor-pointer transition-all hover:bg-muted-foreground/15",
                    currencyOpen && "bg-muted-foreground/15",
                  )}
                >
                  <span className="text-foreground">{cur.symbol} {currency}</span>
                  <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", currencyOpen && "rotate-180")} />
                </button>

                {/* Expanded: horizontal scrollable list */}
                {currencyOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-20 rounded-xl border border-border bg-card shadow-xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div
                      ref={currencyScrollRef}
                      className="flex items-center gap-1 p-1.5 overflow-x-auto max-w-[min(420px,calc(100vw-2rem))] scrollbar-none"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          data-active={c.code === currency ? "" : undefined}
                          onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer shrink-0",
                            c.code === currency
                              ? "bg-foreground text-background font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
                          )}
                        >
                          {c.symbol} {c.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Total Robux</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1,000,000"
                  value={devexRobux.display}
                  onChange={devexRobux.onChange}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Remaining till New Rate</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="500,000"
                  value={devexRemaining.display}
                  onChange={devexRemaining.onChange}
                  className="h-12 text-base"
                />
                <p className="text-[11px] text-muted-foreground">Robux still paid at old rate before new rate kicks in</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Tax % <span className="text-muted-foreground/50">(income tax)</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={devexTax}
                  onChange={(e) => setDevexTax(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            {robuxNum > 0 && (
              <div className="flex flex-col gap-4 animate-[fadeInUp_0.2s_ease-out]">
                {/* If all at one rate */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-raised p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      All at Old Rate
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {fmtMoney(allOldUsd)}
                    </p>
                    {taxPct > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        After {taxPct}% tax:{" "}
                        <span className="text-foreground font-semibold">{fmtMoney(allOldAfterTax)}</span>
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-surface-raised p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      All at New Rate
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      {fmtMoney(allNewUsd)}
                    </p>
                    {taxPct > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        After {taxPct}% tax:{" "}
                        <span className="text-foreground font-semibold">{fmtMoney(allNewAfterTax)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Split payout */}
                {remainingNum > 0 && (
                  <div className="rounded-xl border border-border bg-surface-raised p-4 flex flex-col gap-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Split Payout
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-background p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          R$ {atOldRate.toLocaleString()} at old rate
                        </p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{fmtMoney(splitOldUsd)}</p>
                      </div>
                      <div className="rounded-lg bg-background p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          R$ {atNewRate.toLocaleString()} at new rate
                        </p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{fmtMoney(splitNewUsd)}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold text-foreground tabular-nums">{fmtMoney(splitTotal)}</span>
                      </div>
                      {taxPct > 0 && (
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-xs text-muted-foreground">After {taxPct}% tax</span>
                          <span className="text-base font-semibold text-foreground tabular-nums">{fmtMoney(splitTotalAfterTax)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Info Panel ── */}
        <div className="lg:w-80 shrink-0">
          <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">Tax Rates</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              When an item is bought through a game, the game gets an affiliate commission.
            </p>

            {/* Clothing & Gamepass */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Clothing & Gamepass</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="text-foreground font-medium">70% or 60%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Roblox</span>
                  <span className="text-foreground font-medium">30%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Game</span>
                  <span className="text-foreground font-medium">0% or 10%</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* UGC */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">UGC</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="text-foreground font-medium">30%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Roblox</span>
                  <span className="text-foreground font-medium">70% or 30%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Game</span>
                  <span className="text-foreground font-medium">0% or 40%</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                UGC creators only receive 30% on direct sales. In-game purchases give 40% to the game as affiliate commission.
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* DevEx */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">DevEx</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Old Rate</span>
                  <span className="text-foreground font-medium">$0.0035 / R$</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">New Rate</span>
                  <span className="text-foreground font-medium">$0.0038 / R$</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Per 30,000 R$ (old)</span>
                  <span className="text-foreground font-medium">$105.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Per 30,000 R$ (new)</span>
                  <span className="text-foreground font-medium">$114.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
