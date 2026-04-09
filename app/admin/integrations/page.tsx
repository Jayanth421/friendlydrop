import { requireAdminPermission } from "@/lib/auth/session";
import { getIntegrationLogs, getStoreSettings, getWebhookLogs } from "@/lib/firebase/firestore";
import { withIntegrationHealth } from "@/lib/settings-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminIntegrationsPage() {
  await requireAdminPermission("settings:manage");
  const [settings, integrationLogs, webhookLogs] = await Promise.all([getStoreSettings(), getIntegrationLogs(25), getWebhookLogs(25)]);
  const enriched = withIntegrationHealth(settings);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Integration Provider Health</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.integrations.providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell>{provider.type}</TableCell>
                  <TableCell>{provider.mode}</TableCell>
                  <TableCell>{provider.healthStatus}</TableCell>
                  <TableCell>{provider.lastCheckedAt ? new Date(provider.lastCheckedAt).toLocaleString("en-IN") : "-"}</TableCell>
                  <TableCell>{provider.lastError ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>API Logs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrationLogs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.provider}</TableCell>
                    <TableCell>{entry.type}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.latencyMs}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Webhook Logs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookLogs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.event}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.attempts}</TableCell>
                    <TableCell>{entry.responseCode ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
