import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

const AdminTranscriptsPage = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const response = await api.get("/transcripts");
      setRequests(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const generate = async (id) => {
    try {
      await api.get(`/transcripts/${id}/generate`);
      showToast("Transcript generated");
      loadRequests();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Transcript Requests</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-3">Student</th><th className="p-3">Requested</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id} className="border-t border-slate-100">
                <td className="p-3">{request.studentId?.name}<div className="text-xs text-slate-500">{request.studentId?.email}</div></td>
                <td className="p-3">{new Date(request.requestedAt).toLocaleString()}</td>
                <td className="p-3 capitalize">{request.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="btn-primary py-1" onClick={() => generate(request._id)}>Generate</button>
                    {request.downloadUrl && <a className="btn-secondary py-1" href={`${API_ROOT}${request.downloadUrl}`} target="_blank" rel="noreferrer">Open PDF</a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default AdminTranscriptsPage;
