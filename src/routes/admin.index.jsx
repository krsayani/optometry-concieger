import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Building2,
  Bell,
  BellOff,
  Check,
  AlertCircle,
  GitMerge,
  CalendarDays,
  FileText,
  MapPin,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  getAdminDashboardMetrics,
  getAdminNotifications,
  markNotificationRead,
  clearAllNotifications,
} from "@/services/admin";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "@/utils/format";
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

  const { data: metrics, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: getAdminDashboardMetrics,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: getAdminNotifications,
  });

  const unreadNotifications = notifications?.filter((n) => !n.is_read) || [];

  useEffect(() => {
    if (notifications && unreadNotifications.length > 0) {
      setShowAlertModal(true);
    }
  }, [notifications?.length]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = unreadNotifications.map((n) => n.id);
      await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
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
      queryClient.setQueryData(["admin-notifications"], []);
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setShowAlertModal(false);
      toast.success("Notification history cleared");
    } catch (err) {
      console.error("Failed to clear:", err);
      toast.error("Failed to clear notifications");
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () =>
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-metrics"],
          }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "od_intake_responses" },
        (payload) => {
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-metrics"],
          });
          if (payload.eventType === "INSERT") {
            toast.success("New OD Registered", {
              description: `${payload.new.first_name} ${payload.new.last_name} just submitted a career profile.`,
              icon: <UserCheck className="h-4 w-4 text-primary" />,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employer_intake_responses" },
        (payload) => {
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-metrics"],
          });
          if (payload.eventType === "INSERT") {
            toast.success("New Practice Request", {
              description: `${payload.new.practice_name} just submitted a hiring request.`,
              icon: <Building2 className="h-4 w-4 text-success" />,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "concierge_matches" },
        () =>
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-metrics"],
          }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          setShowAlertModal(true);
          toast.info(payload.new.title, {
            description: payload.new.content,
            icon: <Bell className="h-4 w-4 text-primary" />,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isError) {
    return (
      <div className="container-page py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Platform Error</h1>
        <p className="mt-2 text-muted-foreground">
          {error?.message || "Could not load dashboard metrics."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="container-page py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Optometrist & practice submission KPIs — super admin only
              </p>
            </div>
          </div>
          <Badge className="w-fit bg-primary/10 text-primary border-none px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
            Restricted Access
          </Badge>
        </div>

        {isLoading || !metrics ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Top KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <StatCard
                label="Optometrist Profiles"
                value={metrics.totals.odIntakes}
                icon={UserCheck}
                hint={`${metrics.activity.odLast7} new in last 7 days · ${metrics.totals.activeOd} active`}
                accent
              />
              <StatCard
                label="Practice Requests"
                value={metrics.totals.practiceIntakes}
                icon={Building2}
                hint={`${metrics.activity.practiceLast7} new in last 7 days · ${metrics.totals.openPractices} open`}
                accent
              />
              <StatCard
                label="Concierge Matches"
                value={metrics.totals.matches}
                icon={GitMerge}
                hint={`${metrics.activity.matchesLast7} created this week`}
              />
              <StatCard
                label="Registered Users"
                value={metrics.totals.users}
                icon={Users}
                hint={`${metrics.activity.odLast30 + metrics.activity.practiceLast30} submissions in 30 days`}
              />
            </div>

            {/* Secondary KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <MiniKpi
                icon={CalendarDays}
                label="OD submissions (30d)"
                value={metrics.activity.odLast30}
              />
              <MiniKpi
                icon={CalendarDays}
                label="Practice submissions (30d)"
                value={metrics.activity.practiceLast30}
              />
              <MiniKpi
                icon={FileText}
                label="Resume upload rate"
                value={`${metrics.quality.resumeRate}%`}
                hint={`${metrics.quality.resumeCount} of ${metrics.totals.odIntakes}`}
              />
              <MiniKpi
                icon={TrendingUp}
                label="OD consent rate"
                value={`${metrics.quality.consentRate}%`}
                hint={`${metrics.quality.consentCount} consented`}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3 mb-8">
              {/* Activity chart */}
              <section className="xl:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold">Submission activity</h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Last 14 days — OD vs practice intakes
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" /> OD
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent" /> Practice
                    </span>
                  </div>
                </div>
                <ActivityBars days={metrics.activity.last14Days} />
              </section>

              {/* Quality / verified */}
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
                <div>
                  <h2 className="text-lg font-bold">Profile quality</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Completeness signals across intakes
                  </p>
                </div>
                <ProgressRow
                  label="OD email verified"
                  value={metrics.quality.odVerifiedRate}
                />
                <ProgressRow
                  label="Practice email verified"
                  value={metrics.quality.practiceVerifiedRate}
                />
                <ProgressRow
                  label="Resume attached"
                  value={metrics.quality.resumeRate}
                />
                <ProgressRow
                  label="Consent given"
                  value={metrics.quality.consentRate}
                />
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <FunnelCard
                title="Optometrist pipeline"
                description="Status funnel for career profiles"
                items={metrics.funnels.od}
                linkTo="/admin/od-intakes"
                linkLabel="View all ODs"
              />
              <FunnelCard
                title="Practice pipeline"
                description="Status funnel for hiring requests"
                items={metrics.funnels.practice}
                linkTo="/admin/practice-intakes"
                linkLabel="View all practices"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <BreakdownCard
                title="Top OD preferred states"
                icon={MapPin}
                items={metrics.breakdowns.topStates}
                empty="No preferred states yet"
              />
              <BreakdownCard
                title="Top practice locations"
                icon={MapPin}
                items={metrics.breakdowns.topLocations}
                empty="No practice locations yet"
              />
              <BreakdownCard
                title="Hiring urgency"
                icon={Clock3}
                items={metrics.breakdowns.urgency}
                empty="No urgency data yet"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <RecentTable
                title="Recent optometrist submissions"
                linkTo="/admin/od-intakes"
                rows={metrics.recent.ods}
                type="od"
              />
              <RecentTable
                title="Recent practice submissions"
                linkTo="/admin/practice-intakes"
                rows={metrics.recent.practices}
                type="practice"
              />
            </div>

            {metrics.funnels.matches.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">Match status</h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Concierge introduction workflow
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link to="/admin/matches">
                      Open matches <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metrics.funnels.matches.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-muted/40 px-3 py-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Notifications Panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Recent Verified
              Submissions
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
            <div className="py-8 text-center">
              <LoadingSpinner />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <BellOff className="h-8 w-8 text-muted-foreground/40" />
              <span>No new verified profile submissions yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications?.map((notif) => (
                <div
                  key={notif.id}
                  className={`py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0 ${!notif.is_read ? "bg-primary/5 -mx-4 px-4 rounded-xl" : ""}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {notif.title}
                      </span>
                      {!notif.is_read && (
                        <Badge className="text-[9px] h-4 px-1 bg-primary text-primary-foreground">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
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

      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="max-w-md p-0 border-none bg-background shadow-elevated overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Action Required
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 text-xs">
                  You have {unreadNotifications.length} unverified submission
                  {unreadNotifications.length > 1 ? "s" : ""} to review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
            {unreadNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col gap-2 relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.content}
                    </p>
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
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <Badge className="text-[9px] px-1.5 h-4 bg-primary/10 text-primary border-none">
                    New Entry
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlertModal(false)}
              className="text-xs font-bold uppercase tracking-widest"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleMarkAllRead}
              className="rounded-full px-6 text-xs font-bold uppercase tracking-widest shadow-soft"
            >
              Mark All as Read
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MiniKpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4 text-accent" />
        <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint ? (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-primary">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function ActivityBars({ days }) {
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-44">
      {days.map((day) => {
        const odH = (day.od / max) * 100;
        const practiceH = (day.practice / max) * 100;
        return (
          <div
            key={day.label}
            className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
            title={`${day.label}: ${day.od} OD, ${day.practice} practice`}
          >
            <div className="w-full flex items-end justify-center gap-0.5 h-36">
              <div
                className="w-[42%] rounded-t-md bg-primary/90 min-h-[2px]"
                style={{ height: `${Math.max(day.od ? 8 : 2, odH)}%` }}
              />
              <div
                className="w-[42%] rounded-t-md bg-accent min-h-[2px]"
                style={{ height: `${Math.max(day.practice ? 8 : 2, practiceH)}%` }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate w-full text-center">
              {day.label.replace(/ .*/, "")}
              <span className="hidden sm:inline">
                {" "}
                {day.label.split(" ")[1]}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FunnelCard({ title, description, items, linkTo, linkLabel }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {description}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full shrink-0">
          <Link to={linkTo}>
            {linkLabel} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No submissions yet
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs font-bold text-muted-foreground">
                  {item.count}
                  {total > 0 ? (
                    <span className="ml-1 text-muted-foreground/70">
                      ({Math.round((item.count / total) * 100)}%)
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BreakdownCard({ title, icon: Icon, items, empty }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {item.label}
              </span>
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentTable({ title, linkTo, rows, type }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to={linkTo}>
            View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No submissions yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-bold pr-3">
                  {type === "od" ? "Doctor" : "Practice"}
                </th>
                <th className="pb-2 font-bold pr-3">Status</th>
                <th className="pb-2 font-bold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {type === "od"
                        ? row.school || row.email
                        : row.location || row.email}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={row.status} />
                    {type === "practice" && row.urgency ? (
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        {row.urgency}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
