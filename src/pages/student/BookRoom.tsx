
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StudentLayout from "../../components/layouts/StudentLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import ChatBot from "../../components/ChatBot";

const BookRoom = () => {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [userRoom, setUserRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentUser) return;

      try {
        // Check if user already has a room
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();

        if (userData?.roomId) {
          const roomDoc = await getDoc(doc(db, "rooms", userData.roomId));
          if (roomDoc.exists()) {
            setUserRoom({ id: roomDoc.id, ...roomDoc.data() });
          }
        }

        // Check if there's a pending booking request
        const bookingQuery = query(
          collection(db, "roomRequests"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        
        const bookingSnapshot = await getDocs(bookingQuery);
        if (!bookingSnapshot.empty) {
          setBookingStatus("pending");
        }

        // Get available rooms
        const roomsCollection = collection(db, "rooms");
        const roomsQuery = query(roomsCollection, where("status", "==", "available"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        const roomsList = roomsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRooms(roomsList);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [currentUser]);

  const handleRequestRoom = async (roomId: string) => {
    if (!currentUser) return;
    
    setRequesting(true);
    
    try {
      // Create room request
      await addDoc(collection(db, "roomRequests"), {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        roomId: roomId,
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      // Create notification for admin
      await addDoc(collection(db, "notifications"), {
        type: "room_request",
        message: `${currentUser.displayName} requested a room`,
        target: "admin",
        read: false,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      toast.success("Room request submitted successfully");
      setBookingStatus("pending");
    } catch (error) {
      console.error("Error requesting room:", error);
      toast.error("Failed to request room");
    } finally {
      setRequesting(false);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Room Booking</h1>
          <p className="text-muted-foreground">
            Request a room or view your current room information
          </p>
        </div>

        <Tabs defaultValue={userRoom ? "current" : "available"}>
          <TabsList>
            <TabsTrigger value="current">My Room</TabsTrigger>
            <TabsTrigger value="available">Available Rooms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4">
            {userRoom ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Current Room</CardTitle>
                  <CardDescription>Details of your assigned room</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Room Number</p>
                        <p className="text-lg">{userRoom.number}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Floor</p>
                        <p className="text-lg">{userRoom.floor}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Type</p>
                        <p className="text-lg">{userRoom.type}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Capacity</p>
                        <p className="text-lg">{userRoom.capacity}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Assigned Date</p>
                        <p className="text-lg">{userRoom.assignedDate ? new Date(userRoom.assignedDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : bookingStatus === "pending" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Room Request Pending</CardTitle>
                  <CardDescription>Your room request is being processed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <Badge className="mb-2">Pending</Badge>
                      <p>Your room request is currently under review by hostel administrators.</p>
                      <p className="mt-2 text-muted-foreground">You will receive a notification once it's approved.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Room Assigned</CardTitle>
                  <CardDescription>You don't have a room assigned yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <p>You haven't been assigned a room yet.</p>
                      <p className="mt-2 text-muted-foreground">
                        Check the "Available Rooms" tab to request a room.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Available Rooms</CardTitle>
                <CardDescription>
                  Browse and request available rooms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingStatus === "pending" ? (
                  <div className="text-center py-4">
                    <Badge className="mb-2">Pending Request</Badge>
                    <p>
                      You already have a pending room request. Please wait for 
                      approval before requesting another room.
                    </p>
                  </div>
                ) : userRoom ? (
                  <div className="text-center py-4">
                    <Badge className="mb-2">Room Assigned</Badge>
                    <p>
                      You already have a room assigned. If you need to change rooms,
                      please contact the hostel administration.
                    </p>
                  </div>
                ) : rooms.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room No.</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium">{room.number}</TableCell>
                            <TableCell>{room.floor}</TableCell>
                            <TableCell>{room.type}</TableCell>
                            <TableCell>{room.capacity}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                Available
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleRequestRoom(room.id)}
                                disabled={requesting}
                              >
                                {requesting ? "Requesting..." : "Request Room"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No rooms available at the moment.</p>
                    <p className="text-muted-foreground mt-2">
                      Please check back later or contact the hostel administration.
                    </p>
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

export default BookRoom;
