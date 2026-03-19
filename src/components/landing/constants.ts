import { BarChart3, Cloud, MessageSquare, Star, Trophy, Hash } from "lucide-react";

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
    description: "Multiple-choice questions with animated results your audience watches update in real time. See consensus form instantly.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: Cloud,
    title: "Word Clouds",
    description: "Collect words and phrases that form beautiful, dynamic clouds as responses pour in. Perfect for brainstorming.",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
  },
  {
    icon: MessageSquare,
    title: "Open Q&A",
    description: "Free-form responses displayed in a live scrolling feed everyone in the room can see. No moderation needed.",
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Star,
    title: "Rating Scales",
    description: "Collect numeric ratings with beautiful star or slider visualizations. Great for feedback and satisfaction scores.",
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
  },
  {
    icon: Trophy,
    title: "Ranking",
    description: "Let your audience drag-and-drop to rank options. Results aggregate into a live leaderboard everyone can see.",
    color: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-400",
  },
  {
    icon: Hash,
    title: "Quiz Mode",
    description: "Timed questions with correct answers revealed after voting. Scores tracked per participant for a competitive edge.",
    color: "from-indigo-500/20 to-violet-500/10",
    iconColor: "text-indigo-400",
  },
];

export const steps = [
  { n: "01", title: "Build your slides", desc: "Add polls, word clouds, Q&A, ratings, rankings, or quizzes in seconds." },
  { n: "02", title: "Share a code", desc: "One 6-digit code or QR scan — no app download needed for your audience." },
  { n: "03", title: "Watch it live", desc: "Responses flow in real time on your presenter screen. Analytics saved automatically." },
];


