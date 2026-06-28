export type MainView = "dashboard" | "board" | "docs" | "meetings" | "discussion";

export const SELECTED_WORKSPACE_KEY = "worklanex_selected_workspace_id";
export const SELECTED_PROJECT_KEY = "worklanex_selected_project_id";

export type ParsedAppPath = {
  view: MainView;
  projectId: string | null;
};

const PROJECT_VIEW_PATTERN =
  /^\/app\/projects\/([^/]+)\/(board|docs|meetings|discussion)$/;

export function parseAppPath(pathname: string): ParsedAppPath {
  const normalized = pathname.replace(/\/$/, "") || "/app";

  if (normalized === "/app") {
    return { view: "dashboard", projectId: null };
  }

  if (normalized === "/app/board") {
    return { view: "board", projectId: null };
  }

  if (normalized === "/app/docs") {
    return { view: "docs", projectId: null };
  }

  if (normalized === "/app/meetings") {
    return { view: "meetings", projectId: null };
  }

  if (normalized === "/app/discussion") {
    return { view: "discussion", projectId: null };
  }

  const projectMatch = normalized.match(PROJECT_VIEW_PATTERN);
  if (projectMatch) {
    return {
      view: projectMatch[2] as MainView,
      projectId: projectMatch[1],
    };
  }

  return { view: "dashboard", projectId: null };
}

export function appPathFor(view: MainView, projectId?: string | null): string {
  if (view === "dashboard") {
    return "/app";
  }

  if (!projectId) {
    return `/app/${view}`;
  }

  return `/app/projects/${projectId}/${view}`;
}

export function isProjectAppPath(pathname: string): boolean {
  return PROJECT_VIEW_PATTERN.test(pathname.replace(/\/$/, ""));
}

const PROJECT_VIEWS: MainView[] = ["board", "docs", "meetings", "discussion"];

export function isProjectScopedView(view: MainView): boolean {
  return PROJECT_VIEWS.includes(view);
}
