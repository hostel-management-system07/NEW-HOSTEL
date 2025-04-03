
import { useState, useEffect } from "react";
import AdminLayout from "../../components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, Users, Pencil, Trash } from "lucide-react";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import ChatBot from "../../components/ChatBot";

interface Room {
  id: string;
  number: string;
  floor: string;
  type: string;
  capacity: number;
  status: string;
  occupants?: any[];
}

const AdminRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  
  // New room form state
  const [formData, setFormData] = useState({
    number: "",
    floor: "",
    type: "single",
    capacity: 1,
    status: "available"
  });
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const roomsCollection = collection(db, "rooms");
      const roomsSnapshot = await getDocs(roomsCollection);
      
      const roomsList = await Promise.all(roomsSnapshot.docs.map(async (doc) => {
        const roomData = { id: doc.id, ...doc.data() } as Room;
        
        // For each room, get the number of occupants
        if (roomData.status === "occupied") {
          const usersQuery = query(
            collection(db, "users"),
            where("roomId", "==", roomData.id)
          );
          const usersSnapshot = await getDocs(usersQuery);
          roomData.occupants = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          roomData.occupants = [];
        }
        
        return roomData;
      }));
      
      // Sort rooms by floor and number
      roomsList.sort((a, b) => {
        if (a.floor === b.floor) {
          return a.number.localeCompare(b.number);
        }
        return a.floor.localeCompare(b.floor);
      });
      
      setRooms(roomsList);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      number: "",
      floor: "",
      type: "single",
      capacity: 1,
      status: "available"
    });
    setIsEditing(false);
    setCurrentRoom(null);
  };

  const openEditDialog = (room: Room) => {
    setCurrentRoom(room);
    setFormData({
      number: room.number,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity,
      status: room.status
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const viewRoomMembers = async (room: Room) => {
    setCurrentRoom(room);
    
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("roomId", "==", room.id)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      setRoomMembers(usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      setOpenMembersDialog(true);
    } catch (error) {
      console.error("Error fetching room members:", error);
      toast.error("Failed to load room members");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      // Check if room has occupants
      const usersQuery = query(
        collection(db, "users"),
        where("roomId", "==", roomId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        toast.error("Cannot delete room with assigned students");
        return;
      }
      
      await deleteDoc(doc(db, "rooms", roomId));
      toast.success("Room deleted successfully");
      setRooms(rooms.filter(room => room.id !== roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.number || !formData.floor) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && currentRoom) {
        // Update existing room
        await updateDoc(doc(db, "rooms", currentRoom.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        toast.success("Room updated successfully");
        
        // Update local state
        setRooms(rooms.map(room => 
          room.id === currentRoom.id 
            ? { ...room, ...formData } 
            : room
        ));
      } else {
        // Create new room
        // Check if room number already exists
        const roomQuery = query(
          collection(db, "rooms"),
          where("number", "==", formData.number)
        );
        const roomSnapshot = await getDocs(roomQuery);
        
        if (!roomSnapshot.empty) {
          toast.error("Room number already exists");
          setIsSubmitting(false);
          return;
        }
        
        const docRef = await addDoc(collection(db, "rooms"), {
          ...formData,
          capacity: Number(formData.capacity),
          createdAt: serverTimestamp()
        });
        
        toast.success("Room added successfully");
        
        // Add to local state
        setRooms([...rooms, { id: docRef.id, ...formData, occupants: [] } as Room]);
      }
      
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Room Management</h1>
            <p className="text-muted-foreground">
              Manage hostel rooms and their allocations
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0" onClick={() => resetForm()}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Room" : "Add New Room"}</DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update the room details below"
                    : "Enter the details for the new room"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Room Number</Label>
                      <Input
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Room Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleSelectChange("type", value)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                          <SelectItem value="quad">Quad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        max="6"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setOpenDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : isEditing
                      ? "Update Room"
                      : "Add Room"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Room Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rooms.filter(room => room.status === "available").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {rooms.filter(room => room.status === "occupied").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {rooms.filter(room => room.status === "maintenance").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Rooms</CardTitle>
            <CardDescription>
              Manage and view all rooms in the hostel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room No.</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Occupants</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.number}</TableCell>
                        <TableCell>{room.floor}</TableCell>
                        <TableCell className="capitalize">{room.type}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              room.status === "available"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : room.status === "occupied"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : room.status === "maintenance"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-purple-50 text-purple-600 border-purple-200"
                            }
                          >
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {room.occupants && room.occupants.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center"
                              onClick={() => viewRoomMembers(room)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {room.occupants.length}
                            </Button>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(room)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p>No rooms found</p>
                <p className="text-muted-foreground mt-1">
                  Click "Add Room" to create your first room
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Room Members Dialog */}
      <Dialog open={openMembersDialog} onOpenChange={setOpenMembersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room {currentRoom?.number} Members</DialogTitle>
            <DialogDescription>
              Students assigned to this room
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {roomMembers.length > 0 ? (
              <div className="space-y-4">
                {roomMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        {member.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4">No students assigned to this room</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChatBot />
    </AdminLayout>
  );
};

export default AdminRooms;
