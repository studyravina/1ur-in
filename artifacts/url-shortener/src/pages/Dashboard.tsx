import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useUser, RedirectToSignIn } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Link2, Copy, Trash2, ExternalLink, AlertCircle, Plus, Loader2,
  BarChart3, Lock, Crown, Key, QrCode, Eye, EyeOff, RefreshCw, X, Terminal
} from "lucide-react";
import { useListUrls, useCreateUrl, useDeleteUrl, useGetMe, getListUrlsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import QRCodeLib from "qrcode";

// ─── Helpers ─────────────────────────────────────────────────────────
function getShortUrl(slug: string): string {
  return `${window.location.origin}/${slug}`;
}

// ─── Types ───────────────────────────────────────────────────────────
type ApiKey = { id: string; name: string; key: string; revoked: boolean; createdAt: string; lastUsed: string | null };
type Tab = "links" | "apikeys";

// ─── QR Modal ────────────────────────────────────────────────────────
function QrModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCodeLib.toDataURL(url, { width: 280, margin: 2, color: { dark: "#ffffff", light: "#0f0f13" } })
      .then(setSrc);
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-white/10 rounded-3xl p-8 max-w-xs w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">QR Code</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {src ? <img src={src} alt="QR Code" className="mx-auto rounded-xl" /> : <div className="w-[280px] h-[280px] mx-auto rounded-xl bg-white/5 animate-pulse" />}
        <p className="text-xs text-muted-foreground mt-4 break-all">{url}</p>
        <a href={src} download={`qr-${url.split("/").pop()}.png`}>
          <Button variant="outline" size="sm" className="mt-4 rounded-full w-full">Download PNG</Button>
        </a>
      </motion.div>
    </div>
  );
}

