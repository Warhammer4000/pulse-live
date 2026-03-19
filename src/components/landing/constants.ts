import { BarChart3, Cloud, MessageSquare } from "lucide-react";

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export const features = [
  {
    icon: BarChart3,
    title: "Live Polls",
    description: "Multiple-choice questions with animated results your audience watches update in real time.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: Cloud,
    title: "Word Clouds",
    description: "Collect words and phrases that form beautiful, dynamic clouds as responses pour in.",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
  },
  {
    icon: MessageSquare,
    title: "Open Q&A",
    description: "Free-form responses displayed in a live scrolling feed everyone in the room can see.",
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
];

export const steps = [
  { n: "01", title: "Build your slides", desc: "Add polls, word clouds, or open text questions in seconds." },
  { n: "02", title: "Share a code", desc: "One 6-digit code or QR scan — no app download needed." },
  { n: "03", title: "Watch it live", desc: "Responses flow in real time on your presenter screen." },
];

export const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect for trying it out",
    features: ["3 presentations", "Unlimited participants", "All interaction types", "Basic analytics"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For regular presenters",
    features: ["Unlimited presentations", "Unlimited participants", "All interaction types", "Advanced analytics", "Custom branding", "Export responses"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$39",
    period: "/mo",
    desc: "For organizations",
    features: ["Everything in Pro", "5 team members", "Shared workspace", "Priority support", "SSO / SAML", "API access"],
    cta: "Contact sales",
    highlight: false,
  },
];
