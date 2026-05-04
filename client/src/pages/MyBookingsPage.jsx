import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const statusClass = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800"
};

const MyBookingsPage = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadBookings = async () => {
    try {
      const response = await api.get("/bookings/my");
      setBookings(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const cancelBooking = async (id) => {
    try {
      await api.delete(`/bookings/${id}`);
      showToast("Booking cancelled");
      loadBookings();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/bookings/${editing._id}`, editing);
      showToast("Booking updated");
      setEditing(null);
      loadBookings();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">My Bookings</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
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
                  <td className="p-3 font-medium">{booking.roomId?.name}</td>
                  <td className="p-3">{booking.date}</td>
                  <td className="p-3">{booking.startTime} - {booking.endTime}</td>
                  <td className="p-3">{booking.purpose}</td>
                  <td className="p-3"><span className={`badge ${statusClass[booking.status]}`}>{booking.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary py-1" disabled={booking.status !== "pending"} onClick={() => setEditing({ ...booking, roomId: booking.roomId?._id })}>Edit</button>
                      <button className="btn-danger py-1" onClick={() => cancelBooking(booking._id)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td className="p-5 text-slate-500" colSpan="6">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={saveEdit} className="panel w-full max-w-lg space-y-3">
            <h2 className="text-xl font-bold text-ink">Edit Booking</h2>
            <input className="field" type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="field" type="time" value={editing.startTime} onChange={(event) => setEditing({ ...editing, startTime: event.target.value })} />
              <input className="field" type="time" value={editing.endTime} onChange={(event) => setEditing({ ...editing, endTime: event.target.value })} />
            </div>
            <textarea className="field" value={editing.purpose} onChange={(event) => setEditing({ ...editing, purpose: event.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Close</button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default MyBookingsPage;
