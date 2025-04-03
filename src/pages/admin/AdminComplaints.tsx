
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, getDocs, doc, updateDoc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Clock, MessageSquare, UserCheck } from "lucide-react";

interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  issue: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "resolved";
  createdAt: any;
  assignedTo?: string;
  resolvedAt?: any;
  notes?: string;
}

const AdminComplaints = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0
  });

  useEffect(() => {
    async function fetchComplaints() {
      if (!currentUser) return;

      try {
        const complaintsSnapshot = await getDocs(collection(db, "complaints"));
        const complaintsList = complaintsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Complaint[];
        
        // Sort complaints by priority and date
        complaintsList.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        
        setComplaints(complaintsList);
        
        // Calculate complaint statistics
        const stats = {
          total: complaintsList.length,
          pending: complaintsList.filter(c => c.status === "pending").length,
          inProgress: complaintsList.filter(c => c.status === "in_progress").length,
          resolved: complaintsList.filter(c => c.status === "resolved").length,
          highPriority: complaintsList.filter(c => c.priority === "high").length
        };
        
        setComplaintStats(stats);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to load complaints");
        setLoading(false);
      }
    }
    
    fetchComplaints();
  }, [currentUser]);

  const assignComplaint = async () => {
    if (!selectedComplaintId || !assigneeName) {
      toast.error("Please enter the assignee name");
      return;
    }

    try {
      await updateDoc(doc(db, "complaints", selectedComplaintId), {
        status: "in_progress",
        assignedTo: assigneeName
      });
      
      // Get the complaint details to send notification to student
      const complaintDoc = await getDoc(doc(db, "complaints", selectedComplaintId));
      const complaintData = complaintDoc.data() as Complaint;
      
      // Create notification for the student
      await addDoc(collection(db, "notifications"), {
        title: "Complaint Update",
        message: `Your complaint regarding "${complaintData.issue}" has been assigned to ${assigneeName} and is now being processed.`,
        type: "info",
        timestamp: new Date(),
        read: false,
        target: complaintData.studentId,
        sender: currentUser?.displayName || "Admin"
      });
      
      // Update local state
      setComplaints(prevComplaints => 
        prevComplaints.map(complaint => 
          complaint.id === selectedComplaintId 
            ? { ...complaint, status: "in_progress", assignedTo: assigneeName } 
            : complaint
        )
      );
      
      // Update stats
      setComplaintStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        inProgress: prev.inProgress + 1
      }));
      
      toast.success("Complaint assigned successfully");
      setAssigneeName("");
      setSelectedComplaintId("");
    } catch (error) {
      console.error("Error assigning complaint:", error);
      toast.error("Failed to assign complaint");
    }
  };

  const resolveComplaint = async () => {
    if (!selectedComplaintId) {
      toast.error("No complaint selected");
      return;
    }

    try {
      await updateDoc(doc(db, "complaints", selectedComplaintId), {
        status: "resolved",
        resolvedAt: new Date(),
        notes: resolveNote || "Issue resolved"
      });
      
      // Get the complaint details to send notification to student
      const complaintDoc = await getDoc(doc(db, "complaints", selectedComplaintId));
      const complaintData = complaintDoc.data() as Complaint;
      
      // Create notification for the student
      await addDoc(collection(db, "notifications"), {
        title: "Complaint Resolved",
        message: `Your complaint regarding "${complaintData.issue}" has been resolved. ${resolveNote ? `Note: ${resolveNote}` : ''}`,
        type: "success",
        timestamp: new Date(),
        read: false,
        target: complaintData.studentId,
        sender: currentUser?.displayName || "Admin"
      });
      
      // Update local state
      setComplaints(prevComplaints => 
        prevComplaints.map(complaint => 
          complaint.id === selectedComplaintId 
            ? { 
                ...complaint, 
                status: "resolved", 
                resolvedAt: new Date(),
                notes: resolveNote || "Issue resolved" 
              } 
            : complaint
        )
      );
      
      // Update stats
      setComplaintStats(prev => ({
        ...prev,
        resolved: prev.resolved + 1,
        pending: complaint => complaint.status === "pending" ? prev.pending - 1 : prev.pending,
        inProgress: complaint => complaint.status === "in_progress" ? prev.inProgress - 1 : prev.inProgress
      }));
      
      toast.success("Complaint resolved successfully");
      setResolveNote("");
      setSelectedComplaintId("");
    } catch (error) {
      console.error("Error resolving complaint:", error);
      toast.error("Failed to resolve complaint");
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complaint Management</h1>
          <p className="text-muted-foreground">Handle student complaints and maintenance requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaintStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{complaintStats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{complaintStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{complaintStats.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{complaintStats.highPriority}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaints List</CardTitle>
            <CardDescription>
              View and manage all student complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        #{complaint.id.slice(0, 6)}
                      </TableCell>
                      <TableCell>{complaint.roomNumber}</TableCell>
                      <TableCell>{complaint.studentName}</TableCell>
                      <TableCell>{complaint.issue}</TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>{complaint.createdAt.toDate().toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {complaint.status === "pending" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedComplaintId(complaint.id)}
                                >
                                  Assign
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Complaint</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="assignee">Assignee Name</Label>
                                    <Input
                                      id="assignee"
                                      placeholder="Enter assignee name"
                                      value={assigneeName}
                                      onChange={(e) => setAssigneeName(e.target.value)}
                                    />
                                  </div>
                                  <Button className="w-full" onClick={assignComplaint}>
                                    Assign and Start Processing
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {(complaint.status === "pending" || complaint.status === "in_progress") && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedComplaintId(complaint.id)}
                                >
                                  Resolve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Resolve Complaint</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="note">Resolution Note (Optional)</Label>
                                    <textarea
                                      id="note"
                                      className="w-full rounded-md border border-gray-300 p-2"
                                      rows={4}
                                      placeholder="Enter resolution details"
                                      value={resolveNote}
                                      onChange={(e) => setResolveNote(e.target.value)}
                                    />
                                  </div>
                                  <Button className="w-full" onClick={resolveComplaint}>
                                    Mark as Resolved
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminComplaints;
