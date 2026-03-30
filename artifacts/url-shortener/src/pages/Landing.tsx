import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useUser, SignInButton } from "@clerk/react";
import { Link2, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Landing() {
  const [url, setUrl] = useState("");
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignedIn) {
      // In a real app we might pass this via state or query params to prefill
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden flex flex-col items-center pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-[-1] flex items-center justify-center">
          <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] mix-blend-screen translate-x-1/2 -translate-y-1/4" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4" />
            <span>The fastest way to share links</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6 leading-tight">
            Shorten URLs.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Expand your reach.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create memorable, trackable short links in seconds. Join thousands of professionals managing their digital presence with 1ur.in.
          </p>

          <form onSubmit={handleShorten} className="w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex flex-col sm:flex-row gap-2 bg-card p-2 rounded-2xl border border-white/10 shadow-2xl">
              <div className="relative flex-1 flex items-center">
                <Link2 className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Paste your long URL here..."
                  className="w-full pl-12 py-6 bg-transparent border-none text-lg focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              
              {isSignedIn ? (
                <Button type="submit" size="lg" className="py-6 px-8 rounded-xl font-semibold text-lg shrink-0">
                  Shorten Now
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button type="button" size="lg" className="py-6 px-8 rounded-xl font-semibold text-lg shrink-0 group/btn">
                    Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </form>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="Lightning Fast"
            description="Our edge network ensures your links redirect in milliseconds, anywhere in the world."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-6 h-6 text-accent" />}
            title="Advanced Analytics"
            description="Track every click, location, and device. Understand your audience better."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-blue-400" />}
            title="Secure & Reliable"
            description="Enterprise-grade security and 99.99% uptime guarantee for all your links."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors duration-300">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
