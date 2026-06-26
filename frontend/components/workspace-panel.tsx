"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { LoadingState } from "@/components/loading-state";
import { SidebarFlyoutSection } from "@/components/sidebar-flyout-section";
import { SELECTED_WORKSPACE_KEY } from "@/lib/app-navigation";
import { cn } from "@/lib/utils";
import {
  fetchMyWorkspaces,
  formatWorkspaceRole,
  type WorkspaceSummary,
} from "@/lib/workspaces";

type WorkspacePanelProps = {
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (
    workspace: WorkspaceSummary,
    options?: { navigate?: boolean },
  ) => void;
};

export function WorkspacePanel({
  selectedWorkspaceId,
  onSelectWorkspace,
}: WorkspacePanelProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMyWorkspaces();
      setWorkspaces(data);

      if (data.length === 0) {
        return;
      }

      const storedId =
        typeof window !== "undefined"
          ? localStorage.getItem(SELECTED_WORKSPACE_KEY)
          : null;
      const stored = storedId
        ? data.find((workspace) => workspace.id === storedId)
        : undefined;
      const selected = stored ?? data[0];
      if (selected.id !== selectedWorkspaceId) {
        onSelectWorkspace(selected, { navigate: false });
      }
    } catch {
      setLoadError("Could not load workspaces.");
    } finally {
      setIsLoading(false);
    }
  }, [onSelectWorkspace, selectedWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  function handleSelect(workspace: WorkspaceSummary) {
    localStorage.setItem(SELECTED_WORKSPACE_KEY, workspace.id);
    onSelectWorkspace(workspace);
  }

  function handleCreated(workspace: WorkspaceSummary) {
    setWorkspaces((current) => [workspace, ...current]);
    handleSelect(workspace);
  }

  return (
    <>
      <SidebarFlyoutSection
        title="Workspaces"
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="lane-add-btn"
            aria-label="Create workspace"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        }
      >
        {isLoading ? (
          <LoadingState inline label="Loading workspaces…" />
        ) : loadError ? (
          <p className="sidebar-flyout-meta text-[#bf2600]">{loadError}</p>
        ) : workspaces.length === 0 ? (
          <p className="sidebar-flyout-meta">No workspaces yet.</p>
        ) : (
          <ul className="sidebar-flyout-list">
            {workspaces.map((workspace) => {
              const isSelected = workspace.id === selectedWorkspaceId;
              return (
                <li key={workspace.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(workspace)}
                    className={cn(
                      "sidebar-flyout-item",
                      isSelected && "sidebar-flyout-item-active",
                    )}
                  >
                    <span className="truncate font-medium">{workspace.name}</span>
                    <span className="sidebar-flyout-subtext">
                      {formatWorkspaceRole(workspace.role)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarFlyoutSection>

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
