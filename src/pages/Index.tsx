
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (currentUser) {
      // Redirect based on user role
      if (currentUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } else {
      navigate("/login");
    }
  }, [currentUser, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">AI Hostel Connect</h1>
        <p className="text-xl text-gray-600">Redirecting you to the right place...</p>
      </div>
    </div>
  );
};

export default Index;
