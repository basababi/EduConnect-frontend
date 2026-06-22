"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";
import { LoginPage } from "@/components/landing/login-page";

// Teacher
import { TeacherShell, type TeacherView } from "@/components/dashboard/teacher/teacher-shell";
import { TeacherOverview } from "@/components/dashboard/teacher/views/overview";
import { TeacherAttendance } from "@/components/dashboard/teacher/views/attendance";
import { TeacherGrades } from "@/components/dashboard/teacher/views/grades";
import { TeacherAssignments } from "@/components/dashboard/teacher/views/assignments";
import { TeacherMessages } from "@/components/dashboard/teacher/views/messages";
import { TeacherSchedule } from "@/components/dashboard/teacher/views/schedule";
import { TeacherReports } from "@/components/dashboard/teacher/views/reports";
import { TeacherSettings } from "@/components/dashboard/teacher/views/settings";

// Student
import { StudentShell, type StudentView } from "@/components/dashboard/student/student-shell";
import { StudentOverview } from "@/components/dashboard/student/views/overview";
import { StudentAITutor } from "@/components/dashboard/student/views/ai-tutor";
import { StudentWellbeing } from "@/components/dashboard/student/views/wellbeing";
import { StudentCareer } from "@/components/dashboard/student/views/career";

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
import { getStoredUser, type User } from "@/lib/api";

type AppView = "landing" | "login" | "dashboard";

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
          unreadMessages={4}
          unreadNotifications={2}
        >
          {teacherView === "overview" && <TeacherOverview user={user} />}
          {teacherView === "attendance" && <TeacherAttendance />}
          {teacherView === "grades" && <TeacherGrades />}
          {teacherView === "assignments" && <TeacherAssignments />}
          {teacherView === "messages" && <TeacherMessages />}
          {teacherView === "schedule" && <TeacherSchedule />}
          {teacherView === "reports" && <TeacherReports />}
          {teacherView === "settings" && <TeacherSettings />}
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
          {studentView === "ai-tutor" && <StudentAITutor user={user} />}
          {studentView === "wellbeing" && <StudentWellbeing />}
          {studentView === "career" && <StudentCareer user={user} />}
          {studentView === "schedule" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-[#1B2B4B] mb-2">Хуваарь</h1>
              <p className="text-gray-500 text-sm">Хичээлийн хуваарь удахгүй нэмэгдэнэ.</p>
            </div>
          )}
          {studentView === "messages" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-[#1B2B4B] mb-2">Мессеж</h1>
              <p className="text-gray-500 text-sm">Багштай харилцах хэсэг удахгүй нэмэгдэнэ.</p>
            </div>
          )}
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
          {adminView === "users" && <AdminUsers />}
          {adminView === "classes" && <AdminClasses />}
          {adminView === "reports" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-[#1B2B4B] mb-2">Тайлан</h1>
              <p className="text-gray-500 text-sm">Тайлангийн хэсэг удахгүй нэмэгдэнэ.</p>
            </div>
          )}
          {adminView === "settings" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold text-[#1B2B4B] mb-2">Тохиргоо</h1>
              <p className="text-gray-500 text-sm">Сургуулийн тохиргооны хэсэг удахгүй нэмэгдэнэ.</p>
            </div>
          )}
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
