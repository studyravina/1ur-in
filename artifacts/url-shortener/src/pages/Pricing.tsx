import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useCreatePaymentOrder, useVerifyPayment, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { loadRazorpayScript } from "@/lib/razorpay";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 50,
    urls: 50,
    features: ["Basic Analytics", "Standard Support", "Custom Slugs"],
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 100,
    urls: 100,
    features: ["Advanced Analytics", "Priority Support", "Custom Slugs", "Link Expiration"],
    popular: true
  },
  {
    id: "business",
    name: "Business",
    price: 150,
    urls: 200,
    features: ["Everything in Pro", "24/7 Phone Support", "API Access", "Team Members"],
    popular: false
  }
];

export default function Pricing() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();

  const handleBuy = async (planId: string) => {
    if (!isSignedIn) {
      toast({ title: "Please sign in", description: "You must be signed in to purchase a plan.", variant: "default" });
      return;
    }

    if (planId === "custom") {
      window.location.href = "mailto:sales@1ur.in";
      return;
    }

    try {
      setProcessingPlan(planId);

      const res = await loadRazorpayScript();
      if (!res) {
        toast({ title: "Error", description: "Payment gateway failed to load. Are you offline?", variant: "destructive" });
        setProcessingPlan(null);
        return;
      }

      const order = await createOrderMutation.mutateAsync({ data: { planId } });

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "1ur.in",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — 1 Year`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await verifyPaymentMutation.mutateAsync({
              data: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId
              }
            });

            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            toast({ title: "Upgrade Successful!", description: "Your account has been upgraded." });
            setLocation("/dashboard");
          } catch (e: any) {
            toast({ title: "Verification Failed", description: e.message || "Please contact support.", variant: "destructive" });
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: { name: "1ur.in User" },
        theme: { color: "#8b5cf6" },
        modal: { ondismiss: function () { setProcessingPlan(null); } }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      setProcessingPlan(null);
      toast({
        title: "Could not initiate payment",
        description: err.response?.data?.error || "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">One-time yearly payment. No subscriptions, no surprises.</p>
      </div>

      {/* Billing badge */}
      <div className="flex justify-center mb-12">
        <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4" /> Yearly billing — best value
        </span>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${
              plan.popular
                ? "bg-card border-primary/50 shadow-[0_0_40px_-15px_rgba(168,85,247,0.4)] scale-105 z-10"
                : "bg-white/[0.02] border-white/5 hover:border-white/20"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                ₹{plan.price}
                <span className="ml-1 text-xl font-medium text-muted-foreground">/yr</span>
              </div>
              <p className="mt-2 text-sm text-primary font-medium">{plan.urls} URLs included</p>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mr-3" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleBuy(plan.id)}
              disabled={processingPlan !== null}
              variant={plan.popular ? "default" : "outline"}
              className="w-full rounded-xl h-12 text-base font-semibold"
            >
              {processingPlan === plan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buy Plan"}
            </Button>
          </div>
        ))}

        {/* Enterprise */}
        <div className="relative flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">Enterprise</h3>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold">Custom</div>
            <p className="mt-2 text-sm text-muted-foreground">Unlimited URLs &amp; Custom Setup</p>
          </div>
          <ul className="flex-1 space-y-4 mb-8">
            {["Dedicated Account Manager", "Custom Domains", "SLA Agreement", "Unlimited URLs", "White-label Option"].map((f, i) => (
              <li key={i} className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mr-3" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleBuy("custom")}
            variant="outline"
            className="w-full rounded-xl h-12 text-base font-semibold"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
