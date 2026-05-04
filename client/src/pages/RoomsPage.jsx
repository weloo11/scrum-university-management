import { Calendar, ClipboardEdit, Search, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const initialFilters = { capacity: "", equipment: "", type: "", date: "", time: "" };
const initialBooking = { date: "", startTime: "", endTime: "", purpose: "" };

const RoomsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [booking, setBooking] = useState(initialBooking);
  const [issue, setIssue] = useState({ description: "", image: null });
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState("");

  const loadRooms = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const response = await api.get("/rooms", { params });
      setRooms(response.data.data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(initialFilters);
  }, []);

  const search = (event) => {
    event.preventDefault();
    loadRooms(filters);
  };

  const createBooking = async (event) => {
    event.preventDefault();
    setConflict("");
    try {
      await api.post("/bookings", { ...booking, roomId: selectedRoom._id });
      showToast("Booking request created");
      setBooking(initialBooking);
      setSelectedRoom(null);
    } catch (error) {
      if (error.message.includes("already booked")) setConflict(error.message);
      showToast(error.message, "error");
    }
  };

  const reportIssue = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("roomId", selectedRoom._id);
      formData.append("description", issue.description);
      if (issue.image) formData.append("image", issue.image);
      await api.post("/issues", formData);
      showToast("Issue reported");
      setIssue({ description: "", image: null });
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Room Availability</h1>
        <p className="mt-2 text-slate-600">Search classrooms and laboratories by capacity, equipment, type, date, and time.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit">
          <form onSubmit={search} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Minimum Capacity
              <input className="field mt-1" type="number" value={filters.capacity} onChange={(event) => setFilters({ ...filters, capacity: event.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Equipment
              <input className="field mt-1" placeholder="Projector, computers" value={filters.equipment} onChange={(event) => setFilters({ ...filters, equipment: event.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Type
              <select className="field mt-1" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                <option value="">Any</option>
                <option value="classroom">Classroom</option>
                <option value="lab">Lab</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date
              <input className="field mt-1" type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Time
              <input className="field mt-1" type="time" value={filters.time} onChange={(event) => setFilters({ ...filters, time: event.target.value })} />
            </label>
            <button className="btn-primary w-full" disabled={loading}>
              <Search size={16} />
              Search
            </button>
          </form>
        </aside>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room._id} className="panel flex flex-col overflow-hidden p-0">
              <img className="h-44 w-full object-cover" src={room.images?.[0]} alt={room.name} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">{room.name}</h2>
                    <p className="text-sm text-slate-600">{room.location}</p>
                  </div>
                  <span className="badge bg-moss/10 text-moss">{room.type}</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">Capacity: {room.capacity}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.equipment.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{item}</span>
                  ))}
                </div>
                <button className="btn-secondary mt-5 w-full" onClick={() => setSelectedRoom(room)}>
                  View Details
                </button>
              </div>
            </article>
          ))}
          {!loading && rooms.length === 0 && <div className="panel md:col-span-2 xl:col-span-3">No rooms match your search.</div>}
        </section>
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-2xl">
            <div className="grid md:grid-cols-[1fr_1.1fr]">
              <img className="h-72 w-full object-cover md:h-full" src={selectedRoom.images?.[0]} alt={selectedRoom.name} />
              <div className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-ink">{selectedRoom.name}</h2>
                    <p className="text-slate-600">{selectedRoom.location}</p>
                  </div>
                  <button className="btn-secondary" onClick={() => setSelectedRoom(null)}>Close</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-3 text-sm">Capacity: <b>{selectedRoom.capacity}</b></div>
                  <div className="rounded-md bg-slate-50 p-3 text-sm">Type: <b>{selectedRoom.type}</b></div>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Facilities</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedRoom.facilities.join(", ")}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Equipment</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedRoom.equipment.join(", ")}</p>
                </div>
                {user ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <form onSubmit={createBooking} className="rounded-lg border border-slate-200 p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><Calendar size={17} /> Book Room</h3>
                      {conflict && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{conflict}</div>}
                      <div className="space-y-3">
                        <input className="field" type="date" value={booking.date} onChange={(event) => setBooking({ ...booking, date: event.target.value })} required />
                        <div className="grid grid-cols-2 gap-2">
                          <input className="field" type="time" value={booking.startTime} onChange={(event) => setBooking({ ...booking, startTime: event.target.value })} required />
                          <input className="field" type="time" value={booking.endTime} onChange={(event) => setBooking({ ...booking, endTime: event.target.value })} required />
                        </div>
                        <textarea className="field" placeholder="Purpose" value={booking.purpose} onChange={(event) => setBooking({ ...booking, purpose: event.target.value })} required />
                        <button className="btn-primary w-full"><ClipboardEdit size={16} /> Submit Booking</button>
                      </div>
                    </form>
                    <form onSubmit={reportIssue} className="rounded-lg border border-slate-200 p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><Wrench size={17} /> Report Issue</h3>
                      <div className="space-y-3">
                        <textarea className="field" placeholder="Describe the issue" value={issue.description} onChange={(event) => setIssue({ ...issue, description: event.target.value })} required />
                        <input className="field" type="file" accept="image/*" onChange={(event) => setIssue({ ...issue, image: event.target.files?.[0] || null })} />
                        <button className="btn-secondary w-full">Report Issue</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Login to book rooms or report issues.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default RoomsPage;
