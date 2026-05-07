import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Room from "./models/Room.js";
import Booking from "./models/Booking.js";
import Issue from "./models/Issue.js";
import Notification from "./models/Notification.js";
import StudentRecord from "./models/StudentRecord.js";
import Application from "./models/Application.js";
import TranscriptRequest from "./models/TranscriptRequest.js";
import Course from "./models/Course.js";
import Assessment from "./models/Assessment.js";
import Grade from "./models/Grade.js";
import StaffProfile from "./models/StaffProfile.js";
import LeaveRequest from "./models/LeaveRequest.js";
import Message from "./models/Message.js";
import ForumPost from "./models/ForumPost.js";
import Meeting from "./models/Meeting.js";
import Announcement from "./models/Announcement.js";
import Event from "./models/Event.js";

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Booking.deleteMany({}),
    Issue.deleteMany({}),
    Notification.deleteMany({}),
    StudentRecord.deleteMany({}),
    Application.deleteMany({}),
    TranscriptRequest.deleteMany({}),
    Course.deleteMany({}),
    Assessment.deleteMany({}),
    Grade.deleteMany({}),
    StaffProfile.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Message.deleteMany({}),
    ForumPost.deleteMany({}),
    Meeting.deleteMany({}),
    Announcement.deleteMany({}),
    Event.deleteMany({})
  ]);

  const [admin, studentOne, studentTwo, professor, ta, staff] = await User.create([
    {
      name: "Admin User",
      email: "admin@university.edu",
      password: "password123",
      role: "admin"
    },
    {
      name: "Maya Hassan",
      email: "maya@student.edu",
      password: "password123",
      role: "student"
    },
    {
      name: "Omar Adel",
      email: "omar@student.edu",
      password: "password123",
      role: "student"
    },
    {
      name: "Dr. Lina Fathy",
      email: "lina@university.edu",
      password: "password123",
      role: "professor"
    },
    {
      name: "Nour Samir",
      email: "nour.ta@university.edu",
      password: "password123",
      role: "TA"
    },
    {
      name: "Salma Nabil",
      email: "salma.staff@university.edu",
      password: "password123",
      role: "staff"
    }
  ]);

  const rooms = await Room.create([
    {
      name: "A101 Lecture Hall",
      type: "classroom",
      capacity: 120,
      location: "Main Building, Floor 1",
      facilities: ["Accessible seating", "Air conditioning", "Whiteboard"],
      equipment: ["Projector", "Microphone", "Speakers"],
      images: ["https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"]
    },
    {
      name: "B204 Seminar Room",
      type: "classroom",
      capacity: 35,
      location: "Business Building, Floor 2",
      facilities: ["Flexible seating", "Smart board"],
      equipment: ["Display", "Video conferencing"],
      images: ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80"]
    },
    {
      name: "C310 Computer Lab",
      type: "lab",
      capacity: 48,
      location: "Computing Center, Floor 3",
      facilities: ["Networked workstations", "Air conditioning"],
      equipment: ["Computers", "Projector", "3D printer"],
      images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"]
    },
    {
      name: "D112 Physics Lab",
      type: "lab",
      capacity: 28,
      location: "Science Building, Floor 1",
      facilities: ["Lab benches", "Safety shower", "Ventilation"],
      equipment: ["Oscilloscopes", "Sensors", "Projector"],
      images: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80"]
    },
    {
      name: "E220 Chemistry Lab",
      type: "lab",
      capacity: 24,
      location: "Science Building, Floor 2",
      facilities: ["Fume hoods", "Chemical storage", "Safety stations"],
      equipment: ["Glassware", "Balances", "Spectrometer"],
      images: ["https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=900&q=80"]
    }
  ]);

  const courses = await Course.create([
    {
      courseCode: "CS301",
      courseName: "Software Engineering",
      type: "core",
      program: "Computer Science",
      capacity: 40,
      enrolledStudents: [studentOne._id],
      prerequisites: [],
      instructor: professor._id,
      assignedTAs: [ta._id],
      credits: 3,
      studyYear: 3,
      semester: 1
    },
    {
      courseCode: "CS330",
      courseName: "Databases",
      type: "core",
      program: "Computer Science",
      capacity: 35,
      enrolledStudents: [studentOne._id],
      prerequisites: ["CS301"],
      instructor: professor._id,
      assignedTAs: [ta._id],
      credits: 3,
      studyYear: 3,
      semester: 2
    },
    {
      courseCode: "CS355",
      courseName: "Human Computer Interaction",
      type: "elective",
      program: "Computer Science",
      capacity: 25,
      enrolledStudents: [],
      prerequisites: ["CS301"],
      instructor: professor._id,
      assignedTAs: [],
      credits: 3,
      studyYear: 4,
      semester: 1
    },
    {
      courseCode: "CS101",
      courseName: "Programming Fundamentals",
      type: "core",
      program: "Computer Science",
      capacity: 45,
      enrolledStudents: [],
      prerequisites: [],
      instructor: professor._id,
      assignedTAs: [ta._id],
      credits: 3,
      studyYear: 1,
      semester: 1
    },
    {
      courseCode: "CS220",
      courseName: "Data Structures",
      type: "core",
      program: "Computer Science",
      capacity: 40,
      enrolledStudents: [],
      prerequisites: ["CS101"],
      instructor: professor._id,
      assignedTAs: [ta._id],
      credits: 3,
      studyYear: 2,
      semester: 1
    },
    {
      courseCode: "CS410",
      courseName: "Cloud Computing",
      type: "elective",
      program: "Computer Science",
      capacity: 25,
      enrolledStudents: [],
      prerequisites: ["CS330"],
      instructor: professor._id,
      assignedTAs: [],
      credits: 3,
      studyYear: 4,
      semester: 2
    },
    {
      courseCode: "IS210",
      courseName: "Systems Analysis",
      type: "core",
      program: "Information Systems",
      capacity: 30,
      enrolledStudents: [studentTwo._id],
      prerequisites: [],
      instructor: professor._id,
      assignedTAs: [ta._id],
      credits: 3,
      studyYear: 2,
      semester: 1
    }
  ]);

  await Booking.create([
    {
      roomId: rooms[0]._id,
      userId: admin._id,
      date: "2026-05-04",
      startTime: "09:00",
      endTime: "11:00",
      purpose: "Faculty orientation",
      status: "approved"
    },
    {
      roomId: rooms[2]._id,
      userId: studentOne._id,
      date: "2026-05-05",
      startTime: "13:00",
      endTime: "15:00",
      purpose: "Software engineering lab practice",
      status: "pending"
    },
    {
      roomId: rooms[1]._id,
      userId: studentTwo._id,
      date: "2026-05-06",
      startTime: "10:00",
      endTime: "12:00",
      purpose: "Study group",
      status: "rejected"
    }
  ]);

  await StudentRecord.create([
    {
      userId: studentOne._id,
      studentId: "STU-2026-001",
      fullName: studentOne.name,
      name: studentOne.name,
      email: studentOne.email,
      program: "Computer Science",
      department: "Computer Science",
      level: 3,
      year: 3,
      GPA: 3.72,
      gpa: 3.72,
      enrolledCourses: [
        { course: courses[0]._id, courseCode: courses[0].courseCode, courseName: courses[0].courseName, type: courses[0].type, grade: "A", credits: 3 },
        { course: courses[1]._id, courseCode: courses[1].courseCode, courseName: courses[1].courseName, type: courses[1].type, grade: "A-", credits: 3 }
      ],
      courses: [
        { code: "CS301", title: "Software Engineering", grade: "A", credits: 3 },
        { code: "CS330", title: "Databases", grade: "A-", credits: 3 },
        { code: "MATH240", title: "Statistics", grade: "B+", credits: 3 }
      ],
      academicStatus: "active",
      contactInfo: { phone: "01010000001", address: "Cairo", emergencyContact: "01010000002" },
      enrollmentDate: new Date("2023-09-01")
    },
    {
      userId: studentTwo._id,
      studentId: "STU-2026-002",
      fullName: studentTwo.name,
      name: studentTwo.name,
      email: studentTwo.email,
      program: "Information Systems",
      department: "Information Systems",
      level: 2,
      year: 2,
      GPA: 3.45,
      gpa: 3.45,
      enrolledCourses: [
        { course: courses[6]._id, courseCode: courses[6].courseCode, courseName: courses[6].courseName, type: courses[6].type, grade: "B+", credits: 3 }
      ],
      courses: [
        { code: "IS210", title: "Systems Analysis", grade: "B+", credits: 3 },
        { code: "IS220", title: "Business Process Modeling", grade: "A-", credits: 3 }
      ],
      academicStatus: "active",
      contactInfo: { phone: "01020000001", address: "Giza", emergencyContact: "01020000002" },
      enrollmentDate: new Date("2024-09-01")
    }
  ]);

  await StaffProfile.create([
    {
      user: professor._id,
      fullName: professor.name,
      role: "professor",
      email: professor.email,
      phone: "01030000001",
      department: "Computer Science",
      officeLocation: "C-204",
      officeHours: "Sun/Tue 10:00-12:00",
      assignedCourses: courses.map((course) => course._id),
      hrData: { title: "Associate Professor", employmentType: "Full-time", salaryBand: "P3" }
    },
    {
      user: ta._id,
      fullName: ta.name,
      role: "TA",
      email: ta.email,
      phone: "01030000002",
      department: "Computer Science",
      officeLocation: "C-118",
      officeHours: "Mon/Wed 13:00-15:00",
      assignedCourses: [courses[0]._id, courses[1]._id, courses[3]._id, courses[4]._id],
      hrData: { title: "Teaching Assistant", employmentType: "Part-time", salaryBand: "T1" }
    },
    {
      user: staff._id,
      fullName: staff.name,
      role: "staff",
      email: staff.email,
      phone: "01030000003",
      department: "Registrar",
      officeLocation: "Admin-101",
      officeHours: "Sun-Thu 09:00-15:00",
      assignedCourses: [],
      hrData: { title: "Registrar Officer", employmentType: "Full-time", salaryBand: "S2" }
    }
  ]);

  const [assessment] = await Assessment.create([
    {
      course: courses[0]._id,
      title: "Midterm Exam",
      type: "exam",
      date: new Date("2026-05-20"),
      maxMarks: 100,
      createdBy: professor._id
    },
    {
      course: courses[0]._id,
      title: "Requirements Quiz",
      type: "quiz",
      date: new Date("2026-05-12"),
      maxMarks: 20,
      createdBy: professor._id
    },
    {
      course: courses[1]._id,
      title: "SQL Assignment",
      type: "assignment",
      date: new Date("2026-05-18"),
      maxMarks: 50,
      createdBy: professor._id
    }
  ]);

  await Grade.create({
    student: studentOne._id,
    course: courses[0]._id,
    assessment: assessment._id,
    grade: 92,
    feedback: "Strong requirements analysis and clean diagrams.",
    professor: professor._id
  });

  await LeaveRequest.create({
    staff: staff._id,
    startDate: new Date("2026-05-15"),
    endDate: new Date("2026-05-16"),
    reason: "Family commitment"
  });

  await Announcement.create({
    title: "Spring advising opens",
    body: "Students can meet assigned academic staff during office hours this week.",
    category: "Advising",
    targetAudience: "students",
    createdBy: admin._id
  });

  await Event.create({
    title: "Research Poster Day",
    description: "Students and academic staff present course and capstone projects.",
    date: "2026-05-22",
    time: "11:00",
    location: "Main Hall",
    createdBy: admin._id
  });

  await Notification.create({
    userId: studentOne._id,
    title: "Welcome",
    message: "Your student dashboard is ready."
  });

  console.log("Seed completed");
  console.log("Admin: admin@university.edu / password123");
  console.log("Student: maya@student.edu / password123");
  console.log("Professor: lina@university.edu / password123");
  console.log("TA: nour.ta@university.edu / password123");
  console.log("Staff: salma.staff@university.edu / password123");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
