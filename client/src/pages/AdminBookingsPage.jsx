import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const AdminBookingsPage = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);

  const loadBookings = async () => {
    try {
      const response = await api.get("/bookings");
      setBookings(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      showToast(`Booking ${status}`);
      loadBookings();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Admin Bookings</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Requester</th>
                <th className="p-3">Room</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t border-slate-100">
                  <td className="p-3">{booking.userId?.name}<div className="text-xs text-slate-500">{booking.userId?.email}</div></td>
                  <td className="p-3">{booking.roomId?.name}</td>
                  <td className="p-3">{booking.date}</td>
                  <td className="p-3">{booking.startTime} - {booking.endTime}</td>
                  <td className="p-3">{booking.purpose}</td>
                  <td className="p-3 capitalize">{booking.status}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="btn-primary py-1" onClick={() => setStatus(booking._id, "approved")}>Approve</button>
                      <button className="btn-danger py-1" onClick={() => setStatus(booking._id, "rejected")}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default AdminBookingsPage;
