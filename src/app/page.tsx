"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
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
import { AccountSettings } from "@/components/dashboard/account-settings";

// Student
import { StudentShell, type StudentView } from "@/components/dashboard/student/student-shell";
import { StudentOverview } from "@/components/dashboard/student/views/overview";
import { StudentAITutor } from "@/components/dashboard/student/views/ai-tutor";
import { StudentAIChat } from "@/components/dashboard/student/views/ai-chat";
import { StudentCareer } from "@/components/dashboard/student/views/career";
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
import { SuperAdminSchools } from "@/components/dashboard/admin/views/schools";
import { AdminReports } from "@/components/dashboard/admin/views/reports";
import { AnnouncementsView } from "@/components/dashboard/announcements-view";
import { getStoredUser, type User } from "@/lib/api";

type AppView = "landing" | "login" | "register" | "dashboard";

export default function Home() {
  const [view, setView] = useState<AppView>("landing");
  const [user, setUser] = useState<User | null>(null);

  // Teacher view state
  const [teacherView, setTeacherView] = useState<TeacherView>("overview");
  // Student view state
  const [studentView, setStudentView] = useState<StudentView>("overview");
  // Parent view state
  const [parentView, setParentView] = useState<ParentView>("overview");
  // Admin view state
  const [adminView, setAdminView] = useState<AdminView>("overview");

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setView("dashboard");
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

  // ── Register (сургууль өөрөө бүртгүүлэх) ──
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
          {teacherView === "schedule" && <TeacherSchedule />}
          {teacherView === "announcements" && <AnnouncementsView />}
          {teacherView === "reports" && <TeacherReports />}
          {teacherView === "settings" && <AccountSettings />}
        </TeacherShell>
      );
    }

    // STUDENT
    if (role === "student") {
      return (
        <StudentShell
          user={user}
          activeView={studentView}
          onViewChange={setStudentView}
          onLogout={handleLogout}
          unreadNotifications={0}
        >
          {studentView === "overview" && (
            <StudentOverview user={user} onNavigate={setStudentView} />
          )}
          {studentView === "ai-tutor" && <StudentAITutor />}
          {studentView === "ai-chat" && <StudentAIChat />}
          {studentView === "career" && <StudentCareer />}
          {studentView === "schedule" && <StudentSchedule />}
          {studentView === "submissions" && <StudentSubmissions />}
          {studentView === "materials" && <StudentMaterials />}
          {studentView === "announcements" && <AnnouncementsView />}
          {studentView === "messages" && <StudentMessages />}
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
          unreadNotifications={0}
        >
          {parentView === "overview" && (
            <ParentOverview user={user} onNavigate={setParentView} />
          )}
          {parentView === "attendance" && <ParentAttendance />}
          {parentView === "grades" && <ParentGrades />}
          {parentView === "messages" && <ParentMessages />}
          {parentView === "announcements" && <AnnouncementsView />}
        </ParentShell>
      );
    }

    // ADMIN / SUPER_ADMIN
    if (role === "admin" || role === "super_admin") {
      return (
        <AdminShell
          user={user}
          activeView={adminView}
          onViewChange={setAdminView}
          onLogout={handleLogout}
          unreadNotifications={0}
        >
          {adminView === "overview" && (
            <AdminOverview user={user} onNavigate={setAdminView} />
          )}
          {adminView === "schools" && <SuperAdminSchools />}
          {adminView === "users" && <AdminUsers />}
          {adminView === "classes" && <AdminClasses />}
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
      <Header onLogin={() => setView("login")} />
      <main className="flex-1">
        <Hero onLogin={() => setView("login")} />
        <Features />
        <Pricing onLogin={() => setView("login")} />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
