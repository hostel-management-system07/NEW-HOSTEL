
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/layouts/StudentLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoorOpenIcon, FileTextIcon, MessageSquareIcon, AlertTriangleIcon } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ChatBot from "../../components/ChatBot";

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [pendingFees, setPendingFees] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;

      try {
        // Check if student has a room
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        if (userData?.roomId) {
          const roomDocRef = doc(db, "rooms", userData.roomId);
          const roomDoc = await getDoc(roomDocRef);
          if (roomDoc.exists()) {
            setRoomInfo(roomDoc.data());
          }
        }

        // Get pending fees
        const feesQuery = query(
          collection(db, "fees"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        const feesSnapshot = await getDocs(feesQuery);
        setPendingFees(feesSnapshot.size);

        // Get pending complaints
        const complaintsQuery = query(
          collection(db, "complaints"),
          where("userId", "==", currentUser.uid),
          where("status", "in", ["pending", "in-progress"])
        );
        const complaintsSnapshot = await getDocs(complaintsQuery);
        setPendingComplaints(complaintsSnapshot.size);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {currentUser?.displayName}</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your hostel account.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => navigate("/student/help")}>Need Help?</Button>
          </div>
        </div>

        {/* Room Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DoorOpenIcon className="mr-2 h-5 w-5" />
              Room Information
            </CardTitle>
            <CardDescription>Your current room details</CardDescription>
          </CardHeader>
          <CardContent>
            {roomInfo ? (
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Room Number:</span> {roomInfo.number}
                </p>
                <p>
                  <span className="font-semibold">Floor:</span> {roomInfo.floor}
                </p>
                <p>
                  <span className="font-semibold">Type:</span> {roomInfo.type}
                </p>
                <p>
                  <span className="font-semibold">Capacity:</span> {roomInfo.capacity}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-amber-600">You don't have a room assigned yet.</p>
                <Button onClick={() => navigate("/student/book-room")}>
                  Request a Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fee Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingFees > 0 ? (
                <div className="space-y-2">
                  <p className="text-red-500 font-medium">
                    You have {pendingFees} pending payment{pendingFees > 1 ? "s" : ""}
                  </p>
                  <Button variant="outline" onClick={() => navigate("/student/fees")}>
                    View Details
                  </Button>
                </div>
              ) : (
                <p className="text-green-600">All payments are up to date!</p>
              )}
            </CardContent>
          </Card>

          {/* Complaints */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingComplaints > 0 ? (
                <div className="space-y-2">
                  <p>
                    You have {pendingComplaints} active complaint{pendingComplaints > 1 ? "s" : ""}
                  </p>
                  <Button variant="outline" onClick={() => navigate("/student/complaints")}>
                    View Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>No active complaints</p>
                  <Button variant="outline" onClick={() => navigate("/student/complaints")}>
                    Submit Issue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Notices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <AlertTriangleIcon className="mr-2 h-4 w-4" />
                Important Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Maintenance scheduled for water pipes on 6th April, 2:00-5:00 PM</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatBot />
    </StudentLayout>
  );
};

export default StudentDashboard;
