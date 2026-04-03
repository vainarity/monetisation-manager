import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldCheck, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiKeyGuide() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            Creating an API Key
          </h1>
          <p className="text-sm text-muted-foreground">
            Follow these steps to create an Open Cloud API key for your experience.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
          <ol className="list-none flex flex-col gap-4 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full bg-surface-raised text-foreground text-xs font-bold">1</span>
              <span>
                Go to the{" "}
                <a
                  href="https://create.roblox.com/dashboard/credentials"
                  target="_blank"
                  rel="noopener"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  Roblox Creator Dashboard
                </a>{" "}
                and navigate to <strong>Credentials</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full bg-surface-raised text-foreground text-xs font-bold">2</span>
              <span>Click <strong>Create API Key</strong> and give it a name you'll recognise.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full bg-surface-raised text-foreground text-xs font-bold">3</span>
              <span>
                Under <strong>Access Permissions</strong>, add:
                <span className="mt-2 flex flex-col gap-1 text-muted-foreground text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <strong className="text-foreground">Game Passes</strong> — read &amp; write
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <strong className="text-foreground">Developer Products</strong> — read &amp; write
                  </span>
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full bg-surface-raised text-foreground text-xs font-bold">4</span>
              <span>
                Under <strong>Security</strong>, add <strong>0.0.0.0/0</strong> to allow all IPs. For better security, you can restrict it to your own IP address instead — just search "what is my IP" and paste that value in.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 shrink-0 rounded-full bg-surface-raised text-foreground text-xs font-bold">5</span>
              <span>Click <strong>Save &amp; Generate Key</strong>, then copy it.</span>
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 flex items-start gap-3 mt-4 animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your API key is <strong className="text-foreground">never stored on any server</strong>. All data stays in your browser. This project is open source.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-5 animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
          <Button size="lg" className="w-full" asChild>
            <a
              href="https://create.roblox.com/dashboard/credentials"
              target="_blank"
              rel="noopener"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Creator Dashboard
            </a>
          </Button>
          <Button variant="outline" size="lg" className="w-full" disabled>
            <Github className="h-4 w-4 mr-2" />
            View on GitHub
          </Button>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <a
              href="https://github.com/RockwoodHoldings/monetisation-manager"
              target="_blank"
              rel="noopener"
            >
              <Github className="h-4 w-4 mr-2" />
              Original Creator
            </a>
          </Button>
          <Button variant="ghost" size="lg" className="w-full" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
