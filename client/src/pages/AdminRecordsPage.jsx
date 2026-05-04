import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const emptyRecord = {
  userId: "",
  studentId: "",
  name: "",
  email: "",
  department: "",
  year: 1,
  gpa: 0,
  coursesText: "",
  enrollmentDate: ""
};

const parseCourses = (text) => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, title, grade, credits] = line.split("|").map((part) => part.trim());
      return { code, title, grade, credits: Number(credits || 0) };
    });
};

const stringifyCourses = (courses = []) => courses.map((course) => `${course.code}|${course.title}|${course.grade}|${course.credits}`).join("\n");

const AdminRecordsPage = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyRecord);
  const [editing, setEditing] = useState(null);

  const studentUsers = useMemo(() => users.filter((user) => user.role === "student"), [users]);

  const loadRecords = async (search = query) => {
    try {
      const response = await api.get("/records", { params: search ? { query: search } : {} });
      setRecords(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadRecords("");
    loadUsers();
  }, []);

  const selectUser = (userId) => {
    const selected = users.find((user) => user._id === userId);
    setForm({ ...form, userId, name: selected?.name || "", email: selected?.email || "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        courses: parseCourses(form.coursesText),
        year: Number(form.year),
        gpa: Number(form.gpa)
      };
      delete payload.coursesText;
      if (editing) {
        await api.put(`/records/${editing}`, payload);
        showToast("Student record updated");
      } else {
        await api.post("/records", payload);
        showToast("Student record created");
      }
      setForm(emptyRecord);
      setEditing(null);
      loadRecords();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const startEdit = (record) => {
    setEditing(record._id);
    setForm({
      userId: record.userId?._id || record.userId,
      studentId: record.studentId,
      name: record.name,
      email: record.email,
      department: record.department,
      year: record.year,
      gpa: record.gpa,
      coursesText: stringifyCourses(record.courses),
      enrollmentDate: record.enrollmentDate?.slice(0, 10)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[380px_1fr]">
      <section className="panel h-fit">
        <h1 className="text-2xl font-bold text-ink">{editing ? "Edit Record" : "Create Student Record"}</h1>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <select className="field" value={form.userId} onChange={(event) => selectUser(event.target.value)} required>
            <option value="">Select student user</option>
            {studentUsers.map((user) => (
              <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
            ))}
          </select>
          <input className="field" value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} placeholder="Student ID" required />
          <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" required />
          <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" required />
          <input className="field" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Department" required />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="number" min="1" max="8" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} />
            <input className="field" type="number" min="0" max="4" step="0.01" value={form.gpa} onChange={(event) => setForm({ ...form, gpa: event.target.value })} />
          </div>
          <input className="field" type="date" value={form.enrollmentDate} onChange={(event) => setForm({ ...form, enrollmentDate: event.target.value })} required />
          <textarea className="field min-h-28" value={form.coursesText} onChange={(event) => setForm({ ...form, coursesText: event.target.value })} placeholder="CS301|Software Engineering|A|3" />
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{editing ? "Save Changes" : "Create Record"}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(emptyRecord); }}>Clear</button>}
          </div>
        </form>
      </section>
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-ink">Student Records</h2>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); loadRecords(query); }}>
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or ID" />
            <button className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">GPA</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-t border-slate-100">
                    <td className="p-3"><b>{record.name}</b><div className="text-xs text-slate-500">{record.studentId} | {record.email}</div></td>
                    <td className="p-3">{record.department}</td>
                    <td className="p-3">{record.year}</td>
                    <td className="p-3">{record.gpa}</td>
                    <td className="p-3"><button className="btn-secondary py-1" onClick={() => startEdit(record)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminRecordsPage;
