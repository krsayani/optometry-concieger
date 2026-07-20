import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  Users,
  Briefcase,
  FileText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Building2,
  Bell,
  BellOff,
  Check,
  AlertCircle,
  X
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { getPlatformStats, getAdminNotifications, markNotificationRead, clearAllNotifications } from "@/services/admin";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [showAlertModal, setShowAlertModal] = useState(false);

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: getPlatformStats,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: getAdminNotifications,
  });

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];

  // Show alert modal if there are unread notifications on load
  useEffect(() => {
    if (notifications && unreadNotifications.length > 0) {
      setShowAlertModal(true);
    }
  }, [notifications?.length]); // Only trigger when the count changes or initially loads

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const handleMarkAllRead = async () => {
    try {
        // Just update status to read, don't delete
        const unreadIds = unreadNotifications.map(n => n.id);
        await Promise.all(unreadIds.map(id => markNotificationRead(id)));

        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        setShowAlertModal(false);
        toast.success("All notifications marked as read");
    } catch (err) {
        console.error("Failed to mark all read:", err);
        toast.error("Failed to update notifications");
    }
  };

  const handleClearAll = async () => {
    try {
        await clearAllNotifications();
        // Manually update the cache immediately to clear the UI
        queryClient.setQueryData(["admin-notifications"], []);
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        setShowAlertModal(false); // Close modal after clearing
        toast.success("Notification history cleared");
    } catch (err) {
        console.error("Failed to clear:", err);
        toast.error("Failed to clear notifications");
    }
  };

  // Enable Realtime sync for platform stats and notifications
  useEffect(() => {
    const channel = supabase
      .channel("admin-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "od_intake_responses" },
        (payload) => {
            queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
            toast.success("New OD Registered", {
                description: `${payload.new.first_name} ${payload.new.last_name} just submitted a career profile.`,
                icon: <UserCheck className="h-4 w-4 text-primary" />,
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "employer_intake_responses" },
        (payload) => {
            queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
            toast.success("New Practice Request", {
                description: `${payload.new.practice_name} just submitted a hiring request.`,
                icon: <Building2 className="h-4 w-4 text-success" />,
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
            setShowAlertModal(true); // Persistently show the modal on new entry
            toast.info(payload.new.title, {
                description: payload.new.content,
                icon: <Bell className="h-4 w-4 text-primary" />,
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isError) {
    return (
      <SiteLayout>
        <div className="container-page py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Platform Error</h1>
          <p className="mt-2 text-muted-foreground">{error?.message || "Could not load stats."}</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-page py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage intakes and user permissions</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <StatCard
              label="Total Users"
              value={stats?.users || 0}
              icon={Users}
              hint="Registered accounts"
            />
            <StatCard
              label="OD Intakes"
              value={stats?.odIntakes || 0}
              icon={UserCheck}
              hint="Candidate profiles"
              accent
            />
            <StatCard
              label="Practice Intakes"
              value={stats?.practiceIntakes || 0}
              icon={Building2}
              hint="Practice requests"
              accent
            />
            <StatCard
              label="System Status"
              value="Healthy"
              icon={TrendingUp}
              hint="Platform performance"
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <AdminActionCard
            title="OD Intakes"
            description="View and manage Optometrist career profiles and resumes."
            icon={UserCheck}
            to="/admin/od-intakes"
          />
          <AdminActionCard
            title="Practice Intakes"
            description="Review practice hiring requests and practice details."
            icon={Building2}
            to="/admin/practice-intakes"
          />
          <AdminActionCard
            title="Concierge Matching"
            description="Link candidates to employers and track the introduction workflow."
            icon={Users}
            to="/admin/matches"
          />
          <AdminActionCard
            title="User Management"
            description="View, suspend, or delete users and change roles."
            icon={Users}
            to="/admin/users"
          />
        </div>

        {/* Notifications Panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Recent Verified Submissions
                </h2>
                {notifications?.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full px-3"
                    >
                        Clear History
                    </Button>
                )}
            </div>

            {notificationsLoading ? (
                <div className="py-8 text-center"><LoadingSpinner /></div>
            ) : notifications?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <BellOff className="h-8 w-8 text-muted-foreground/40" />
                    <span>No new verified profile submissions yet.</span>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {notifications?.map((notif) => (
                        <div key={notif.id} className={`py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0 ${!notif.is_read ? 'bg-primary/5 -mx-4 px-4 rounded-xl' : ''}`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">{notif.title}</span>
                                    {!notif.is_read && <Badge className="text-[9px] h-4 px-1 bg-primary text-primary-foreground">New</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{notif.content}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                </p>
                            </div>

                            {!notif.is_read && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-success hover:bg-success/10"
                                    onClick={() => handleMarkRead(notif.id)}
                                    title="Mark as read"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Persistent Notification Alert Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="max-w-md p-0 border-none bg-background shadow-elevated overflow-hidden">
            <DialogHeader className="p-6 bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">Action Required</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 text-xs">
                            You have {unreadNotifications.length} unverified submission{unreadNotifications.length > 1 ? 's' : ''} to review.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                {unreadNotifications.map((notif) => (
                    <div key={notif.id} className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col gap-2 relative group">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-foreground">{notif.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.content}</p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-success/10 hover:text-success shrink-0"
                                onClick={() => handleMarkRead(notif.id)}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                            <Badge className="text-[9px] px-1.5 h-4 bg-primary/10 text-primary border-none">New Entry</Badge>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowAlertModal(false)} className="text-xs font-bold uppercase tracking-widest">
                    Dismiss
                </Button>
                <Button size="sm" onClick={handleMarkAllRead} className="rounded-full px-6 text-xs font-bold uppercase tracking-widest shadow-soft">
                    Mark All as Read
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function AdminActionCard({ title, description, icon: Icon, to }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card hover:border-primary/20"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
