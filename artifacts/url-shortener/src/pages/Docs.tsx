import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Terminal, Key, Link2, Trash2, User, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <span className="text-xs font-mono text-muted-foreground">{lang}</span>
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-4 text-sm text-green-400 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="border-t border-white/5 pt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Endpoint({ method, path, desc, children }: { method: string; path: string; desc: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const colors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    POST: "bg-green-500/10 text-green-400 border-green-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden mb-4">
      <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors" onClick={() => setOpen(!open)}>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono shrink-0 ${colors[method]}`}>{method}</span>
        <code className="text-sm font-mono text-foreground flex-1">{path}</code>
        <span className="text-sm text-muted-foreground hidden sm:block">{desc}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && children && <div className="px-5 pb-5 border-t border-white/5 bg-white/[0.01]">{children}</div>}
    </div>
  );
}

export default function Docs() {
  const navItems = [
    { id: "auth", label: "Authentication" },
    { id: "urls", label: "URLs" },
    { id: "me", label: "Account" },
    { id: "errors", label: "Errors" },
    { id: "examples", label: "Examples" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors hover:translate-x-0.5 duration-150">
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-white/5 mt-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full rounded-lg text-xs gap-2">
                  <Key className="w-3.5 h-3.5" /> Get API Key
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
                <Terminal className="w-4 h-4" /> REST API v1
              </div>
              <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
              <p className="text-lg text-muted-foreground">
                Integrate 1ur.in URL shortening into your apps, scripts, and workflows.
                Available on the <Link href="/pricing" className="text-primary hover:underline">Business plan</Link>.
              </p>
            </div>

            {/* Base URL */}
            <div className="bg-card border border-white/5 rounded-2xl p-5 mb-10">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Base URL</p>
              <code className="text-primary font-mono text-lg">https://1ur.in/api/v1</code>
            </div>

            {/* Authentication */}
            <Section id="auth" icon={<Key className="w-4 h-4" />} title="Authentication">
              <p className="text-muted-foreground mb-4">
                All API requests require authentication using an API key. Generate your key from the{" "}
                <Link href="/dashboard" className="text-primary hover:underline">Dashboard → API Keys</Link> tab.
                Pass your key in one of two ways:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Option 1 — Authorization header</p>
                  <code className="text-sm text-primary font-mono">Authorization: Bearer 1ur_your_key</code>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Option 2 — X-Api-Key header</p>
                  <code className="text-sm text-primary font-mono">X-Api-Key: 1ur_your_key</code>
                </div>
              </div>
              <CodeBlock lang="bash" code={`curl https://1ur.in/api/v1/me \\
  -H "Authorization: Bearer 1ur_your_api_key_here"`} />
            </Section>

            {/* URLs */}
            <Section id="urls" icon={<Link2 className="w-4 h-4" />} title="URLs">
              <Endpoint method="GET" path="/api/v1/urls" desc="List all your short URLs">
                <p className="text-sm text-muted-foreground mt-4 mb-3">Returns all short URLs created by your account.</p>
                <CodeBlock lang="bash" code={`curl https://1ur.in/api/v1/urls \\
  -H "Authorization: Bearer 1ur_your_key"`} />
                <CodeBlock lang="json" code={`{
  "data": [
    {
      "id": "abc123",
      "slug": "my-link",
      "shortUrl": "https://1ur.in/my-link",
      "originalUrl": "https://example.com/very/long/url",
      "clicks": 42,
      "expiresAt": null,
      "createdAt": "2026-03-23T10:00:00.000Z"
    }
  ],
  "count": 1
}`} />
              </Endpoint>

              <Endpoint method="POST" path="/api/v1/urls" desc="Create a short URL">
                <div className="mt-4 mb-3 space-y-2 text-sm">
                  <p className="text-muted-foreground">Request body (JSON):</p>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/5 text-xs text-muted-foreground uppercase">
                        <th className="text-left p-3">Field</th><th className="text-left p-3">Type</th><th className="text-left p-3">Required</th><th className="text-left p-3">Description</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/5">
                        <tr><td className="p-3 font-mono text-primary">url</td><td className="p-3 text-muted-foreground">string</td><td className="p-3 text-green-400">Yes</td><td className="p-3 text-muted-foreground">The URL to shorten</td></tr>
                        <tr><td className="p-3 font-mono text-primary">slug</td><td className="p-3 text-muted-foreground">string</td><td className="p-3 text-muted-foreground">No</td><td className="p-3 text-muted-foreground">Custom slug (paid)</td></tr>
                        <tr><td className="p-3 font-mono text-primary">expiresAt</td><td className="p-3 text-muted-foreground">ISO date</td><td className="p-3 text-muted-foreground">No</td><td className="p-3 text-muted-foreground">Expiry datetime</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <CodeBlock lang="bash" code={`curl -X POST https://1ur.in/api/v1/urls \\
  -H "Authorization: Bearer 1ur_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/my/very/long/link",
    "slug": "my-link",
    "expiresAt": "2026-12-31T00:00:00Z"
  }'`} />
                <CodeBlock lang="json" code={`{
  "id": "abc123",
  "slug": "my-link",
  "shortUrl": "https://1ur.in/my-link",
  "originalUrl": "https://example.com/my/very/long/link",
  "clicks": 0,
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "createdAt": "2026-03-23T10:00:00.000Z"
}`} />
              </Endpoint>

              <Endpoint method="DELETE" path="/api/v1/urls/:slug" desc="Delete a short URL">
                <p className="text-sm text-muted-foreground mt-4 mb-3">Delete a URL by its slug. You can only delete URLs you own.</p>
                <CodeBlock lang="bash" code={`curl -X DELETE https://1ur.in/api/v1/urls/my-link \\
  -H "Authorization: Bearer 1ur_your_key"`} />
                <CodeBlock lang="json" code={`{ "message": "URL deleted successfully." }`} />
              </Endpoint>
            </Section>

            {/* Account */}
            <Section id="me" icon={<User className="w-4 h-4" />} title="Account">
              <Endpoint method="GET" path="/api/v1/me" desc="Get your account info">
                <p className="text-sm text-muted-foreground mt-4 mb-3">Returns your user profile, plan, and URL usage.</p>
                <CodeBlock lang="bash" code={`curl https://1ur.in/api/v1/me \\
  -H "Authorization: Bearer 1ur_your_key"`} />
                <CodeBlock lang="json" code={`{
  "userId": "user_abc123",
  "email": "you@example.com",
  "plan": "business",
  "urlLimit": 200,
  "urlsUsed": 42,
  "urlsRemaining": 158
}`} />
              </Endpoint>
            </Section>

            {/* Errors */}
            <Section id="errors" icon={<Terminal className="w-4 h-4" />} title="Error Codes">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/5 text-xs text-muted-foreground uppercase">
                    <th className="text-left p-4">Status</th><th className="text-left p-4">Meaning</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["200", "Success"],
                      ["201", "Created"],
                      ["400", "Bad request — invalid URL or body"],
                      ["401", "Unauthorized — missing or invalid API key"],
                      ["403", "Forbidden — plan limit reached or feature not available"],
                      ["404", "Not found — slug doesn't exist"],
                      ["409", "Conflict — slug already taken"],
                      ["500", "Server error — contact support"],
                    ].map(([code, meaning]) => (
                      <tr key={code}>
                        <td className="p-4 font-mono text-primary">{code}</td>
                        <td className="p-4 text-muted-foreground">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Examples */}
            <Section id="examples" icon={<Terminal className="w-4 h-4" />} title="Code Examples">
              <p className="text-muted-foreground mb-4">Integrate 1ur.in in your favourite language.</p>

              <h3 className="font-semibold mb-2 mt-6">Node.js / TypeScript</h3>
              <CodeBlock lang="typescript" code={`const API_KEY = "1ur_your_api_key_here";

async function shortenUrl(url: string, slug?: string) {
  const res = await fetch("https://1ur.in/api/v1/urls", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, slug }),
  });
  
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

const result = await shortenUrl("https://example.com/long/link", "my-link");
console.log(result.shortUrl); // https://1ur.in/my-link`} />

              <h3 className="font-semibold mb-2 mt-6">Python</h3>
              <CodeBlock lang="python" code={`import requests

API_KEY = "1ur_your_api_key_here"
BASE_URL = "https://1ur.in/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def shorten_url(url, slug=None):
    payload = {"url": url}
    if slug:
        payload["slug"] = slug
    
    res = requests.post(f"{BASE_URL}/urls", json=payload, headers=headers)
    res.raise_for_status()
    return res.json()

result = shorten_url("https://example.com/long/link", "my-link")
print(result["shortUrl"])  # https://1ur.in/my-link`} />

              <h3 className="font-semibold mb-2 mt-6">cURL (bash script)</h3>
              <CodeBlock lang="bash" code={`#!/bin/bash
API_KEY="1ur_your_api_key_here"

# Shorten a URL
response=$(curl -s -X POST https://1ur.in/api/v1/urls \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\"url\": \"$1\"}")

# Extract shortUrl using jq
echo $response | jq -r '.shortUrl'`} />
            </Section>

            {/* CTA */}
            <div className="mt-16 bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
              <p className="text-muted-foreground mb-6">Upgrade to the Business plan and generate your first API key in seconds.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/pricing">
                  <Button size="lg" className="rounded-full px-8 font-semibold">View Pricing</Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold">Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
