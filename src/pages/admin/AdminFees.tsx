
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, getDocs, doc, updateDoc, addDoc, where } from "firebase/firestore";
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
import { Calendar, CheckCircle, Clock, DollarSign, SendHorizonal, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Student {
  id: string;
  name: string;
  email: string;
  roomNumber?: string;
  course?: string;
  year?: string;
}

interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  dueDate: any;
  status: "paid" | "pending" | "overdue";
  paymentDetails?: string;
  paymentDate?: any;
}

const AdminFees = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderSubject, setReminderSubject] = useState("Fee Payment Reminder");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [newFeeDueDate, setNewFeeDueDate] = useState("");
  const [feeStats, setFeeStats] = useState({
    collected: 0,
    pending: 0,
    overdue: 0,
    total: 0
  });

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;

      try {
        // Fetch all students
        const studentsSnapshot = await getDocs(collection(db, "users"));
        const studentsList = studentsSnapshot.docs
          .filter(doc => doc.data().role === "student")
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Student[];
        
        setStudents(studentsList);
        
        // Fetch all fees
        const feesSnapshot = await getDocs(collection(db, "fees"));
        const feesList = feesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Fee[];
        
        setFees(feesList);
        
        // Calculate fee statistics
        const totalCollected = feesList
          .filter(fee => fee.status === "paid")
          .reduce((sum, fee) => sum + fee.amount, 0);
        
        const totalPending = feesList
          .filter(fee => fee.status === "pending")
          .reduce((sum, fee) => sum + fee.amount, 0);
        
        const totalOverdue = feesList
          .filter(fee => fee.status === "overdue")
          .reduce((sum, fee) => sum + fee.amount, 0);
        
        setFeeStats({
          collected: totalCollected,
          pending: totalPending,
          overdue: totalOverdue,
          total: totalCollected + totalPending + totalOverdue
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load fee data");
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentUser]);

  const markAsPaid = async (feeId: string) => {
    try {
      await updateDoc(doc(db, "fees", feeId), {
        status: "paid",
        paymentDate: new Date()
      });
      
      // Update local state
      setFees(prevFees => 
        prevFees.map(fee => 
          fee.id === feeId 
            ? { ...fee, status: "paid", paymentDate: new Date() } 
            : fee
        )
      );
      
      // Update fee stats
      const updatedFee = fees.find(fee => fee.id === feeId);
      if (updatedFee) {
        setFeeStats(prev => ({
          ...prev,
          collected: prev.collected + updatedFee.amount,
          pending: updatedFee.status === "pending" ? prev.pending - updatedFee.amount : prev.pending,
          overdue: updatedFee.status === "overdue" ? prev.overdue - updatedFee.amount : prev.overdue
        }));
      }
      
      toast.success("Fee marked as paid");
    } catch (error) {
      console.error("Error marking fee as paid:", error);
      toast.error("Failed to update fee status");
    }
  };

  const sendReminder = async (studentId: string, studentEmail: string, feeId: string) => {
    try {
      // Create notification for the student
      await addDoc(collection(db, "notifications"), {
        title: "Fee Payment Reminder",
        message: reminderEmail || "This is a reminder to pay your pending hostel fees. Please make the payment as soon as possible.",
        type: "warning",
        timestamp: new Date(),
        read: false,
        target: studentId,
        sender: currentUser?.displayName || "Admin"
      });
      
      // In a real app, you would send an actual email here
      // For now, we're just creating a notification in the database
      
      toast.success(`Reminder sent to ${studentEmail}`);
      setReminderEmail("");
      setSelectedStudentId("");
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    }
  };

  const createNewFee = async () => {
    if (!selectedStudentId || !newFeeAmount || !newFeeDueDate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) {
        toast.error("Student not found");
        return;
      }

      const amount = parseFloat(newFeeAmount);
      if (isNaN(amount)) {
        toast.error("Invalid amount");
        return;
      }

      // Create new fee record
      await addDoc(collection(db, "fees"), {
        studentId: selectedStudentId,
        studentName: student.name,
        studentEmail: student.email,
        amount: amount,
        dueDate: new Date(newFeeDueDate),
        status: "pending",
        createdAt: new Date()
      });

      // Create notification for the student
      await addDoc(collection(db, "notifications"), {
        title: "New Fee Added",
        message: `A new fee of ₹${amount} has been added to your account with due date ${new Date(newFeeDueDate).toLocaleDateString()}.`,
        type: "info",
        timestamp: new Date(),
        read: false,
        target: selectedStudentId,
        sender: currentUser?.displayName || "Admin"
      });

      toast.success("New fee created successfully");
      setSelectedStudentId("");
      setNewFeeAmount("");
      setNewFeeDueDate("");

      // Refresh fees data
      const feesSnapshot = await getDocs(collection(db, "fees"));
      const feesList = feesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Fee[];
      
      setFees(feesList);

      // Update fee stats
      setFeeStats(prev => ({
        ...prev,
        pending: prev.pending + amount,
        total: prev.total + amount
      }));

    } catch (error) {
      console.error("Error creating new fee:", error);
      toast.error("Failed to create new fee");
    }
  };

  const sendMassReminderToAll = async () => {
    try {
      const pendingFees = fees.filter(fee => fee.status !== "paid");
      
      if (pendingFees.length === 0) {
        toast.info("No pending fees to remind about");
        return;
      }
      
      // Create notifications for all students with pending fees
      const notifications = pendingFees.map(fee => ({
        title: reminderSubject,
        message: reminderEmail || "This is a reminder to pay your pending hostel fees. Please make the payment as soon as possible.",
        type: "warning",
        timestamp: new Date(),
        read: false,
        target: fee.studentId,
        sender: currentUser?.displayName || "Admin"
      }));
      
      // Add all notifications to Firestore
      for (const notification of notifications) {
        await addDoc(collection(db, "notifications"), notification);
      }
      
      toast.success(`Reminders sent to ${pendingFees.length} students`);
      setReminderEmail("");
      setReminderSubject("Fee Payment Reminder");
    } catch (error) {
      console.error("Error sending mass reminders:", error);
      toast.error("Failed to send reminders");
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
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">Manage student fee records and payments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{feeStats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{feeStats.collected.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{feeStats.pending.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{feeStats.overdue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="records">
          <TabsList>
            <TabsTrigger value="records">Fee Records</TabsTrigger>
            <TabsTrigger value="create">Create Fee</TabsTrigger>
            <TabsTrigger value="reminders">Send Reminders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Records</CardTitle>
                <CardDescription>
                  View and manage all student fee records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No fee records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">
                            <div>{fee.studentName}</div>
                            <div className="text-xs text-gray-500">{fee.studentEmail}</div>
                          </TableCell>
                          <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                          <TableCell>{fee.dueDate?.toDate().toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                fee.status === "paid" 
                                  ? "bg-green-500" 
                                  : fee.status === "overdue" 
                                    ? "bg-red-500" 
                                    : "bg-yellow-500"
                              }
                            >
                              {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {fee.paymentDetails || (fee.status === "paid" ? "Paid on " + fee.paymentDate?.toDate().toLocaleDateString() : "-")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {fee.status !== "paid" && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => markAsPaid(fee.id)}
                                  >
                                    Mark Paid
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setSelectedStudentId(fee.studentId)}
                                      >
                                        Remind
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Send Payment Reminder</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="message">Reminder Message</Label>
                                          <textarea
                                            id="message"
                                            className="w-full rounded-md border border-gray-300 p-2"
                                            rows={4}
                                            placeholder="Enter reminder message"
                                            value={reminderEmail}
                                            onChange={(e) => setReminderEmail(e.target.value)}
                                          />
                                        </div>
                                        <Button 
                                          className="w-full" 
                                          onClick={() => sendReminder(fee.studentId, fee.studentEmail, fee.id)}
                                        >
                                          Send Reminder
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </>
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
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Fee</CardTitle>
                <CardDescription>
                  Add new fee records for students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student">Select Student</Label>
                    <select
                      id="student"
                      className="w-full rounded-md border border-gray-300 p-2 mt-1"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                      <option value="">Select a student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={newFeeAmount}
                      onChange={(e) => setNewFeeAmount(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newFeeDueDate}
                      onChange={(e) => setNewFeeDueDate(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={createNewFee}>
                    Create Fee Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Mass Reminders</CardTitle>
                <CardDescription>
                  Send fee payment reminders to all students with pending fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter subject"
                      value={reminderSubject}
                      onChange={(e) => setReminderSubject(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="massMessage">Message</Label>
                    <textarea
                      id="massMessage"
                      className="w-full rounded-md border border-gray-300 p-2"
                      rows={4}
                      placeholder="Enter reminder message"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={sendMassReminderToAll} className="w-full">
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Send Reminders to All Students with Pending Fees
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFees;
