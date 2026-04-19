import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, Repeat, Globe, Clock3, ShieldCheck } from "lucide-react";
import type { AppState } from "../types";

interface Props {
  appState: AppState;
}

export default function Subscriptions({ appState }: Props) {
  const { universeId } = appState;
  const dashboardUrl = `https://create.roblox.com/dashboard/creations/experiences/${universeId}/monetization/subscriptions`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-surface-raised flex items-center justify-center">
          <Repeat className="h-4.5 w-4.5 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Subscriptions</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Roblox supports subscriptions, but their public monetization APIs are still much thinner here than
        the game pass and developer product endpoints this tool can fully automate.
      </p>

      <Alert variant="info" className="mb-4">
        Use the Creator Dashboard for active subscription management right now. This tab gives you the fast jump
        point plus the platform rules that matter when you work with subscriptions.
      </Alert>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="outline" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Roblox Subscriptions
          </a>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Regional Pricing</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Robux-priced subscriptions have regional pricing automatically. Local-currency subscriptions do not.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Price Changes</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Robux subscription prices can only change periodically, and increases require advance notice.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">State Changes</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Active and inactive states matter. Taking a subscription off sale can either keep renewals or cancel them.
          </p>
        </Card>
      </div>
    </div>
  );
}
