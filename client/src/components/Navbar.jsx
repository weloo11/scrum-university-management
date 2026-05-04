import { Bell, BookOpen, Building2, ClipboardList, GraduationCap, LogOut, Menu, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-white text-moss shadow-sm" : "text-slate-700 hover:bg-white/70"
  }`;

const NotificationBell = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        className="relative rounded-md p-2 text-slate-700 hover:bg-white"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-copper px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 text-sm font-semibold text-slate-800">Notifications</div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {notifications.length === 0 && <p className="text-sm text-slate-500">No notifications yet.</p>}
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => markRead(notification._id)}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  notification.read ? "border-slate-200 bg-white" : "border-moss/30 bg-moss/5"
                }`}
              >
                <div className="font-semibold text-slate-800">{notification.title}</div>
                <div className="text-slate-600">{notification.message}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/rooms", label: "Rooms", icon: Building2, roles: ["student", "admin"] },
    { to: "/my-bookings", label: "My Bookings", icon: ClipboardList, roles: ["student", "admin"] },
    { to: "/student/academics", label: "Academics", icon: GraduationCap, roles: ["student"] },
    { to: "/community", label: "Community", icon: BookOpen, roles: ["student", "professor", "TA", "staff", "admin"] },
    { to: "/teaching", label: "Teaching", icon: ClipboardList, roles: ["professor", "TA"] },
    { to: "/staff", label: "Staff", icon: UserRound, roles: ["professor", "TA", "staff"] },
    { to: "/apply", label: "Apply", icon: BookOpen, roles: ["user"] },
    { to: "/status", label: "Status", icon: BookOpen, roles: ["user"] },
    { to: "/admin/operations", label: "Operations", icon: Building2, roles: ["admin"] },
    { to: "/admin/bookings", label: "All Bookings", icon: UserRound, roles: ["admin"] },
    { to: "/admin/issues", label: "Issues", icon: ClipboardList, roles: ["admin"] },
    { to: "/admin/records", label: "Records", icon: GraduationCap, roles: ["admin"] },
    { to: "/admin/applications", label: "Applications", icon: BookOpen, roles: ["admin"] },
    { to: "/admin/transcripts", label: "Transcripts", icon: BookOpen, roles: ["admin"] },
    { to: "/admin/users", label: "Users", icon: UserRound, roles: ["admin"] }
  ].filter((link) => link.roles.includes(user?.role || null));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-cloud/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink">
          <Building2 className="text-moss" size={24} />
          UniOps
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  <Icon size={16} />
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:block">{user.name}</span>
              <button className="rounded-md p-2 text-slate-700 hover:bg-white" onClick={handleLogout} aria-label="Logout">
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link className="btn-secondary" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/register">
                Register
              </Link>
            </div>
          )}
          <button className="rounded-md p-2 text-slate-700 hover:bg-white md:hidden" onClick={() => setMobileOpen((value) => !value)}>
            <Menu size={20} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setMobileOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClass} onClick={() => setMobileOpen(false)}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
