"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";
import { LoginPage } from "@/components/landing/login-page";
import { RegisterPage } from "@/components/landing/register-page";

// Teacher
import { TeacherShell, type TeacherView } from "@/components/dashboard/teacher/teacher-shell";
import { TeacherOverview } from "@/components/dashboard/teacher/views/overview";
import { TeacherSubjects } from "@/components/dashboard/teacher/views/subjects";
import { TeacherStudents } from "@/components/dashboard/teacher/views/students";
import { TeacherMaterials } from "@/components/dashboard/teacher/views/materials";
import { TeacherAttendance } from "@/components/dashboard/teacher/views/attendance";
import { TeacherGrades } from "@/components/dashboard/teacher/views/grades";
import { TeacherAssignments } from "@/components/dashboard/teacher/views/assignments";
import { TeacherMessages } from "@/components/dashboard/teacher/views/messages";
import { TeacherSchedule } from "@/components/dashboard/teacher/views/schedule";
import { TeacherReports } from "@/components/dashboard/teacher/views/reports";
import { TeacherAiReviews } from "@/components/dashboard/teacher/views/ai-reviews";
import { AccountSettings } from "@/components/dashboard/account-settings";

// Student
import { StudentShell, type StudentView } from "@/components/dashboard/student/student-shell";
import { StudentOverview } from "@/components/dashboard/student/views/overview";
import { StudentAITutor } from "@/components/dashboard/student/views/ai-tutor";
import { StudentAIChat } from "@/components/dashboard/student/views/ai-chat";
import { StudentCareer } from "@/components/dashboard/student/views/career";
import { StudentExams } from "@/components/dashboard/student/views/exams";
import { StudentSchedule } from "@/components/dashboard/student/views/schedule";
import { StudentSubmissions } from "@/components/dashboard/student/views/submissions";
import { StudentMaterials } from "@/components/dashboard/student/views/materials";
import { StudentMessages } from "@/components/dashboard/student/views/messages";

// Parent
import { ParentShell, type ParentView } from "@/components/dashboard/parent/parent-shell";
import { ParentOverview } from "@/components/dashboard/parent/views/overview";
import { ParentGrades } from "@/components/dashboard/parent/views/grades";
import { ParentAttendance } from "@/components/dashboard/parent/views/attendance";
import { ParentMessages } from "@/components/dashboard/parent/views/messages";

// Admin
import { AdminShell, type AdminView } from "@/components/dashboard/admin/admin-shell";
import { AdminOverview } from "@/components/dashboard/admin/views/overview";
import { AdminUsers } from "@/components/dashboard/admin/views/users";
import { AdminClasses } from "@/components/dashboard/admin/views/classes";
import { AdminCourses } from "@/components/dashboard/admin/views/courses";
import { AdminStudents } from "@/components/dashboard/admin/views/students";
import { AdminFinance } from "@/components/dashboard/admin/views/finance";
import { AdminUniversities } from "@/components/dashboard/admin/views/universities";
import { AdminExams } from "@/components/dashboard/admin/views/exams";
import { SuperAdminSchools } from "@/components/dashboard/admin/views/schools";
import { AdminReports } from "@/components/dashboard/admin/views/reports";
import { AnnouncementsView } from "@/components/dashboard/announcements-view";
import { MyPaymentsView } from "@/components/dashboard/my-payments-view";
import { authApi, getStoredUser, updateStoredUser, type User } from "@/lib/api";
import { hasFeature, type FeatureKey } from "@/lib/features";

// Төвд асаагаагүй боломжийн дэлгэцийг (хуучин холбоос, хадгалсан төлөвөөр) нээхээс сэргийлнэ.
// Жинхэнэ хамгаалалт backend-д — энэ нь хоосон/алдаатай дэлгэц харуулахгүйн тулд.
const STUDENT_VIEW_FEATURE: Partial<Record<StudentView, FeatureKey>> = {
  "ai-tutor": "ai_tutor",
  "ai-chat": "ai_chat",
  career: "career",
  exams: "public_exams",
};
const TEACHER_VIEW_FEATURE: Partial<Record<TeacherView, FeatureKey>> = {
  "ai-reviews": "ai_tutor",
  subjects: "subjects",
};
const ADMIN_VIEW_FEATURE: Partial<Record<AdminView, FeatureKey>> = {
  universities: "career",
  exams: "public_exams",
};

/** Идэвхтэй дэлгэц нь унтраасан боломжийнх бол нүүр рүү буцаана */
function allowedView<V extends string>(
  user: User,
  current: V,
  map: Partial<Record<V, FeatureKey>>,
): V | "overview" {
  const feature = map[current];
  return feature && !hasFeature(user, feature) ? "overview" : current;
}

type AppView = "landing" | "login" | "register" | "dashboard";

