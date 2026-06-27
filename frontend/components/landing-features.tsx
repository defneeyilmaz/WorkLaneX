import { Calendar, FileText, Kanban, LayoutDashboard, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Kanban,
    title: "Kanban boards",
    description: "Drag tasks across columns, assign work, and track approvals.",
  },
  {
    icon: LayoutDashboard,
    title: "Workspace dashboard",
    description: "See open work, project counts, and recent team activity.",
  },
  {
    icon: FileText,
    title: "Project docs",
    description: "Write markdown specs and notes with live preview.",
  },
  {
    icon: Calendar,
    title: "Meeting notes",
    description: "Capture standups and planning sessions with structured templates.",
  },
  {
    icon: Sparkles,
    title: "AI subtasks",
    description: "Break large tasks into suggested next steps from the task drawer.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section className="landing-features" aria-label="Product features">
      <h2 className="landing-features-heading">Everything a small team needs</h2>
      <ul className="landing-features-grid">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="landing-feature-card">
            <feature.icon className="landing-feature-icon" aria-hidden="true" />
            <p className="landing-feature-title">{feature.title}</p>
            <p className="landing-feature-description">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
