import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

export const ApplicationPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: "", department: "", documents: [] });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("department", form.department);
      Array.from(form.documents).forEach((file) => formData.append("documents", file));
      await api.post("/admissions", formData);
      showToast("Application submitted");
      setForm({ name: user?.name || "", email: user?.email || "", phone: "", department: "", documents: [] });
      event.target.reset();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <form onSubmit={submit} className="panel space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Admission Application</h1>
          <p className="mt-2 text-slate-600">Submit your application and supporting documents.</p>
        </div>
        <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" required />
        <input className="field bg-slate-50" type="email" value={form.email} readOnly placeholder="Email" required />
        <input className="field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" required />
        <input className="field" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Department" required />
        <input className="field" type="file" multiple onChange={(event) => setForm({ ...form, documents: event.target.files })} />
        <button className="btn-primary w-full">Submit Application</button>
      </form>
    </main>
  );
};

export const StatusCheckPage = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [application, setApplication] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.get(`/admissions/status/${encodeURIComponent(email)}`);
      setApplication(response.data.data);
      if (response.data.data.status === "accepted" && user?.email === response.data.data.email) {
        await refreshUser();
      }
    } catch (error) {
      setApplication(null);
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <form onSubmit={submit} className="panel space-y-4">
        <h1 className="text-3xl font-bold text-ink">Check Application Status</h1>
        <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Application email" required />
        <button className="btn-primary">Check Status</button>
        {application && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Application for {application.name}</div>
            <div className="mt-1 text-2xl font-bold capitalize text-ink">{application.status}</div>
            <div className="mt-1 text-sm text-slate-600">{application.department}</div>
          </div>
        )}
      </form>
    </main>
  );
};

export const AdminApplicationsPage = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);

  const loadApplications = async () => {
    try {
      const response = await api.get("/admissions");
      setApplications(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/admissions/${id}/status`, { status });
      showToast(`Application ${status}`);
      loadApplications();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Admission Applications</h1>
      <div className="mt-6 grid gap-4">
        {applications.map((application) => (
          <article key={application._id} className="panel grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-ink">{application.name}</h2>
                <span className="badge bg-slate-100 capitalize text-slate-700">{application.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{application.email} | {application.phone} | {application.department}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {application.documents.map((doc) => (
                  <a key={doc} className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-moss" href={`${API_ROOT}${doc}`} target="_blank" rel="noreferrer">Document</a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 lg:justify-end">
              <button className="btn-primary" onClick={() => setStatus(application._id, "accepted")}>Accept</button>
              <button className="btn-danger" onClick={() => setStatus(application._id, "rejected")}>Reject</button>
            </div>
          </article>
        ))}
        {applications.length === 0 && <div className="panel text-slate-500">No applications submitted yet.</div>}
      </div>
    </main>
  );
};
