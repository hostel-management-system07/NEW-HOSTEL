
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  User,
  Calendar,
  Home,
} from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  updatedAt: any;
  response?: string;
}

const AdminComplaints = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const complaintsRef = collection(db, "complaints");
    const complaintsQuery = query(complaintsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(complaintsQuery, (snapshot) => {
      const complaintsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Calculate statistics
    const pendingCount = complaints.filter(c => c.status === 'pending').length;
    const inProgressCount = complaints.filter(c => c.status === 'in-progress').length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
    const highPriorityCount = complaints.filter(c => c.priority === 'high').length;

    setStats({
      total: complaints.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      highPriority: highPriorityCount
    });
  }, [complaints]);

  useEffect(() => {
    // Apply filters
    let filtered = [...complaints];

    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const handleStatusChange = async (complaintId: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // If marking as resolved and there's a response, send a notification to the student
      if (newStatus === 'resolved' && selectedComplaint) {
        const complaint = complaints.find(c => c.id === complaintId);
        if (complaint) {
          await addDoc(collection(db, "notifications"), {
            title: "Complaint Resolved",
            message: `Your complaint "${complaint.title}" has been resolved.`,
            type: "success",
            timestamp: serverTimestamp(),
            read: false,
            target: complaint.studentId,
            sender: "Admin"
          });
        }
      }
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update status");
    }
  };

  const handlePriorityChange = async (complaintId: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, {
        priority: newPriority,
        updatedAt: serverTimestamp()
      });
      toast.success(`Priority updated to ${newPriority}`);
    } catch (error) {
      console.error("Error updating complaint priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint || !response.trim()) return;

    try {
      const complaintRef = doc(db, "complaints", selectedComplaint.id);
      await updateDoc(complaintRef, {
        response: response,
        status: 'resolved',
        updatedAt: serverTimestamp()
      });

      // Send notification to student
      await addDoc(collection(db, "notifications"), {
        title: "Response to your complaint",
        message: `Your complaint "${selectedComplaint.title}" has been addressed with the following response: "${response}"`,
        type: "info",
        timestamp: serverTimestamp(),
        read: false,
        target: selectedComplaint.studentId,
        sender: "Admin"
      });

      setResponse("");
      setSelectedComplaint(null);
      toast.success("Response sent and complaint resolved");
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error("Failed to send response");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-500">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-500">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Complaints Management</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-gray-500">Total Complaints</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.highPriority}</div>
                <p className="text-sm text-gray-500">High Priority</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search complaints..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <MessageSquare className="h-10 w-10 text-gray-400 mb-4" />
                <p className="text-lg text-gray-500">No complaints found</p>
              </CardContent>
            </Card>
          ) : (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{complaint.title}</CardTitle>
                      <CardDescription>
                        {new Date(complaint.createdAt?.toDate()).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">{complaint.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        {complaint.studentName}
                      </div>
                      <div className="flex items-center">
                        <Home className="mr-1 h-4 w-4" />
                        Room {complaint.roomNumber}
                      </div>
                    </div>
                    {complaint.response && (
                      <div className="bg-gray-50 p-3 rounded-md mt-3">
                        <p className="text-sm font-medium">Admin Response:</p>
                        <p className="text-sm">{complaint.response}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-between gap-2 pt-1">
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => handleStatusChange(complaint.id, value as 'pending' | 'in-progress' | 'resolved')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Mark as Pending</SelectItem>
                        <SelectItem value="in-progress">Mark as In Progress</SelectItem>
                        <SelectItem value="resolved">Mark as Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handlePriorityChange(complaint.id, value as 'low' | 'medium' | 'high')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Update Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    Respond
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
        
        {/* Response Dialog */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Respond to Complaint</CardTitle>
                <CardDescription>
                  {selectedComplaint.title} - {selectedComplaint.studentName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type your response here..."
                  className="min-h-[120px]"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                <Button onClick={handleSubmitResponse}>Send Response</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminComplaints;
