export type MainView = "dashboard" | "board" | "docs";

export const SELECTED_WORKSPACE_KEY = "worklanex_selected_workspace_id";
export const SELECTED_PROJECT_KEY = "worklanex_selected_project_id";

export type ParsedAppPath = {
  view: MainView;
  projectId: string | null;
};

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

  const boardMatch = normalized.match(/^\/app\/projects\/([^/]+)\/board$/);
  if (boardMatch) {
    return { view: "board", projectId: boardMatch[1] };
  }

  const docsMatch = normalized.match(/^\/app\/projects\/([^/]+)\/docs$/);
  if (docsMatch) {
    return { view: "docs", projectId: docsMatch[1] };
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
  return /^\/app\/projects\/[^/]+\/(board|docs)$/.test(pathname.replace(/\/$/, ""));
}
