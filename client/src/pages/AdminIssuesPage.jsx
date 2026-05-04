import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

const AdminIssuesPage = () => {
  const { showToast } = useToast();
  const [issues, setIssues] = useState([]);

  const loadIssues = async () => {
    try {
      const response = await api.get("/issues");
      setIssues(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/issues/${id}/status`, { status });
      showToast("Issue status updated");
      loadIssues();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Maintenance Issues</h1>
      <div className="mt-6 grid gap-4">
        {issues.map((issue) => (
          <article key={issue._id} className="panel grid gap-4 md:grid-cols-[160px_1fr_180px]">
            <div className="h-32 overflow-hidden rounded-md bg-slate-100">
              {issue.imageUrl ? <img className="h-full w-full object-cover" src={`${API_ROOT}${issue.imageUrl}`} alt="Issue" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>}
            </div>
            <div>
              <h2 className="font-bold text-ink">{issue.roomId?.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{issue.description}</p>
              <p className="mt-3 text-xs text-slate-500">Reported by {issue.reportedBy?.name} on {new Date(issue.createdAt).toLocaleString()}</p>
            </div>
            <select className="field h-fit" value={issue.status} onChange={(event) => updateStatus(issue._id, event.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </article>
        ))}
        {issues.length === 0 && <div className="panel text-slate-500">No issues reported.</div>}
      </div>
    </main>
  );
};

export default AdminIssuesPage;
