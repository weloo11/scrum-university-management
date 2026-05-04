import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const roleLabels = {
  user: "Regular User",
  student: "Student",
  admin: "Admin",
  professor: "Professor",
  TA: "TA",
  staff: "Staff"
};

const AdminUsersPage = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id, role) => {
    try {
      await api.put(`/auth/users/${id}/role`, { role });
      showToast("User role updated");
      await loadUsers();
      if (id === currentUser.id) await refreshUser();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">User Roles</h1>
        <p className="mt-2 text-slate-600">Assign roles to control access to student, staff, and admin features.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-ink">{user.name}</td>
                  <td className="p-3 text-slate-600">{user.email}</td>
                  <td className="p-3">{roleLabels[user.role]}</td>
                  <td className="p-3">
                    <select className="field max-w-44" value={user.role} onChange={(event) => updateRole(user._id, event.target.value)}>
                      <option value="user">Regular User</option>
                      <option value="student">Student</option>
                      <option value="professor">Professor</option>
                      <option value="TA">TA</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-5 text-slate-500" colSpan="4">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default AdminUsersPage;