// ─── API Key Row ──────────────────────────────────────────────────────
function ApiKeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(apiKey.key);
    toast({ title: "API key copied!" });
  };

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold">{apiKey.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {format(new Date(apiKey.createdAt), "MMM d, yyyy")}
            {apiKey.lastUsed && ` · Last used ${format(new Date(apiKey.lastUsed), "MMM d, yyyy")}`}
          </p>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={() => onRevoke(apiKey.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg h-8 text-xs"
        >
          Revoke
        </Button>
      </div>
      <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl px-4 py-2.5">
        <code className="flex-1 text-xs font-mono text-primary truncate">
          {visible ? apiKey.key : apiKey.key.slice(0, 8) + "•".repeat(32)}
        </code>
        <button onClick={() => setVisible(!visible)} className="text-muted-foreground hover:text-foreground transition-colors">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("links");
  const [originalUrl, setOriginalUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useGetMe();
  const { data: rawUrls, isLoading: isUrlsLoading } = useListUrls();
  const urls = Array.isArray(rawUrls) ? rawUrls : [];

  const createMutation = useCreateUrl();
  const deleteMutation = useDeleteUrl();

  const isPaidUser = profile?.plan && profile.plan !== "free";
  const isBusinessUser = profile?.plan === "business";

  // Fetch API keys when on API keys tab
  useEffect(() => {
    if (tab === "apikeys" && isBusinessUser) {
      fetchApiKeys();
    }
  }, [tab, isBusinessUser]);

  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await fetch("/api/keys", { credentials: "include" });
      if (res.ok) setApiKeys(await res.json());
    } catch { /* silent */ } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingKey(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName || "My API Key" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const key = await res.json();
      setApiKeys((prev) => [key, ...prev]);
      setNewKeyName("");
      toast({ title: "API key created!", description: "Copy it now — it won't be shown again in masked form until you toggle." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to revoke");
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "API key revoked" });
    } catch {
      toast({ title: "Error revoking key", variant: "destructive" });
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) return;
    try {
      await createMutation.mutateAsync({ data: { originalUrl, customSlug: customSlug || undefined } });
      setOriginalUrl("");
      setCustomSlug("");
      toast({ title: "Short URL created!" });
      queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      toast({ title: "Failed to create URL", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this URL?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "URL deleted" });
      queryClient.invalidateQueries({ queryKey: getListUrlsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch {
      toast({ title: "Failed to delete URL", variant: "destructive" });
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = getShortUrl(slug);
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: url });
  };

  const isLimitReached = profile && profile.urlsUsed >= profile.urlLimit;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {qrUrl && <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your links and API access</p>
        </div>
        {/* Tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab("links")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "links" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Link2 className="w-4 h-4" /> Links
          </button>
          <button
            onClick={() => setTab("apikeys")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "apikeys" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Key className="w-4 h-4" /> API Keys
            {!isBusinessUser && <Crown className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── LINKS TAB ── */}
        {tab === "links" && (
          <motion.div key="links" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col md:flex-row gap-8">
            {/* Left: Form + Stats */}
            <div className="w-full md:w-1/3 space-y-5">
              <div className="bg-card border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                  <Plus className="w-5 h-5 text-primary" /> Create Short URL
                </h2>
                <form onSubmit={handleCreate} className="space-y-4 relative z-10">
                  <div className="space-y-2">
                    <Label htmlFor="url">Original URL</Label>
                    <Input id="url" type="url" placeholder="https://example.com/long/url..."
                      value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)}
                      disabled={!!isLimitReached || createMutation.isPending}
                      className="bg-background/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Custom Slug {!isPaidUser && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      </span>
                      <span className={`text-xs font-medium ${!isPaidUser ? "text-amber-400" : "text-muted-foreground"}`}>
                        {!isPaidUser ? "Paid only" : "Optional"}
                      </span>
                    </Label>
                    {!isPaidUser ? (
                      <Link href="/pricing">
                        <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2.5 text-sm text-amber-400/80 cursor-pointer hover:border-amber-500/40 transition-colors">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>Upgrade to use custom slugs</span>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex bg-background/50 rounded-md border border-input focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                        <span className="pl-3 py-2 text-sm text-muted-foreground bg-white/5 border-r border-input flex items-center">{window.location.host}/</span>
                        <input className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                          placeholder="my-link" value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value)}
                          disabled={!!isLimitReached || createMutation.isPending} />
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full rounded-xl"
                    disabled={!!isLimitReached || createMutation.isPending || !originalUrl}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Shorten URL
                  </Button>
                </form>
              </div>

              {!isProfileLoading && profile && (
                <div className="bg-card border border-border p-6 rounded-3xl">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Plan Usage</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{profile.urlsUsed} URLs used</span>
                      <span className="text-muted-foreground">/ {profile.urlLimit}</span>
                    </div>
                    <Progress value={(profile.urlsUsed / profile.urlLimit) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plan: <span className="font-bold text-primary capitalize">{profile.plan}</span></span>
                    {profile.plan === "free" && (
                      <Link href="/pricing"><Button variant="outline" size="sm" className="rounded-full h-7 text-xs">Upgrade</Button></Link>
                    )}
                  </div>
                  {isLimitReached && (
                    <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-xl flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Limit reached. <Link href="/pricing" className="underline font-semibold">Upgrade</Link> to create more.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: URL List */}
            <div className="w-full md:w-2/3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Your Links</h2>
                <span className="text-sm text-muted-foreground">{urls.length} total</span>
              </div>
              {isUrlsLoading ? (
                <div className="py-20 flex flex-col items-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" /><p>Loading...</p>
                </div>
              ) : urls.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <Link2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No links yet</h3>
                  <p className="text-muted-foreground text-sm">Create your first short link using the form.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {urls.map((url, i) => (
                      <motion.div key={url.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: i * 0.04 }}
                        className="group bg-card hover:bg-white/[0.04] border border-white/5 p-5 rounded-2xl transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <a href={getShortUrl(url.slug)} target="_blank" rel="noopener noreferrer"
                                className="text-base font-bold text-primary hover:underline flex items-center gap-1">
                                {window.location.host}/{url.slug}<ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{url.originalUrl}</p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                <BarChart3 className="w-3 h-3" />{url.clicks} clicks
                              </span>
                              <span>{format(new Date(url.createdAt), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" title="QR Code"
                              onClick={() => setQrUrl(getShortUrl(url.slug))}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Copy"
                              onClick={() => copyToClipboard(url.slug)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete"
                              onClick={() => handleDelete(url.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── API KEYS TAB ── */}
        {tab === "apikeys" && (
          <motion.div key="apikeys" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!isBusinessUser ? (
              <div className="max-w-lg mx-auto py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                  <Key className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3">API Access</h2>
                <p className="text-muted-foreground mb-6">
                  API keys let you integrate 1ur.in directly into your apps and scripts. Available on the <strong>Business plan</strong>.
                </p>
                <div className="bg-card border border-white/5 rounded-2xl p-5 text-left mb-6 space-y-2 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium mb-3">What you get with API access:</p>
                  <p>✓ Create short URLs programmatically</p>
                  <p>✓ List and delete your URLs via REST</p>
                  <p>✓ Up to 5 API keys</p>
                  <p>✓ Works with curl, Node.js, Python, any language</p>
                </div>
                <Link href="/pricing">
                  <Button size="lg" className="rounded-full px-10 font-semibold">Upgrade to Business</Button>
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                  Or <Link href="/docs" className="text-primary hover:underline">read the API docs</Link> first.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">API Keys</h2>
                    <p className="text-sm text-muted-foreground mt-1">{apiKeys.length}/5 keys · <Link href="/docs" className="text-primary hover:underline">View API docs</Link></p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchApiKeys} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </Button>
                </div>

                {/* Create key form */}
                <form onSubmit={handleCreateKey} className="flex gap-3 mb-6">
                  <Input
                    placeholder="Key name (e.g. Production)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <Button type="submit" disabled={creatingKey || apiKeys.length >= 5} className="shrink-0 gap-2">
                    {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Key
                  </Button>
                </form>

                {apiKeysLoading ? (
                  <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                ) : apiKeys.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl">
                    <Key className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-semibold mb-1">No API keys yet</p>
                    <p className="text-sm text-muted-foreground">Create your first key to start using the API.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((k) => (
                      <ApiKeyRow key={k.id} apiKey={k} onRevoke={handleRevokeKey} />
                    ))}
                  </div>
                )}

                {/* Quick snippet */}
                <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Quick example</span>
                  </div>
                  <pre className="text-xs text-green-400 overflow-x-auto leading-relaxed">
{`curl -X POST https://1ur.in/api/v1/urls \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/long-url"}'`}
                  </pre>
                  <Link href="/docs">
                    <Button variant="outline" size="sm" className="mt-4 rounded-lg text-xs">View Full API Docs →</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
