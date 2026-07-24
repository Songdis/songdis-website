"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
  type NotificationType,
} from "@/lib/api/notifications";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TypeIcon({ type }: { type: NotificationType }) {
  const iconClass = "w-4 h-4";
  switch (type) {
    case "release_status":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "split":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "withdrawal":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "request":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "subscription":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
  }
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

export default function NotificationPanel({ isOpen, onClose, onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getNotifications(p);
      if (res.data) {
        if (p === 1) {
          setNotifications(res.data.data);
        } else {
          setNotifications((prev) => [...prev, ...res.data!.data]);
        }
        setHasMore(res.data.next_page_url !== null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
      setPage(1);
    }
  }, [isOpen, fetchNotifications]);


  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      onCountChange(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.read_at) return;
    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      onCountChange(Math.max(0, notifications.filter((n) => !n.read_at && n.id !== notification.id).length));
    } catch {
      // silent
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next);
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[380px] max-h-[480px] rounded-xl bg-[#1A0808] border border-white/[0.07] shadow-2xl overflow-hidden z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <h3 className="font-heading text-white uppercase text-xs tracking-widest">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="font-body text-[#C30100] text-xs hover:text-[#C30100]/80 transition-colors disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
                  <div className="h-2.5 bg-white/10 rounded-full w-full" />
                  <div className="h-2 bg-white/5 rounded-full w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <p className="font-body text-white/40 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={[
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]",
                  !n.read_at ? "bg-[#C30100]/[0.04]" : "",
                ].join(" ")}
              >
                <div className={[
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  !n.read_at ? "bg-[#C30100]/20 text-[#C30100]" : "bg-white/10 text-white/30",
                ].join(" ")}>
                  <TypeIcon type={n.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={[
                    "font-body text-xs leading-relaxed",
                    !n.read_at ? "text-white" : "text-white/60",
                  ].join(" ")}>
                    {n.message}
                  </p>
                  <p className="font-body text-white/30 text-[10px] mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <div className="w-2 h-2 rounded-full bg-[#C30100] shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="border-t border-white/[0.07] px-4 py-2.5">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full font-body text-white/40 text-xs hover:text-white/60 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
