import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const CommunityPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [messageForm, setMessageForm] = useState({ receiver: "", content: "" });
  const [postForm, setPostForm] = useState({ title: "", content: "", topic: "" });
  const [replyText, setReplyText] = useState({});
  const [meetingForm, setMeetingForm] = useState({ professor: "", date: "", timeSlot: "" });

  const load = async () => {
    try {
      const [staffRes, messagesRes, postsRes, meetingsRes] = await Promise.all([
        api.get("/staff"),
        api.get("/community/messages"),
        api.get("/community/forum"),
        api.get("/community/meetings").catch(() => ({ data: { data: [] } }))
      ]);
      setStaff(staffRes.data.data);
      setMessages(messagesRes.data.data);
      setPosts(postsRes.data.data);
      setMeetings(meetingsRes.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const sendMessage = async (event) => {
    event.preventDefault();
    try {
      await api.post("/community/messages", messageForm);
      showToast("Message sent");
      setMessageForm({ receiver: "", content: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    try {
      await api.post("/community/forum", postForm);
      showToast("Forum post created");
      setPostForm({ title: "", content: "", topic: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const reply = async (postId) => {
    try {
      await api.post(`/community/forum/${postId}/replies`, { content: replyText[postId] });
      setReplyText({ ...replyText, [postId]: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const bookMeeting = async (event) => {
    event.preventDefault();
    try {
      await api.post("/community/meetings", meetingForm);
      showToast("Meeting requested");
      setMeetingForm({ professor: "", date: "", timeSlot: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Community</h1>
      <section className="grid gap-6 lg:grid-cols-3">
        <form className="panel space-y-3" onSubmit={sendMessage}>
          <h2 className="text-xl font-bold">Messages</h2>
          <select className="field" value={messageForm.receiver} onChange={(event) => setMessageForm({ ...messageForm, receiver: event.target.value })} required>
            <option value="">Receiver</option>
            {staff.filter((profile) => ["professor", "TA"].includes(profile.role)).map((profile) => <option key={profile._id} value={profile.user?._id}>{profile.fullName}</option>)}
          </select>
          <textarea className="field" placeholder="Message" value={messageForm.content} onChange={(event) => setMessageForm({ ...messageForm, content: event.target.value })} required />
          <button className="btn-primary">Send</button>
          <div className="max-h-64 overflow-auto text-sm">{messages.map((message) => <div key={message._id} className="border-b py-2"><b>{message.sender?.name}</b> to <b>{message.receiver?.name}</b><p>{message.content}</p></div>)}</div>
        </form>
        <form className="panel space-y-3" onSubmit={createPost}>
          <h2 className="text-xl font-bold">Forum</h2>
          <input className="field" placeholder="Title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} required />
          <input className="field" placeholder="Course/topic" value={postForm.topic} onChange={(event) => setPostForm({ ...postForm, topic: event.target.value })} />
          <textarea className="field" placeholder="Question" value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} required />
          <button className="btn-primary">Post</button>
        </form>
        {user?.role === "student" && (
          <form className="panel space-y-3" onSubmit={bookMeeting}>
            <h2 className="text-xl font-bold">Book Meeting</h2>
            <select className="field" value={meetingForm.professor} onChange={(event) => setMeetingForm({ ...meetingForm, professor: event.target.value })} required>
              <option value="">Professor / TA</option>
              {staff.filter((profile) => ["professor", "TA"].includes(profile.role)).map((profile) => <option key={profile._id} value={profile.user?._id}>{profile.fullName} | {profile.officeHours}</option>)}
            </select>
            <input className="field" type="date" value={meetingForm.date} onChange={(event) => setMeetingForm({ ...meetingForm, date: event.target.value })} required />
            <input className="field" placeholder="Time slot, e.g. 10:00-10:30" value={meetingForm.timeSlot} onChange={(event) => setMeetingForm({ ...meetingForm, timeSlot: event.target.value })} required />
            <button className="btn-primary">Request Meeting</button>
          </form>
        )}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {posts.map((post) => (
          <article key={post._id} className="panel">
            <h2 className="font-bold text-ink">{post.title}</h2>
            <p className="text-sm text-slate-500">{post.topic || post.course?.courseCode} | {post.author?.name}</p>
            <p className="mt-2 text-sm">{post.content}</p>
            <div className="mt-3 space-y-2">{post.replies.map((reply) => <div key={reply._id} className="rounded-md bg-slate-50 p-2 text-sm"><b>{reply.author?.name}</b>: {reply.content}</div>)}</div>
            <div className="mt-3 flex gap-2"><input className="field" placeholder="Reply" value={replyText[post._id] || ""} onChange={(event) => setReplyText({ ...replyText, [post._id]: event.target.value })} /><button className="btn-secondary" onClick={() => reply(post._id)}>Reply</button></div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2 className="mb-3 text-xl font-bold">Meetings</h2>
        <div className="grid gap-3 md:grid-cols-2">{meetings.map((meeting) => <div key={meeting._id} className="rounded-md border p-3 text-sm"><b>{meeting.professor?.name}</b><p>{meeting.date} | {meeting.timeSlot} | {meeting.status}</p></div>)}</div>
      </section>
    </main>
  );
};

export default CommunityPage;
