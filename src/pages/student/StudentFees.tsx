
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StudentLayout from "../../components/layouts/StudentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, ClockIcon, AlertTriangleIcon, ExternalLinkIcon } from "lucide-react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ChatBot from "../../components/ChatBot";

interface Fee {
  id: string;
  type: string;
  amount: number;
  dueDate: Timestamp;
  status: string;
  paymentInfo?: {
    method: string;
    transactionId: string;
    paidDate: Timestamp;
  };
}

const StudentFees = () => {
  const { currentUser } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      if (!currentUser) return;

      try {
        const feesQuery = query(
          collection(db, "fees"),
          where("userId", "==", currentUser.uid)
        );
        
        const snapshot = await getDocs(feesQuery);
        const feesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Fee));
        
        setFees(feesList);
      } catch (error) {
        console.error("Error fetching fees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [currentUser]);

  const pendingFees = fees.filter(fee => fee.status === "pending");
  const paidFees = fees.filter(fee => fee.status === "paid");

  // Calculate totals
  const totalPaid = paidFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPending = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">
            View and manage your hostel fee payments
          </p>
        </div>

        {/* Fee Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                Paid Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total amount paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ClockIcon className="mr-2 h-4 w-4 text-amber-500" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingFees.length} payment{pendingFees.length !== 1 ? "s" : ""} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending Payments</TabsTrigger>
            <TabsTrigger value="paid">Payment History</TabsTrigger>
            <TabsTrigger value="all">All Records</TabsTrigger>
          </TabsList>

          {/* Pending Payments Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>
                  Fees that need to be paid
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingFees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingFees.map((fee) => {
                          const isOverdue = fee.dueDate && 
                            new Date(fee.dueDate.seconds * 1000) < new Date();
                          
                          return (
                            <TableRow key={fee.id}>
                              <TableCell className="font-medium">{fee.type}</TableCell>
                              <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                              <TableCell className="flex items-center">
                                {isOverdue && (
                                  <AlertTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {formatDate(fee.dueDate)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={isOverdue ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                                  {isOverdue ? "Overdue" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm">
                                  Pay Now <ExternalLinkIcon className="ml-1 h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckIcon className="mx-auto h-8 w-8 text-green-500 mb-3" />
                    <p>No pending payments</p>
                    <p className="text-muted-foreground mt-1">
                      All your fees are paid and up to date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paid Fees Tab */}
          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Record of your previous payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidFees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidFees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.type}</TableCell>
                            <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              {fee.paymentInfo?.paidDate ? formatDate(fee.paymentInfo.paidDate) : "N/A"}
                            </TableCell>
                            <TableCell>{fee.paymentInfo?.method || "N/A"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {fee.paymentInfo?.transactionId || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                Paid
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p>No payment history found</p>
                    <p className="text-muted-foreground mt-1">
                      Your payment records will appear here once you make a payment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Records Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Fee Records</CardTitle>
                <CardDescription>
                  Complete history of your fee records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Info</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees.map((fee) => {
                          const isOverdue = fee.status === "pending" && 
                            new Date(fee.dueDate.seconds * 1000) < new Date();
                          
                          return (
                            <TableRow key={fee.id}>
                              <TableCell className="font-medium">{fee.type}</TableCell>
                              <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                              <TableCell>{formatDate(fee.dueDate)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    fee.status === "paid" 
                                      ? "bg-green-50 text-green-600 border-green-200"
                                      : isOverdue
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-amber-50 text-amber-600 border-amber-200"
                                  }
                                >
                                  {fee.status === "paid" 
                                    ? "Paid" 
                                    : isOverdue 
                                      ? "Overdue" 
                                      : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {fee.paymentInfo ? (
                                  <span className="text-xs">
                                    {fee.paymentInfo.method} - {formatDate(fee.paymentInfo.paidDate)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Not paid yet</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {fee.status === "pending" ? (
                                  <Button size="sm">
                                    Pay Now
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    Receipt
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p>No fee records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ChatBot />
    </StudentLayout>
  );
};

export default StudentFees;
