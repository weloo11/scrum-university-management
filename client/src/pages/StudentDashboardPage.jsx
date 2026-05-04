import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

const StudentDashboardPage = () => {
  const { showToast } = useToast();
  const [record, setRecord] = useState(null);
  const [requests, setRequests] = useState([]);

  const load = async () => {
    try {
      const [recordResponse, requestResponse] = await Promise.all([
        api.get("/records/me").catch((error) => ({ error })),
        api.get("/transcripts/my")
      ]);
      if (!recordResponse.error) setRecord(recordResponse.data.data);
      setRequests(requestResponse.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const requestTranscript = async () => {
    try {
      await api.post("/transcripts/request");
      showToast("Transcript requested");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Student Profile</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="panel">
          <h2 className="text-xl font-bold text-ink">Academic Record</h2>
          {record ? (
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">Student ID</span><div className="font-semibold">{record.studentId}</div></div>
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">Department</span><div className="font-semibold">{record.department}</div></div>
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">GPA</span><div className="font-semibold">{record.gpa}</div></div>
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">Name</span><div className="font-semibold">{record.name}</div></div>
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">Email</span><div className="font-semibold">{record.email}</div></div>
                <div className="rounded-md bg-slate-50 p-3 text-sm"><span className="text-slate-500">Year</span><div className="font-semibold">{record.year}</div></div>
              </div>
              <h3 className="mt-6 font-semibold text-ink">Courses</h3>
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr><th className="p-3">Code</th><th className="p-3">Title</th><th className="p-3">Grade</th><th className="p-3">Credits</th></tr>
                  </thead>
                  <tbody>
                    {record.courses.map((course, index) => (
                      <tr key={`${course.code}-${index}`} className="border-t border-slate-100">
                        <td className="p-3">{course.code}</td><td className="p-3">{course.title}</td><td className="p-3">{course.grade}</td><td className="p-3">{course.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-600">No student record is linked to this account yet.</p>
          )}
        </section>
        <aside className="panel h-fit">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Transcripts</h2>
            <button className="btn-primary" onClick={requestTranscript}>Request</button>
          </div>
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <div key={request._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="font-semibold capitalize">{request.status}</div>
                <div className="text-slate-500">{new Date(request.requestedAt).toLocaleString()}</div>
                {request.downloadUrl && (
                  <a className="mt-2 inline-flex font-semibold text-moss" href={`${API_ROOT}${request.downloadUrl}`} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                )}
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm text-slate-500">No transcript requests yet.</p>}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default StudentDashboardPage;
