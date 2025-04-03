import { useState, useEffect } from "react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Building2, 
  Users, 
  DoorOpen, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  UserX
} from "lucide-react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ChatBot from "../../components/ChatBot";

// Define color constants
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

// Define proper interfaces for Firestore documents
interface RoomData {
  id: string;
  status: string;
  number?: string;
  floor?: string;
  type?: string;
  capacity?: number;
}

interface FeeData {
  id: string;
  amount: number;
  status: string;
  dueDate?: string;
  userId?: string;
}

interface ComplaintData {
  id: string;
  status: string;
  priority: string;
  issue?: string;
  userId?: string;
  roomId?: string;
  createdAt?: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalFees: 0,
    paidFees: 0,
    pendingFees: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    highPriorityComplaints: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch students
        const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
        const studentsSnapshot = await getDocs(studentsQuery);
        const totalStudents = studentsSnapshot.size;

        // Fetch rooms
        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const rooms: RoomData[] = roomsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RoomData));
        
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(room => room.status === "occupied").length;
        const availableRooms = rooms.filter(room => room.status === "available").length;

        // Fetch fees
        const feesSnapshot = await getDocs(collection(db, "fees"));
        const fees: FeeData[] = feesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FeeData));
        
        const totalFees = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        const paidFees = fees
          .filter(fee => fee.status === "paid")
          .reduce((sum, fee) => sum + (fee.amount || 0), 0);
        const pendingFees = totalFees - paidFees;

        // Fetch complaints
        const complaintsSnapshot = await getDocs(collection(db, "complaints"));
        const complaints: ComplaintData[] = complaintsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ComplaintData));
        
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(complaint => complaint.status === "resolved").length;
        const pendingComplaints = complaints.filter(complaint => complaint.status === "pending").length;
        const highPriorityComplaints = complaints.filter(complaint => complaint.priority === "high").length;

        setStats({
          totalStudents,
          totalRooms,
          occupiedRooms,
          availableRooms,
          totalFees,
          paidFees,
          pendingFees,
          totalComplaints,
          resolvedComplaints,
          pendingComplaints,
          highPriorityComplaints
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Data for room occupancy chart
  const roomData = [
    { name: "Occupied", value: stats.occupiedRooms },
    { name: "Available", value: stats.availableRooms }
  ];

  // Data for fee status chart
  const feeData = [
    { name: "Paid", value: stats.paidFees },
    { name: "Pending", value: stats.pendingFees }
  ];

  // Data for complaint status chart
  const complaintData = [
    { name: "Resolved", value: stats.resolvedComplaints },
    { name: "Pending", value: stats.pendingComplaints },
    { name: "High Priority", value: stats.highPriorityComplaints }
  ];

  // Monthly occupancy data (mock data for demonstration)
  const monthlyOccupancyData = [
    { name: "Jan", occupied: 20, available: 10 },
    { name: "Feb", occupied: 25, available: 5 },
    { name: "Mar", occupied: 27, available: 3 },
    { name: "Apr", occupied: 30, available: 0 },
    { name: "May", occupied: 28, available: 2 },
    { name: "Jun", occupied: 26, available: 4 }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your hostel management system
          </p>
        </div>

        {/* Important Alerts */}
        {stats.highPriorityComplaints > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              There are {stats.highPriorityComplaints} high priority complaints that need your immediate attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rooms</CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <p className="text-xs text-muted-foreground">
                {stats.occupiedRooms} occupied, {stats.availableRooms} available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.paidFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ₹{stats.pendingFees.toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComplaints}</div>
              <p className="text-xs text-muted-foreground">
                {stats.resolvedComplaints} resolved, {stats.pendingComplaints} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Statistics</CardTitle>
                  <CardDescription>Current student allocation</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="flex h-full items-center justify-center">
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'With Room', value: stats.occupiedRooms },
                              { name: 'Without Room', value: stats.totalStudents - stats.occupiedRooms }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#8884d8" />
                            <Cell fill="#82ca9d" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Room Status</CardTitle>
                  <CardDescription>Current room occupancy</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="flex h-full items-center justify-center">
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={roomData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {roomData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Occupancy Trend</CardTitle>
                <CardDescription>Monthly room occupancy statistics</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyOccupancyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupied" stackId="a" fill="#8884d8" name="Occupied Rooms" />
                    <Bar dataKey="available" stackId="a" fill="#82ca9d" name="Available Rooms" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Status</CardTitle>
                <CardDescription>Current fee payment statistics</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#82ca9d" />
                          <Cell fill="#ffc658" />
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complaints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Status</CardTitle>
                <CardDescription>Overview of complaint resolution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={complaintData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#82ca9d" /> {/* Resolved */}
                          <Cell fill="#ffc658" /> {/* Pending */}
                          <Cell fill="#ff8042" /> {/* High Priority */}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and events in your hostel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-blue-50">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">New Student Registration</p>
                  <p className="text-sm text-muted-foreground">John Smith registered as a new student</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-green-50">
                  <FileText className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Fee Payment</p>
                  <p className="text-sm text-muted-foreground">Maria Johnson paid ₹15,000 for room fees</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">High Priority Complaint</p>
                  <p className="text-sm text-muted-foreground">Water leakage reported in Room 203</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-purple-50">
                  <DoorOpen className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Room Allocation</p>
                  <p className="text-sm text-muted-foreground">Room 105 assigned to David Brown</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatBot />
    </AdminLayout>
  );
};

export default AdminDashboard;