export default function Home() {
  const [view, setView] = useState<AppView>("landing");
  const [user, setUser] = useState<User | null>(null);

  // Teacher view state
  const [teacherViewState, setTeacherView] = useState<TeacherView>("overview");
  // Student view state
  const [studentViewState, setStudentView] = useState<StudentView>("overview");
  // Parent view state
  const [parentView, setParentView] = useState<ParentView>("overview");
  // Admin view state
  const [adminViewState, setAdminView] = useState<AdminView>("overview");

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setView("dashboard");
      // Төвийн тохиргоо (асаасан боломжууд), хэрэглэгчийн нэр зэрэг өөрчлөгдсөн байж
      // болно — серверээс шинэчилнэ. Токен хүчингүй бол api давхарга өөрөө гаргана.
      authApi
        .me()
        .then((fresh) => {
          updateStoredUser(fresh);
          setUser(fresh);
        })
        .catch(() => {});
    }

    const handleLogout = () => {
      setUser(null);
      setView("landing");
    };
    window.addEventListener("educonnect:logout", handleLogout);
    return () => window.removeEventListener("educonnect:logout", handleLogout);
  }, []);

  function handleLogout() {
    setUser(null);
    setView("landing");
  }

  function handleLoginSuccess(u: User) {
    setUser(u);
    setView("dashboard");
  }

  // ── Login page ──
  if (view === "login") {
    return (
      <LoginPage
        onBack={() => setView("landing")}
        onSuccess={handleLoginSuccess}
        onRegister={() => setView("register")}
      />
    );
  }

  // ── Register (төв өөрөө бүртгүүлэх) ──
  if (view === "register") {
    return (
      <RegisterPage
        onBack={() => setView("landing")}
        onSuccess={handleLoginSuccess}
        onLogin={() => setView("login")}
      />
    );
  }

  // ── Dashboard routing by role ──
  if (view === "dashboard" && user) {
    const role = user.role;

    // TEACHER
    if (role === "teacher") {
      const teacherView = allowedView(user, teacherViewState, TEACHER_VIEW_FEATURE);
      return (
        <TeacherShell
          user={user}
          activeView={teacherView}
          onViewChange={setTeacherView}
          onLogout={handleLogout}
        >
          {teacherView === "overview" && <TeacherOverview user={user} />}
          {teacherView === "subjects" && <TeacherSubjects />}
          {teacherView === "students" && <TeacherStudents />}
          {teacherView === "attendance" && <TeacherAttendance />}
          {teacherView === "grades" && <TeacherGrades />}
          {teacherView === "assignments" && <TeacherAssignments />}
          {teacherView === "materials" && <TeacherMaterials />}
          {teacherView === "messages" && <TeacherMessages />}
          {teacherView === "ai-reviews" && <TeacherAiReviews />}
          {teacherView === "schedule" && <TeacherSchedule />}
          {teacherView === "announcements" && <AnnouncementsView />}
          {teacherView === "reports" && <TeacherReports />}
          {teacherView === "settings" && <AccountSettings />}
        </TeacherShell>
      );
    }

    // STUDENT
    if (role === "student") {
      const studentView = allowedView(user, studentViewState, STUDENT_VIEW_FEATURE);
      return (
        <StudentShell
          user={user}
          activeView={studentView}
          onViewChange={setStudentView}
          onLogout={handleLogout}
        >
          {studentView === "overview" && (
            <StudentOverview user={user} onNavigate={setStudentView} />
          )}
          {studentView === "ai-tutor" && <StudentAITutor />}
          {studentView === "ai-chat" && <StudentAIChat />}
          {studentView === "career" && (
            <StudentCareer onNavigate={setStudentView} />
          )}
          {studentView === "exams" && <StudentExams />}
          {studentView === "schedule" && <StudentSchedule />}
          {studentView === "submissions" && <StudentSubmissions />}
          {studentView === "materials" && <StudentMaterials />}
          {studentView === "payments" && <MyPaymentsView />}
          {studentView === "announcements" && <AnnouncementsView />}
          {studentView === "messages" && <StudentMessages />}
          {studentView === "settings" && <AccountSettings />}
        </StudentShell>
      );
    }

    // PARENT
    if (role === "parent") {
      return (
        <ParentShell
          user={user}
          activeView={parentView}
          onViewChange={setParentView}
          onLogout={handleLogout}
        >
          {parentView === "overview" && (
            <ParentOverview user={user} onNavigate={setParentView} />
          )}
          {parentView === "attendance" && <ParentAttendance />}
          {parentView === "grades" && <ParentGrades />}
          {parentView === "messages" && <ParentMessages />}
          {parentView === "payments" && <MyPaymentsView />}
          {parentView === "announcements" && <AnnouncementsView />}
          {parentView === "settings" && <AccountSettings />}
        </ParentShell>
      );
    }

    // ADMIN / SUPER_ADMIN
    if (role === "admin" || role === "super_admin") {
      const adminView = allowedView(user, adminViewState, ADMIN_VIEW_FEATURE);
      return (
        <AdminShell
          user={user}
          activeView={adminView}
          onViewChange={setAdminView}
          onLogout={handleLogout}
        >
          {adminView === "overview" && (
            <AdminOverview user={user} onNavigate={setAdminView} />
          )}
          {adminView === "schools" && <SuperAdminSchools />}
          {adminView === "users" && <AdminUsers currentUser={user} />}
          {adminView === "courses" && <AdminCourses />}
          {adminView === "classes" && <AdminClasses />}
          {adminView === "students" && <AdminStudents />}
          {adminView === "finance" && <AdminFinance />}
          {adminView === "universities" && <AdminUniversities />}
          {adminView === "exams" && <AdminExams />}
          {adminView === "announcements" && <AnnouncementsView />}
          {adminView === "reports" && <AdminReports />}
          {adminView === "settings" && <AccountSettings />}
        </AdminShell>
      );
    }
  }

  // ── Landing page ──
  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogin={() => setView("login")} onRegister={() => setView("register")} />
      <main className="flex-1">
        <Hero onLogin={() => setView("login")} onRegister={() => setView("register")} />
        <Features />
        <HowItWorks />
        <Pricing onRegister={() => setView("register")} />
      </main>
      <Footer />
    </div>
  );
}
