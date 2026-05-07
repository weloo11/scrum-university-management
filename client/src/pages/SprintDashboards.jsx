import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const emptyCourse = { courseCode: "", courseName: "", type: "core", program: "", capacity: 30, prerequisites: "", instructor: "", credits: 3, studyYear: 1, semester: 1 };
const emptyAnnouncement = { title: "", body: "", category: "", targetAudience: "all" };
const emptyEvent = { title: "", description: "", date: "", time: "", location: "" };
const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace("/api", "");

const useLoad = (loader, deps = []) => {
  useEffect(() => {
    loader();
  }, deps);
};

const formatAssessmentDate = (date) => date ? new Date(date).toLocaleDateString() : "No date";

const groupCoursesByStudyPeriod = (courses) => {
  return courses.reduce((groups, course) => {
    const key = `Year ${course.studyYear || 1} | Semester ${course.semester || 1}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(course);
    return groups;
  }, {});
};

const CourseCard = ({ course, onEnroll, assessments = [], isEnrolled = false }) => (
  <article className="panel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-bold text-ink">{course.courseCode} - {course.courseName}</h3>
        <p className="text-sm text-slate-600">{course.program} | {course.type} | {course.enrolledStudents?.length || 0}/{course.capacity}</p>
      </div>
      <span className="badge bg-moss/10 text-moss">{course.type}</span>
    </div>
    <p className="mt-2 text-sm text-slate-600">Instructor: {course.instructor?.name || "Unassigned"}</p>
    <p className="mt-1 text-sm text-slate-600">Prerequisites: {course.prerequisites?.join(", ") || "None"}</p>
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-ink">Assessments</h4>
      {assessments.length > 0 ? (
        <div className="mt-2 space-y-2">
          {assessments.map((assessment) => (
            <div key={assessment._id} className="text-sm">
              <span className="font-medium capitalize">{assessment.type}</span>
              <span className="text-slate-600"> | {assessment.title} | {formatAssessmentDate(assessment.date)} | {assessment.maxMarks} marks</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">{isEnrolled ? "No assessments posted yet." : "Enroll to view posted assessments."}</p>
      )}
    </div>
    {onEnroll && <button className="btn-secondary mt-4 disabled:cursor-not-allowed disabled:opacity-50" disabled={isEnrolled} onClick={() => onEnroll(course._id)}>{isEnrolled ? "Already enrolled" : "Select Course"}</button>}
  </article>
);

export const AdminOperationsPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [staffForm, setStaffForm] = useState({ user: "", fullName: "", role: "professor", email: "", department: "", phone: "", officeLocation: "", officeHours: "" });
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [eventForm, setEventForm] = useState(emptyEvent);

  const load = async () => {
    try {
      const [usersRes, coursesRes, staffRes, leavesRes, transcriptsRes, announcementsRes, eventsRes] = await Promise.all([
        api.get("/auth/users"),
        api.get("/academic/courses"),
        api.get("/staff"),
        api.get("/staff/leave"),
        api.get("/transcripts"),
        api.get("/community/announcements"),
        api.get("/community/events")
      ]);
      setUsers(usersRes.data.data);
      setCourses(coursesRes.data.data);
      setStaffProfiles(staffRes.data.data);
      setLeaves(leavesRes.data.data);
      setTranscripts(transcriptsRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useLoad(load, []);

  const saveCourse = async (event) => {
    event.preventDefault();
    try {
      await api.post("/academic/courses", {
        ...courseForm,
        capacity: Number(courseForm.capacity),
        credits: Number(courseForm.credits),
        studyYear: Number(courseForm.studyYear),
        semester: Number(courseForm.semester),
        prerequisites: courseForm.prerequisites.split(",").map((item) => item.trim()).filter(Boolean),
        instructor: courseForm.instructor || undefined
      });
      showToast("Course created");
      setCourseForm(emptyCourse);
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const saveStaff = async (event) => {
    event.preventDefault();
    try {
      await api.post("/staff", staffForm);
      showToast("Staff profile saved");
      setStaffForm({ user: "", fullName: "", role: "professor", email: "", department: "", phone: "", officeLocation: "", officeHours: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const updateLeave = async (id, status) => {
    try {
      await api.put(`/staff/leave/${id}/status`, { status });
      showToast(`Leave ${status}`);
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const generateTranscript = async (id) => {
    try {
      await api.get(`/transcripts/${id}/generate`);
      showToast("Transcript generated");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();
    try {
      await api.post("/community/announcements", announcementForm);
      showToast("Announcement created");
      setAnnouncementForm(emptyAnnouncement);
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const saveEvent = async (event) => {
    event.preventDefault();
    try {
      await api.post("/community/events", eventForm);
      showToast("Event created");
      setEventForm(emptyEvent);
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Admin Operations</h1>
      <section className="grid gap-6 lg:grid-cols-2">
        <form className="panel space-y-3" onSubmit={saveCourse}>
          <h2 className="text-xl font-bold">Create Course</h2>
          <input className="field" placeholder="Course code" value={courseForm.courseCode} onChange={(event) => setCourseForm({ ...courseForm, courseCode: event.target.value })} required />
          <input className="field" placeholder="Course name" value={courseForm.courseName} onChange={(event) => setCourseForm({ ...courseForm, courseName: event.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <select className="field" value={courseForm.type} onChange={(event) => setCourseForm({ ...courseForm, type: event.target.value })}><option value="core">Core</option><option value="elective">Elective</option></select>
            <input className="field" placeholder="Program" value={courseForm.program} onChange={(event) => setCourseForm({ ...courseForm, program: event.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="number" value={courseForm.capacity} onChange={(event) => setCourseForm({ ...courseForm, capacity: event.target.value })} />
            <input className="field" type="number" value={courseForm.credits} onChange={(event) => setCourseForm({ ...courseForm, credits: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="number" min="1" max="8" value={courseForm.studyYear} onChange={(event) => setCourseForm({ ...courseForm, studyYear: event.target.value })} placeholder="Study year" />
            <input className="field" type="number" min="1" max="3" value={courseForm.semester} onChange={(event) => setCourseForm({ ...courseForm, semester: event.target.value })} placeholder="Semester" />
          </div>
          <input className="field" placeholder="Prerequisites comma-separated" value={courseForm.prerequisites} onChange={(event) => setCourseForm({ ...courseForm, prerequisites: event.target.value })} />
          <select className="field" value={courseForm.instructor} onChange={(event) => setCourseForm({ ...courseForm, instructor: event.target.value })}>
            <option value="">Assign instructor</option>
            {users.filter((user) => ["professor", "TA"].includes(user.role)).map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
          <button className="btn-primary">Create Course</button>
        </form>
        <form className="panel space-y-3" onSubmit={saveStaff}>
          <h2 className="text-xl font-bold">Create Staff Profile</h2>
          <select className="field" value={staffForm.user} onChange={(event) => {
            const selected = users.find((user) => user._id === event.target.value);
            setStaffForm({ ...staffForm, user: event.target.value, fullName: selected?.name || "", email: selected?.email || "" });
          }} required>
            <option value="">Select user</option>
            {users.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.role})</option>)}
          </select>
          <input className="field" placeholder="Full name" value={staffForm.fullName} onChange={(event) => setStaffForm({ ...staffForm, fullName: event.target.value })} required />
          <select className="field" value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}><option value="professor">Professor</option><option value="TA">TA</option><option value="staff">Staff</option></select>
          <input className="field" placeholder="Department" value={staffForm.department} onChange={(event) => setStaffForm({ ...staffForm, department: event.target.value })} required />
          <input className="field" placeholder="Office location" value={staffForm.officeLocation} onChange={(event) => setStaffForm({ ...staffForm, officeLocation: event.target.value })} />
          <input className="field" placeholder="Office hours" value={staffForm.officeHours} onChange={(event) => setStaffForm({ ...staffForm, officeHours: event.target.value })} />
          <button className="btn-primary">Save Staff</button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form className="panel space-y-3" onSubmit={saveAnnouncement}>
          <h2 className="text-xl font-bold">Announcement</h2>
          <input className="field" placeholder="Title" value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} required />
          <input className="field" placeholder="Category" value={announcementForm.category} onChange={(event) => setAnnouncementForm({ ...announcementForm, category: event.target.value })} required />
          <select className="field" value={announcementForm.targetAudience} onChange={(event) => setAnnouncementForm({ ...announcementForm, targetAudience: event.target.value })}><option value="all">All</option><option value="students">Students</option><option value="staff">Staff</option></select>
          <textarea className="field" placeholder="Body" value={announcementForm.body} onChange={(event) => setAnnouncementForm({ ...announcementForm, body: event.target.value })} required />
          <button className="btn-primary">Publish</button>
        </form>
        <form className="panel space-y-3" onSubmit={saveEvent}>
          <h2 className="text-xl font-bold">Event</h2>
          <input className="field" placeholder="Title" value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} required />
          <textarea className="field" placeholder="Description" value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} required />
          <div className="grid grid-cols-2 gap-2"><input className="field" type="date" value={eventForm.date} onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })} required /><input className="field" type="time" value={eventForm.time} onChange={(event) => setEventForm({ ...eventForm, time: event.target.value })} required /></div>
          <input className="field" placeholder="Location" value={eventForm.location} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} required />
          <button className="btn-primary">Create Event</button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h2 className="mb-3 text-xl font-bold">Pending Leave Requests</h2>
          <div className="space-y-3">{leaves.filter((leave) => leave.status === "pending").map((leave) => <div key={leave._id} className="rounded-md border p-3 text-sm"><b>{leave.staff?.name}</b><p>{leave.reason}</p><p>{leave.startDate?.slice(0, 10)} to {leave.endDate?.slice(0, 10)}</p><div className="mt-2 flex gap-2"><button className="btn-primary py-1" onClick={() => updateLeave(leave._id, "approved")}>Approve</button><button className="btn-danger py-1" onClick={() => updateLeave(leave._id, "rejected")}>Reject</button></div></div>)}</div>
        </div>
        <div className="panel">
          <h2 className="mb-3 text-xl font-bold">Transcript Requests</h2>
          <div className="space-y-3">{transcripts.map((request) => <div key={request._id} className="rounded-md border p-3 text-sm"><b>{request.studentId?.name}</b><p className="capitalize">{request.requestStatus || request.status}</p><div className="mt-2 flex flex-wrap gap-2"><button className="btn-primary py-1" onClick={() => generateTranscript(request._id)}>Generate</button>{request.downloadUrl && <a className="btn-secondary py-1" href={`${API_ROOT}${request.downloadUrl}`} target="_blank" rel="noreferrer">Open PDF</a>}</div></div>)}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</section>
      <section className="grid gap-4 md:grid-cols-2">{announcements.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.category} | {item.targetAudience}</p><p className="mt-2 text-sm">{item.body}</p></article>)}{events.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.date} {item.time} | {item.location}</p><p className="mt-2 text-sm">{item.description}</p></article>)}</section>
    </main>
  );
};

export const StudentAcademicPage = () => {
  const { showToast } = useToast();
  const [record, setRecord] = useState(null);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [transcriptRequests, setTranscriptRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  const load = async () => {
    try {
      const [recordRes, coursesRes, gradesRes, assessmentsRes, transcriptsRes, staffRes, announcementsRes, eventsRes] = await Promise.all([
        api.get("/records/me").catch(() => ({ data: { data: null } })),
        api.get("/academic/courses"),
        api.get("/academic/grades"),
        api.get("/academic/assessments"),
        api.get("/transcripts/my"),
        api.get("/staff"),
        api.get("/community/announcements"),
        api.get("/community/events")
      ]);
      setRecord(recordRes.data.data);
      setCourses(coursesRes.data.data);
      setGrades(gradesRes.data.data);
      setAssessments(assessmentsRes.data.data);
      setTranscriptRequests(transcriptsRes.data.data);
      setStaff(staffRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useLoad(load, []);

  const enroll = async (courseId) => {
    try {
      await api.post(`/academic/courses/${courseId}/enroll`);
      showToast("Course selected");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const requestTranscript = async () => {
    try {
      await api.post("/transcripts/request");
      showToast("Transcript requested");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const programName = record?.program || record?.department;
  const programCourses = record ? courses.filter((course) => course.program?.toLowerCase() === programName?.toLowerCase()) : courses;
  const coreCourses = programCourses.filter((course) => course.type === "core");
  const electiveCourses = programCourses.filter((course) => course.type === "elective");
  const enrolledCourseIds = new Set((record?.enrolledCourses || []).map((item) => (item.course?._id || item.course)?.toString()).filter(Boolean));
  const assessmentsByCourse = assessments.reduce((groups, assessment) => {
    const courseId = assessment.course?._id || assessment.course;
    if (!courseId) return groups;
    if (!groups[courseId]) groups[courseId] = [];
    groups[courseId].push(assessment);
    return groups;
  }, {});
  const studyPlanGroups = groupCoursesByStudyPeriod([...programCourses].sort((a, b) => (
    (a.studyYear || 1) - (b.studyYear || 1)
    || (a.semester || 1) - (b.semester || 1)
    || a.courseCode.localeCompare(b.courseCode)
  )));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink">Student Academic Dashboard</h1>
        <button className="btn-primary" onClick={requestTranscript}>Request Transcript</button>
      </div>
      {record && <section className="panel grid gap-3 md:grid-cols-4"><div><span className="text-sm text-slate-500">Name</span><b className="block">{record.fullName || record.name}</b></div><div><span className="text-sm text-slate-500">Program</span><b className="block">{record.program || record.department}</b></div><div><span className="text-sm text-slate-500">Level</span><b className="block">{record.level || record.year}</b></div><div><span className="text-sm text-slate-500">GPA</span><b className="block">{record.GPA ?? record.gpa}</b></div></section>}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel">
          <h2 className="text-xl font-bold">Study Plan</h2>
          <div className="mt-4 space-y-4">
            {Object.entries(studyPlanGroups).map(([period, periodCourses]) => (
              <div key={period} className="rounded-md border border-slate-200 p-3">
                <h3 className="font-semibold text-ink">{period}</h3>
                <div className="mt-2 space-y-2">
                  {periodCourses.map((course) => (
                    <div key={course._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{course.courseCode} - {course.courseName}</span>
                      <span className={`badge ${course.type === "core" ? "bg-slate-100 text-slate-700" : "bg-moss/10 text-moss"}`}>{course.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {programCourses.length === 0 && <p className="text-sm text-slate-500">No study plan courses found for this program.</p>}
          </div>
        </div>
        <div className="panel">
          <h2 className="text-xl font-bold">Transcripts</h2>
          <div className="mt-4 space-y-3">
            {transcriptRequests.map((request) => (
              <div key={request._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="font-semibold capitalize">{request.requestStatus || request.status}</div>
                <div className="text-slate-500">{new Date(request.requestedAt).toLocaleString()}</div>
                {request.downloadUrl ? (
                  <a className="mt-2 inline-flex font-semibold text-moss" href={`${API_ROOT}${request.downloadUrl}`} target="_blank" rel="noreferrer">Download transcript</a>
                ) : (
                  <p className="mt-2 text-slate-500">Waiting for admin generation.</p>
                )}
              </div>
            ))}
            {transcriptRequests.length === 0 && <p className="text-sm text-slate-500">No transcript requests yet.</p>}
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Core Courses</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coreCourses.map((course) => <CourseCard key={course._id} course={course} onEnroll={enroll} isEnrolled={enrolledCourseIds.has(course._id)} assessments={assessmentsByCourse[course._id] || []} />)}
        </div>
        {coreCourses.length === 0 && <p className="text-sm text-slate-500">No core courses found.</p>}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Electives</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {electiveCourses.map((course) => <CourseCard key={course._id} course={course} onEnroll={enroll} isEnrolled={enrolledCourseIds.has(course._id)} assessments={assessmentsByCourse[course._id] || []} />)}
        </div>
        {electiveCourses.length === 0 && <p className="text-sm text-slate-500">No electives found.</p>}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel"><h2 className="mb-3 text-xl font-bold">Grades & Feedback</h2>{grades.map((grade) => <div key={grade._id} className="border-b py-2 text-sm"><b>{grade.course?.courseCode} - {grade.assessment?.title}</b><p>Grade: {grade.grade}</p><p className="text-slate-600">{grade.feedback}</p></div>)}{grades.length === 0 && <p className="text-sm text-slate-500">No grades posted yet.</p>}</div>
        <div className="panel"><h2 className="mb-3 text-xl font-bold">Staff Directory</h2>{staff.map((profile) => <div key={profile._id} className="border-b py-2 text-sm"><b>{profile.fullName}</b><p>{profile.role} | {profile.department}</p><p>{profile.email} | {profile.officeHours}</p></div>)}</div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">{announcements.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm">{item.body}</p></article>)}{events.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.date} {item.time} | {item.location}</p></article>)}</section>
    </main>
  );
};

export const TeachingToolsPage = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [assessmentForm, setAssessmentForm] = useState({ course: "", title: "", type: "exam", date: "", maxMarks: 100 });
  const [gradeForm, setGradeForm] = useState({ student: "", course: "", assessment: "", grade: "", feedback: "" });

  const load = async () => {
    try {
      const [profileRes, coursesRes, assessmentsRes, gradesRes, studentsRes, meetingsRes] = await Promise.all([
        api.get("/staff/me").catch(() => ({ data: { data: null } })),
        api.get("/academic/courses"),
        api.get("/academic/assessments"),
        api.get("/academic/grades"),
        api.get("/records/students"),
        api.get("/community/meetings")
      ]);
      setProfile(profileRes.data.data);
      setCourses(coursesRes.data.data);
      setAssessments(assessmentsRes.data.data);
      setGrades(gradesRes.data.data);
      setStudents(studentsRes.data.data);
      setMeetings(meetingsRes.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useLoad(load, []);
  const assignedCourseIds = useMemo(() => new Set((profile?.assignedCourses || []).map((course) => course._id || course)), [profile]);
  const assignedCourses = courses.filter((course) => assignedCourseIds.has(course._id) || course.instructor?._id === profile?.user);

  const saveAssessment = async (event) => {
    event.preventDefault();
    try {
      await api.post("/academic/assessments", assessmentForm);
      showToast("Assessment created");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const saveGrade = async (event) => {
    event.preventDefault();
    try {
      await api.post("/academic/grades", { ...gradeForm, grade: Number(gradeForm.grade) });
      showToast("Grade saved");
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const updateMeeting = async (id, status) => {
    try {
      await api.put(`/community/meetings/${id}/status`, { status });
      showToast(`Meeting ${status}`);
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Teaching Tools</h1>
      <section className="grid gap-6 lg:grid-cols-2">
        <form className="panel space-y-3" onSubmit={saveAssessment}>
          <h2 className="text-xl font-bold">Create Assessment</h2>
          <select className="field" value={assessmentForm.course} onChange={(event) => setAssessmentForm({ ...assessmentForm, course: event.target.value })} required><option value="">Course</option>{assignedCourses.map((course) => <option key={course._id} value={course._id}>{course.courseCode}</option>)}</select>
          <input className="field" placeholder="Title" value={assessmentForm.title} onChange={(event) => setAssessmentForm({ ...assessmentForm, title: event.target.value })} required />
          <select className="field" value={assessmentForm.type} onChange={(event) => setAssessmentForm({ ...assessmentForm, type: event.target.value })}><option value="exam">Exam</option><option value="assignment">Assignment</option><option value="quiz">Quiz</option></select>
          <div className="grid grid-cols-2 gap-2"><input className="field" type="date" value={assessmentForm.date} onChange={(event) => setAssessmentForm({ ...assessmentForm, date: event.target.value })} required /><input className="field" type="number" value={assessmentForm.maxMarks} onChange={(event) => setAssessmentForm({ ...assessmentForm, maxMarks: event.target.value })} /></div>
          <button className="btn-primary">Create</button>
        </form>
        <form className="panel space-y-3" onSubmit={saveGrade}>
          <h2 className="text-xl font-bold">Assign Grade</h2>
          <select className="field" value={gradeForm.student} onChange={(event) => setGradeForm({ ...gradeForm, student: event.target.value })} required><option value="">Student</option>{students.map((record) => <option key={record._id} value={record.userId?._id}>{record.fullName || record.name}</option>)}</select>
          <select className="field" value={gradeForm.course} onChange={(event) => setGradeForm({ ...gradeForm, course: event.target.value })} required><option value="">Course</option>{assignedCourses.map((course) => <option key={course._id} value={course._id}>{course.courseCode}</option>)}</select>
          <select className="field" value={gradeForm.assessment} onChange={(event) => setGradeForm({ ...gradeForm, assessment: event.target.value })} required><option value="">Assessment</option>{assessments.map((assessment) => <option key={assessment._id} value={assessment._id}>{assessment.title}</option>)}</select>
          <input className="field" type="number" placeholder="Grade" value={gradeForm.grade} onChange={(event) => setGradeForm({ ...gradeForm, grade: event.target.value })} required />
          <textarea className="field" placeholder="Feedback" value={gradeForm.feedback} onChange={(event) => setGradeForm({ ...gradeForm, feedback: event.target.value })} />
          <button className="btn-primary">Save Grade</button>
        </form>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel"><h2 className="mb-3 text-xl font-bold">Meeting Requests</h2>{meetings.map((meeting) => <div key={meeting._id} className="border-b py-2 text-sm"><b>{meeting.student?.name}</b><p>{meeting.date} | {meeting.timeSlot} | {meeting.status}</p><div className="mt-2 flex gap-2"><button className="btn-primary py-1" onClick={() => updateMeeting(meeting._id, "confirmed")}>Confirm</button><button className="btn-danger py-1" onClick={() => updateMeeting(meeting._id, "cancelled")}>Cancel</button></div></div>)}</div>
        <div className="panel"><h2 className="mb-3 text-xl font-bold">Recent Grades</h2>{grades.map((grade) => <div key={grade._id} className="border-b py-2 text-sm"><b>{grade.student?.name}</b><p>{grade.course?.courseCode} | {grade.assessment?.title} | {grade.grade}</p><p>{grade.feedback}</p></div>)}</div>
      </section>
    </main>
  );
};

export const StaffPortalPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "" });

  const load = async () => {
    try {
      const [profileRes, leavesRes, announcementsRes, eventsRes] = await Promise.all([
        api.get("/staff/me").catch(() => ({ data: { data: null } })),
        api.get("/staff/leave"),
        api.get("/community/announcements"),
        api.get("/community/events")
      ]);
      setProfile(profileRes.data.data);
      setLeaves(leavesRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useLoad(load, [user?.id]);

  const submitLeave = async (event) => {
    event.preventDefault();
    try {
      await api.post("/staff/leave", leaveForm);
      showToast("Leave request submitted");
      setLeaveForm({ startDate: "", endDate: "", reason: "" });
      load();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-ink">Staff Portal</h1>
      {profile && <section className="panel"><h2 className="text-xl font-bold">{profile.fullName}</h2><p className="text-sm text-slate-600">{profile.role} | {profile.department} | {profile.officeLocation}</p><p className="mt-2 text-sm">Office hours: {profile.officeHours}</p></section>}
      <section className="grid gap-6 lg:grid-cols-2">
        <form className="panel space-y-3" onSubmit={submitLeave}><h2 className="text-xl font-bold">Leave Request</h2><div className="grid grid-cols-2 gap-2"><input className="field" type="date" value={leaveForm.startDate} onChange={(event) => setLeaveForm({ ...leaveForm, startDate: event.target.value })} required /><input className="field" type="date" value={leaveForm.endDate} onChange={(event) => setLeaveForm({ ...leaveForm, endDate: event.target.value })} required /></div><textarea className="field" placeholder="Reason" value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} required /><button className="btn-primary">Submit</button></form>
        <div className="panel"><h2 className="mb-3 text-xl font-bold">Leave Status</h2>{leaves.map((leave) => <div key={leave._id} className="border-b py-2 text-sm"><b className="capitalize">{leave.status}</b><p>{leave.startDate?.slice(0, 10)} to {leave.endDate?.slice(0, 10)}</p><p>{leave.adminComment}</p></div>)}</div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">{announcements.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="text-sm">{item.body}</p></article>)}{events.map((item) => <article key={item._id} className="panel"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.date} {item.time} | {item.location}</p></article>)}</section>
    </main>
  );
};
