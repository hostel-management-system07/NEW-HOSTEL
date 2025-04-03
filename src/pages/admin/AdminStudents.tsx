
import { useState, useEffect } from "react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { UserPlus, Mail, MailWarning, UserMinus, DoorOpen, Pencil, Trash } from "lucide-react";
import ChatBot from "../../components/ChatBot";

interface Student {
  id: string;
  name: string;
  email: string;
  roomId?: string;
  roomNumber?: string;
  course?: string;
  year?: string;
  joinedAt?: any;
  status: string;
}

interface Room {
  id: string;
  number: string;
  status: string;
  floor: string;
  type: string;
  capacity: number;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openFeeReminderDialog, setOpenFeeReminderDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch students
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      // Get all room data for reference
      const roomsSnapshot = await getDocs(collection(db, "rooms"));
      const roomsData = roomsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() };
        return acc;
      }, {} as Record<string, any>);
      
      // Get available rooms for assignment
      const availableRoomsQuery = query(
        collection(db, "rooms"),
        where("status", "==", "available")
      );
      const availableRoomsSnapshot = await getDocs(availableRoomsQuery);
      setAvailableRooms(
        availableRoomsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Room))
      );
      
      // Map student data with room info
      const studentsList = await Promise.all(
        studentsSnapshot.docs.map(async (doc) => {
          const studentData = doc.data();
          const student: Student = {
            id: doc.id,
            name: studentData.name || "",
            email: studentData.email || "",
            roomId: studentData.roomId || "",
            course: studentData.course || "",
            year: studentData.year || "",
            joinedAt: studentData.createdAt,
            status: studentData.status || "active"
          };
          
          // Add room number if student has a room
          if (student.roomId && roomsData[student.roomId]) {
            student.roomNumber = roomsData[student.roomId].number;
          }
          
          return student;
        })
      );
      
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openRoomAssignDialog = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedRoom("");
    setOpenAssignDialog(true);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id));
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedStudentId || !selectedRoom) {
      toast.error("Please select a room");
      return;
    }
    
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const room = availableRooms.find((r) => r.id === selectedRoom);
      
      if (!student || !room) {
        toast.error("Invalid student or room selection");
        return;
      }
      
      // Update student document with room assignment
      await updateDoc(doc(db, "users", selectedStudentId), {
        roomId: selectedRoom,
        updatedAt: serverTimestamp()
      });
      
      // Update room status to occupied
      await updateDoc(doc(db, "rooms", selectedRoom), {
        status: "occupied",
        assignedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notification for student
      await addDoc(collection(db, "notifications"), {
        type: "room_assigned",
        message: `You have been assigned to Room ${room.number}`,
        userId: selectedStudentId,
        target: selectedStudentId,
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success(`Room ${room.number} assigned to ${student.name}`);
      
      // Update local state
      setStudents(
        students.map((s) => {
          if (s.id === selectedStudentId) {
            return {
              ...s,
              roomId: selectedRoom,
              roomNumber: room.number
            };
          }
          return s;
        })
      );
      
      // Remove assigned room from available rooms
      setAvailableRooms(availableRooms.filter((r) => r.id !== selectedRoom));
      
      setOpenAssignDialog(false);
    } catch (error) {
      console.error("Error assigning room:", error);
      toast.error("Failed to assign room");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    
    try {
      const student = students.find((s) => s.id === studentId);
      
      if (!student) {
        toast.error("Student not found");
        return;
      }
      
      // If student has a room assigned, update room status
      if (student.roomId) {
        await updateDoc(doc(db, "rooms", student.roomId), {
          status: "available",
          assignedDate: null,
          updatedAt: serverTimestamp()
        });
      }
      
      // Delete student document
      await deleteDoc(doc(db, "users", studentId));
      
      toast.success(`${student.name} has been removed`);
      
      // Update local state
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    }
  };

  const handleSendMassEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailSubject || !emailBody) {
      toast.error("Please fill all fields");
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    
    setIsSending(true);
    
    try {
      // In a real implementation, you would integrate with an email service
      // For this demo, we'll simulate sending by creating notifications
      
      for (const studentId of selectedStudents) {
        await addDoc(collection(db, "notifications"), {
          type: "email",
          subject: emailSubject,
          message: emailBody,
          userId: studentId,
          target: studentId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      toast.success(`Email sent to ${selectedStudents.length} students`);
      setOpenEmailDialog(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send emails");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFeeReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    
    setIsSending(true);
    
    try {
      // Create fee reminders as notifications
      for (const studentId of selectedStudents) {
        await addDoc(collection(db, "notifications"), {
          type: "fee_reminder",
          message: "This is a reminder to pay your pending hostel fees.",
          userId: studentId,
          target: studentId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      toast.success(`Fee reminder sent to ${selectedStudents.length} students`);
      setOpenFeeReminderDialog(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error sending fee reminders:", error);
      toast.error("Failed to send fee reminders");
    } finally {
      setIsSending(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      (student.roomNumber && student.roomNumber.toLowerCase().includes(searchLower)) ||
      (student.course && student.course.toLowerCase().includes(searchLower))
    );
  });

  // Count statistics
  const totalStudents = students.length;
  const studentsWithRoom = students.filter((s) => s.roomId).length;
  const studentsWithoutRoom = totalStudents - studentsWithRoom;

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground">
              Manage student records and room assignments
            </p>
          </div>
        </div>

        {/* Student Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Room</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{studentsWithRoom}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Without Room</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{studentsWithoutRoom}</div>
            </CardContent>
          </Card>
        </div>

        {/* Communication Section */}
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>Send messages to students</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Dialog open={openEmailDialog} onOpenChange={setOpenEmailDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Mass Emails
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Email to Students</DialogTitle>
                  <DialogDescription>
                    Compose an email to send to selected students
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendMassEmail}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailSubject">Subject</Label>
                      <Input
                        id="emailSubject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Email subject"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailBody">Message</Label>
                      <textarea
                        id="emailBody"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Your message here..."
                        className="w-full min-h-[120px] p-2 border rounded-md"
                        required
                      ></textarea>
                    </div>
                    <div>
                      <Label>Recipients</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudents.length} students selected
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setOpenEmailDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSending || selectedStudents.length === 0}>
                      {isSending ? "Sending..." : "Send Email"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openFeeReminderDialog} onOpenChange={setOpenFeeReminderDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1" variant="outline">
                  <MailWarning className="mr-2 h-4 w-4" />
                  Send Fee Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Fee Payment Reminder</DialogTitle>
                  <DialogDescription>
                    Send a reminder to selected students to pay their pending fees
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendFeeReminder}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Recipients</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudents.length} students selected
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-md text-amber-800 text-sm">
                      <p>A standard fee reminder will be sent to all selected students.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setOpenFeeReminderDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSending || selectedStudents.length === 0}>
                      {isSending ? "Sending..." : "Send Reminder"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              Manage all registered students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search by name, email, room..."
                value={searchTerm}
                onChange={handleSearch}
                className="max-w-md"
              />
            </div>
            
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="with-room">With Room</TabsTrigger>
                <TabsTrigger value="without-room">Without Room</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderStudentsTable(filteredStudents)}
              </TabsContent>
              
              <TabsContent value="with-room">
                {renderStudentsTable(filteredStudents.filter((s) => s.roomId))}
              </TabsContent>
              
              <TabsContent value="without-room">
                {renderStudentsTable(filteredStudents.filter((s) => !s.roomId))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Room Assignment Dialog */}
      <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Room</DialogTitle>
            <DialogDescription>
              Select a room to assign to this student
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room">Available Rooms</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger id="room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.length > 0 ? (
                      availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.number} - Floor {room.floor} ({room.type})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No available rooms
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRoom} disabled={!selectedRoom}>
              Assign Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChatBot />
    </AdminLayout>
  );

  function renderStudentsTable(students: Student[]) {
    return (
      <div className="overflow-x-auto">
        {students.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={
                      selectedStudents.length > 0 &&
                      students.every((s) => selectedStudents.includes(s.id))
                    }
                    onChange={selectAllStudents}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Course/Year</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {student.roomNumber || (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.course && student.year
                      ? `${student.course} - ${student.year}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {student.joinedAt
                      ? new Date(student.joinedAt.seconds * 1000).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        student.status === "active"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {!student.roomId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRoomAssignDialog(student.id)}
                          title="Assign Room"
                        >
                          <DoorOpen className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleRemoveStudent(student.id)}
                        title="Remove Student"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6">
            <p>No students found</p>
            {searchTerm && (
              <p className="text-muted-foreground mt-1">
                Try a different search term
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
};

export default AdminStudents;
