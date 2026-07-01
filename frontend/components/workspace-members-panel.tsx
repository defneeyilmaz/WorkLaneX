"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canManageMembers,
  normalizeWorkspaceRole,
} from "@/lib/permissions";
import {
  addWorkspaceMember,
  fetchWorkspaceMembers,
  formatWorkspaceRole,
  getWorkspaceErrorMessage,
  type WorkspaceMemberSummary,
  type WorkspaceRole,
} from "@/lib/workspaces";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useIsClient } from "@/lib/use-is-client";

type WorkspaceMembersPanelProps = {
  workspaceId: string;
  actorRole: WorkspaceRole;
};

export function WorkspaceMembersPanel({
  workspaceId,
  actorRole,
}: WorkspaceMembersPanelProps) {
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("Member");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mounted = useIsClient();

  const normalizedRole = normalizeWorkspaceRole(actorRole);

  const loadMembers = useCallback(async () => {
    if (!canManageMembers(normalizedRole)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch {
      setError("Could not load members.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedRole, workspaceId]);

  useDeferredEffect(() => loadMembers(), [loadMembers]);

  useDeferredEffect(() => {
    if (!dialogOpen) {
      return;
    }
    setEmail("");
    setRole("Member");
    setError(null);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen]);

  if (!canManageMembers(normalizedRole)) {
    return null;
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await addWorkspaceMember(workspaceId, email.trim(), role);
      setMembers((current) => [...current, created]);
      setEmail("");
      setRole("Member");
    } catch (err) {
      setError(getWorkspaceErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const assignableRoles: WorkspaceRole[] =
    normalizedRole === "Owner" ? ["Member", "Admin"] : ["Member"];

  const membersDialog =
    dialogOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="task-create-backdrop"
              aria-label="Close dialog"
              onClick={() => setDialogOpen(false)}
            />
            <div
              className="task-create-dialog members-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="members-dialog-title"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="members-dialog-title"
                    className="text-xl font-semibold text-[#1c1917]"
                  >
                    Members
                  </h2>
                  <p className="mt-1 text-sm text-[#78716c]">
                    View workspace members and invite teammates by email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-md p-1 text-[#78716c] hover:bg-[#f5f5f4] hover:text-[#1c1917]"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="members-dialog-list mb-6 max-h-48 overflow-y-auto rounded-lg border border-[#e7e5e4]">
                {isLoading ? (
                  <p className="px-4 py-3 text-sm text-[#78716c]">Loading…</p>
                ) : members.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[#78716c]">No members yet.</p>
                ) : (
                  <ul className="divide-y divide-[#e7e5e4]">
                    {members.map((member) => (
                      <li key={member.userId} className="px-4 py-3">
                        <p className="font-medium text-[#1c1917]">{member.fullName}</p>
                        <p className="text-sm text-[#78716c]">
                          {member.email} · {formatWorkspaceRole(member.role)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <p className="text-sm font-medium text-[#57534e]">Invite by email</p>
                {error ? (
                  <p
                    className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    className="h-10"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-role">Role</Label>
                  <select
                    id="member-role"
                    className="flex h-10 w-full rounded-md border border-[#d6d3d1] bg-white px-3 text-sm text-[#1c1917]"
                    value={role}
                    onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                  >
                    {assignableRoles.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="dialog-btn-cancel"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding…" : "Add member"}
                  </Button>
                </div>
              </form>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="jira-sidebar-label-wrap">
        <p className="jira-sidebar-label">Team</p>
      </div>

      {isLoading ? (
        <p className="jira-sidebar-meta">Loading…</p>
      ) : (
        <ul className="space-y-0.5 px-2">
          {members.map((member) => (
            <li
              key={member.userId}
              className="jira-nav-item pointer-events-none flex-col items-start gap-1 py-3 opacity-90"
            >
              <span className="truncate font-medium">{member.fullName}</span>
              <span className="jira-nav-subtext truncate">
                {member.email} · {formatWorkspaceRole(member.role)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="px-2 pt-1">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="jira-nav-item w-full text-white/70"
        >
          <span>Members</span>
        </button>
      </div>

      {membersDialog}
    </>
  );
}
