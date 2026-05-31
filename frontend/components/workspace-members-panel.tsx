"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ChevronDown, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  const [showInvite, setShowInvite] = useState(false);

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

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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
      setShowInvite(false);
    } catch (err) {
      setError(getWorkspaceErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const assignableRoles: WorkspaceRole[] =
    normalizedRole === "Owner" ? ["Member", "Admin"] : ["Member"];

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
          onClick={() => setShowInvite((current) => !current)}
          className="jira-nav-item text-white/70"
        >
          <UserPlus className="size-4 shrink-0" />
          <span>Invite member</span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 transition-transform",
              showInvite && "rotate-180",
            )}
          />
        </button>

        {showInvite ? (
          <form onSubmit={handleAddMember} className="mt-2 space-y-3 rounded-lg bg-black/15 p-3">
            {error ? (
              <p className="text-sm text-rose-200" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className="jira-sidebar-form-label">
                Email
              </Label>
              <Input
                id="member-email"
                className="jira-sidebar-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-role" className="jira-sidebar-form-label">
                Role
              </Label>
              <select
                id="member-role"
                className="jira-sidebar-input w-full"
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
            <Button type="submit" size="default" disabled={isSubmitting} className="w-full text-base">
              {isSubmitting ? "Adding…" : "Add member"}
            </Button>
          </form>
        ) : null}
      </div>
    </>
  );
}
