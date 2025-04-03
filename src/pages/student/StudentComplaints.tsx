
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StudentLayout from "../../components/layouts/StudentLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, PlusIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import ChatBot from "../../components/ChatBot";

interface Complaint {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  roomId?: string;
  roomNumber?: string;
  createdAt: Timestamp;
  updates?: {
    message: string;
    timestamp: Timestamp;
  }[];
}

const StudentComplaints = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [userRoom, setUserRoom] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user's room
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", currentUser.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          if (userData.roomId) {
            const roomsRef = collection(db, "rooms");
            const roomDoc = await getDocs(query(roomsRef, where("id", "==", userData.roomId)));
            if (!roomDoc.empty) {
              setUserRoom(roomDoc.docs[0].data());
            }
          }
        }

        // Fetch complaints
        const complaintsRef = collection(db, "complaints");
        const complaintsQuery = query(complaintsRef, where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(complaintsQuery);
        
        const complaintsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Complaint));
        
        // Sort by creation date (newest first)
        complaintsList.sort((a, b) => 
          b.createdAt.seconds - a.createdAt.seconds
        );
        
        setComplaints(complaintsList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const complaintData = {
        userId: currentUser?.uid,
        userName: currentUser?.displayName,
        userEmail: currentUser?.email,
        title,
        description,
        priority,
        status: "pending",
        roomId: userRoom?.id,
        roomNumber: userRoom?.number || "Not assigned",
        createdAt: serverTimestamp(),
        updates: []
      };

      // Add complaint to Firestore
      const docRef = await addDoc(collection(db, "complaints"), complaintData);
      
      // Create notification for admin
      await addDoc(collection(db, "notifications"), {
        type: "new_complaint",
        message: `New complaint: ${title}`,
        complaintId: docRef.id,
        target: "admin",
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success("Complaint submitted successfully");
      
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setOpenDialog(false);
      
      // Refresh complaints
      const newComplaint = {
        id: docRef.id,
        ...complaintData,
        createdAt: Timestamp.now()
      };
      setComplaints(prev => [newComplaint, ...prev]);
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "in-progress":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "resolved":
        return "bg-green-50 text-green-600 border-green-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-600 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "low":
        return "bg-blue-50 text-blue-600 border-blue-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Complaints & Issues</h1>
            <p className="text-muted-foreground">
              Submit and track your hostel-related complaints
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Complaint</DialogTitle>
                <DialogDescription>
                  Provide details about the issue you're facing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input 
                      id="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Provide detailed information about the issue"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={priority} 
                      onValueChange={setPriority}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input 
                      value={userRoom ? `Room ${userRoom.number}` : "No room assigned"} 
                      disabled 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Complaints Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <ClockIcon className="mr-2 h-4 w-4 text-amber-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <AlertCircleIcon className="mr-2 h-4 w-4 text-blue-500" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === "in-progress").length}
              </div>
              <p className="text-sm text-muted-foreground">Being addressed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complaints.filter(c => c.status === "resolved").length}
              </div>
              <p className="text-sm text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Complaints</CardTitle>
            <CardDescription>
              Track the status of your submitted complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">{complaint.title}</TableCell>
                        <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                        <TableCell>{complaint.roomNumber || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                            {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(complaint.status)}>
                            {complaint.status === "pending" 
                              ? "Pending" 
                              : complaint.status === "in-progress" 
                                ? "In Progress" 
                                : "Resolved"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p>You haven't submitted any complaints yet</p>
                <p className="text-muted-foreground mt-1">
                  Click on "New Complaint" to submit an issue
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ChatBot />
    </StudentLayout>
  );
};

export default StudentComplaints;
