"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 55;

let activeCloseFlyout: (() => void) | null = null;

type SidebarFlyoutSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SidebarFlyoutSection({
  title,
  action,
  children,
}: SidebarFlyoutSectionProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closeSelfRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const closeImmediately = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(false);
    if (activeCloseFlyout === closeSelfRef.current) {
      activeCloseFlyout = null;
    }
  }, []);

  useEffect(() => {
    closeSelfRef.current = closeImmediately;
  }, [closeImmediately]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (activeCloseFlyout === closeSelfRef.current) {
        activeCloseFlyout = null;
      }
    };
  }, []);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setPosition({
      top: rect.top,
      left: rect.right + 8,
    });
  }, []);

  function cancelClose() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeImmediately();
    }, CLOSE_DELAY_MS);
  }

  function handleOpen() {
    if (activeCloseFlyout && activeCloseFlyout !== closeSelfRef.current) {
      activeCloseFlyout();
    }
    cancelClose();
    activeCloseFlyout = closeImmediately;
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    function handleReposition() {
      updatePosition();
    }
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  const flyout =
    open && mounted ? (
      <div
        className="sidebar-flyout-panel"
        style={{ top: position.top, left: position.left }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <p className="sidebar-flyout-title">{title}</p>
        {children}
      </div>
    ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="sidebar-flyout-trigger"
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
      >
        <div
          className={cn(
            "jira-sidebar-label-row jira-sidebar-label-row-compact",
            open && "jira-sidebar-label-row-active",
          )}
        >
          <div className="jira-sidebar-section-toggle">
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-white/80 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="jira-sidebar-label jira-sidebar-label-bright">{title}</span>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>

      {mounted && flyout ? createPortal(flyout, document.body) : null}
    </>
  );
}
