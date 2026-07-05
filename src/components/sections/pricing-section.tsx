"use client";
import { Check } from "lucide-react";
import Link from "next/link";
const tiers = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for small teams getting started with gamification.",
    features: [
      "Up to 5 Users",
      "Basic Task Assignment",
      "Standard Leaderboard",
      "Community Support",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline",
    highlight: false,
  },
  {
    name: "Pro",
    price: "149",
    description: "The complete TaskFlow experience for growing organizations.",
    features: [
      "Up to 50 Users",
      "Advanced Workload Routing",
      "Custom Badges & XP",
      "Analytics Dashboard",
      "Priority Support",
    ],
    buttonText: "Start 14-Day Trial",
    buttonVariant: "primary",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "299",
    description: "Maximum control and dedicated support for large scale teams.",
    features: [
      "Unlimited Users",
      "SAML SSO & Advanced Security",
      "Custom Integrations",
      "Dedicated Success Manager",
      "99.9% Uptime SLA",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    highlight: false,
  },
];
export function PricingSection() {
  return (
    <section id="pricing" className="bg-background py-24 md:py-32">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-5xl lg:text-[3.5rem] lg:leading-none mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Choose the plan that best fits your team's size and ambitions. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl transition-all duration-300 p-8 max-w-md mx-auto w-full md:max-w-none ${
                tier.highlight
                  ? "bg-card/80 backdrop-blur-md border border-primary shadow-2xl shadow-primary/10 md:-translate-y-4 md:scale-105"
                  : "bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-medium text-foreground mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm min-h-[40px]">{tier.description}</p>
              </div>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-medium tracking-tight text-foreground">₹{tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${tier.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`w-full py-4 rounded-xl text-center font-medium transition-all duration-300 ${
                  tier.buttonVariant === "primary"
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                    : "bg-transparent border border-border hover:bg-secondary text-foreground"
                }`}
              >
                {tier.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
