import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Authentication Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import BookRoom from "./pages/student/BookRoom";
import StudentFees from "./pages/student/StudentFees";
import StudentComplaints from "./pages/student/StudentComplaints";
import StudentProfile from "./pages/student/StudentProfile";
import StudentSecurity from "./pages/student/StudentSecurity";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentHelp from "./pages/student/StudentHelp";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminFees from "./pages/admin/AdminFees";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/book-room" 
              element={
                <PrivateRoute requiredRole="student">
                  <BookRoom />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/fees" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentFees />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/complaints" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentComplaints />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/security" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentSecurity />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/notifications" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentNotifications />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/help" 
              element={
                <PrivateRoute requiredRole="student">
                  <StudentHelp />
                </PrivateRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/rooms" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminRooms />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/students" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminStudents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/fees" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminFees />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/complaints" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminComplaints />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/security" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminSecurity />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/notifications" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminNotifications />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminSettings />
                </PrivateRoute>
              } 
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
