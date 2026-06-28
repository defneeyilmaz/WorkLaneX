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
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closeSelfRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [preferHover, setPreferHover] = useState(false);
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
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    function syncHoverPreference() {
      setPreferHover(media.matches);
    }
    syncHoverPreference();
    media.addEventListener("change", syncHoverPreference);
    return () => {
      media.removeEventListener("change", syncHoverPreference);
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
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      setPosition({
        top: rect.bottom + 6,
        left: Math.max(12, rect.left),
      });
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

  const handleOpen = useCallback(() => {
    if (activeCloseFlyout && activeCloseFlyout !== closeSelfRef.current) {
      activeCloseFlyout();
    }
    cancelClose();
    activeCloseFlyout = closeImmediately;
    updatePosition();
    setOpen(true);
  }, [closeImmediately, updatePosition]);

  function handleToggle() {
    if (open) {
      closeImmediately();
      return;
    }
    handleOpen();
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

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      closeImmediately();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeImmediately();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeImmediately, open]);

  const flyout =
    open && mounted ? (
      <div
        ref={panelRef}
        className="sidebar-flyout-panel"
        style={{ top: position.top, left: position.left }}
        onMouseEnter={preferHover ? cancelClose : undefined}
        onMouseLeave={preferHover ? scheduleClose : undefined}
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
        onMouseEnter={preferHover ? handleOpen : undefined}
        onMouseLeave={preferHover ? scheduleClose : undefined}
      >
        <div
          className={cn(
            "jira-sidebar-label-row jira-sidebar-label-row-compact",
            open && "jira-sidebar-label-row-active",
          )}
        >
          <button
            type="button"
            className="jira-sidebar-section-toggle"
            onClick={handleToggle}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-white/80 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="jira-sidebar-label jira-sidebar-label-bright">{title}</span>
          </button>
          {action ? (
            <div
              className="relative z-10 shrink-0"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {action}
            </div>
          ) : null}
        </div>
      </div>

      {mounted && flyout ? createPortal(flyout, document.body) : null}
    </>
  );
}
