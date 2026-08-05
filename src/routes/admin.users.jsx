import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users as UsersIcon,
  Calendar,
  Shield,
  Trash2,
  UserX,
  UserCheck,
  Search,
  Mail,
  UserCog,
  Filter,
  ShieldAlert,
  ShieldCheck as ShieldCheckIcon,
  Briefcase,
  User as UserIcon,
  FileText,
  Building2
} from "lucide-react";
import { listAllUsers, updateUserStatus, deleteUser, addUserRole, removeUserRole } from "@/services/admin";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/LoadingSpinner";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDate } from "@/utils/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listAllUsers,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const fullName = user.full_name || "";
      const userId = user.id || "";
      const email = user.email || "";

      const matchesSearch =
        search === "" ||
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        userId.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "All" || user.roles?.includes(roleFilter);
      const matchesStatus = statusFilter === "All" || (user.status || "Active") === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Enable Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("admin-users-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated");
    },
    onError: (err) => toast.error("We couldn't update the user's status. Please try again."),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role, action }) =>
        action === 'add' ? addUserRole(userId, role) : removeUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User permissions updated");
    },
    onError: (err) => toast.error("We couldn't update the user's roles. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
      setConfirmDelete(null);
    },
    onError: (err) => toast.error("We couldn't delete the user. Please try again."),
  });

  if (isError) return <div className="container-page py-20 text-center text-destructive">{error.message}</div>;

  return (
    <>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">Manage platform users, roles, and access permissions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-full">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="employer">Practices</SelectItem>
                    <SelectItem value="od">ODs</SelectItem>
                    <SelectItem value="super_admin">Admins</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">User Profile</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right text-[11px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.full_name} url={user.avatar_url} className="h-10 w-10 border border-border" />
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">{user.full_name || "No Name Provided"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate lowercase tracking-tighter">
                            {user.email || `id: ${user.id.slice(0, 8)}...`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-wrap gap-1">
                           {user.roles?.map((r) => (
                               <Badge key={r} variant="outline" className={cn(
                                   "px-2 py-0 h-5 text-[10px] font-bold uppercase",
                                   r === 'super_admin' ? "bg-primary/5 text-primary border-primary/20" :
                                   r === 'employer' ? "bg-success/5 text-success border-success/20" :
                                   "bg-accent/10 text-accent-foreground"
                               )}>
                                   {r === 'super_admin' ? <ShieldCheckIcon className="h-3 w-3 mr-1" /> :
                                    r === 'employer' ? <Briefcase className="h-3 w-3 mr-1" /> :
                                    <UserIcon className="h-3 w-3 mr-1" />}
                                   {r}
                               </Badge>
                           ))}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full", user.status === 'Active' ? 'bg-success' : 'bg-destructive')} />
                            <span className={cn("text-xs font-medium", user.status === 'Active' ? 'text-success' : 'text-destructive')}>
                                {user.status || 'Active'}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <UserCog className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated">
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Manage Access</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {user.status === 'Suspended' ? (
                                    <DropdownMenuItem onClick={() => statusMutation.mutate({ userId: user.id, status: 'Active' })} disabled={user.id === currentUser?.id}>
                                        <UserCheck className="mr-2 h-4 w-4 text-success" /> <span>Reactivate Account</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => statusMutation.mutate({ userId: user.id, status: 'Suspended' })} disabled={user.id === currentUser?.id}>
                                        <UserX className="mr-2 h-4 w-4 text-destructive" /> <span>Suspend Account</span>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Profile Data</DropdownMenuLabel>

                                {user.od_intake_id && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin/od-intakes" search={{ search: user.email || user.full_name }}>
                                            <FileText className="mr-2 h-4 w-4 text-primary" /> <span>View Career Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                {user.practice_intake_id && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin/practice-intakes" search={{ search: user.email || user.full_name }}>
                                            <Building2 className="mr-2 h-4 w-4 text-success" /> <span>View Practice Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Manage Roles</DropdownMenuLabel>

                                {['employer', 'od', 'super_admin'].map((r) => {
                                    const hasRole = user.roles?.includes(r);
                                    return (
                                        <DropdownMenuItem
                                            key={r}
                                            onClick={() => roleMutation.mutate({
                                                userId: user.id,
                                                role: r,
                                                action: hasRole ? 'remove' : 'add'
                                            })}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="capitalize">{r.replace('_', ' ')}</span>
                                                {hasRole && <ShieldCheckIcon className="h-3.5 w-3.5 text-success" />}
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => setConfirmDelete(user)}
                                    disabled={user.id === currentUser?.id}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> <span>Permanently Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(isLoading || filteredUsers?.length === 0) && (
              <div className="py-20 bg-card">
                {isLoading ? <PageLoader /> : (
                  <EmptyState
                    icon={search || roleFilter !== "All" ? Search : UsersIcon}
                    title={search || roleFilter !== "All" ? "No matching users" : "No users found"}
                    description={search || roleFilter !== "All" ? "Try adjusting your search or filters." : "When users register on the platform, they will appear here."}
                    action={search || roleFilter !== "All" ? (
                      <Button variant="outline" onClick={() => { setSearch(""); setRoleFilter("All"); }} className="rounded-full">
                        Clear all filters
                      </Button>
                    ) : null}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={(o) => !o && setConfirmDelete(null)}
          title="Permanently Delete User?"
          description={`Are you sure you want to delete ${confirmDelete?.full_name}? This will remove their profile and all associated data from the platform. This action is irreversible.`}
          confirmLabel="Delete User"
          destructive
          onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        />
      </div>
    </>
  );
}
