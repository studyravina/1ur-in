import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, Check, ArrowRight, Zap, BarChart3, Shield, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SignUpButton, useUser } from "@clerk/react";
import { Link } from "wouter";

const DEMO_URLS = [
  { original: "https://www.example.com/blog/how-to-use-url-shorteners-effectively-in-2024", slug: "blog24", clicks: 1284 },
  { original: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit", slug: "q4-sheet", clicks: 437 },
  { original: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=0s", slug: "yt-vid", clicks: 9921 },
];

export default function Demo() {
  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useUser();
  const { toast } = useToast();

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const slug = Math.random().toString(36).slice(2, 8);
    setShortened(`1ur.in/${slug}`);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!shortened) return;
    navigator.clipboard.writeText("https://" + shortened);
    setCopied(true);
    toast({ title: "Copied!", description: shortened });
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { icon: <Link2 className="w-6 h-6" />, title: "Paste your URL", desc: "Take any long URL — blog post, doc, video, or product page." },
    { icon: <Zap className="w-6 h-6" />, title: "Get a short link", desc: "We generate a unique short link instantly. Or choose your own custom slug." },
    { icon: <Globe className="w-6 h-6" />, title: "Share anywhere", desc: "Use your 1ur.in link on social media, emails, or messages." },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Track clicks", desc: "See exactly how many people clicked your link in real time." },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" /> Try it live — no sign up needed
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            See how it <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">works</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Shorten any URL in seconds. This is a live preview — create an account to save your links.
          </p>

          {/* Interactive demo */}
          <form onSubmit={handleDemo} className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-violet-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
              <div className="relative flex flex-col sm:flex-row gap-2 bg-card border border-white/10 p-2 rounded-2xl shadow-2xl">
                <div className="relative flex-1 flex items-center">
                  <Link2 className="absolute left-4 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Paste a long URL here..."
                    className="w-full pl-12 py-5 bg-transparent border-none text-base focus-visible:ring-0"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="lg" disabled={loading} className="py-5 px-7 rounded-xl font-semibold shrink-0">
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Shortening...</span>
                  ) : (
                    <span className="flex items-center gap-2">Shorten <ArrowRight className="w-4 h-4" /></span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {shortened && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="mt-6 max-w-2xl mx-auto"
              >
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground mb-1">Your short link is ready!</p>
                    <p className="text-xl font-bold text-primary">{shortened}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl shrink-0 gap-2 border-primary/30">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  This is a demo link. <Link href="/pricing" className="text-primary hover:underline">Create a free account</Link> to save and track your links.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to share smarter.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-primary/20 hover:bg-primary/5 transition-all"
              >
                <div className="absolute top-4 right-4 text-4xl font-black text-white/5">0{i + 1}</div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample links */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">Example links</h2>
          <p className="text-muted-foreground text-center mb-10">See what your dashboard looks like with real links.</p>
          <div className="space-y-3">
            {DEMO_URLS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4 group hover:border-white/10 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-primary">1ur.in/{item.slug}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.original}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full">
                  <BarChart3 className="w-3.5 h-3.5" />
                  {item.clicks.toLocaleString()} clicks
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">Create your free account and start shortening URLs today.</p>
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-10 font-semibold">
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <Button size="lg" className="rounded-full px-10 font-semibold">
                Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </SignUpButton>
          )}
        </div>
      </section>
    </div>
  );
}
