
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EditIcon, UserIcon } from "lucide-react";

const AdminProfile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    bloodGroup: currentUser?.bloodGroup || "",
    age: currentUser?.age || "",
    gender: currentUser?.gender || "",
    phoneNumber: currentUser?.phoneNumber || "",
    address: currentUser?.address || "",
    department: currentUser?.department || "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        bloodGroup: currentUser.bloodGroup || "",
        age: currentUser.age ? currentUser.age.toString() : "",
        gender: currentUser.gender || "",
        phoneNumber: currentUser.phoneNumber || "",
        address: currentUser.address || "",
        department: currentUser.department || "",
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateUserProfile({
        displayName: formData.displayName,
        bloodGroup: formData.bloodGroup,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        department: formData.department,
      });
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and contact details</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="relative">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl">
                    {currentUser?.displayName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{currentUser?.displayName || "Admin User"}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    {currentUser?.email}
                  </CardDescription>
                  <Badge className="mt-2">Administrator</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="18"
                      max="100"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Your age"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Your department"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    className="w-full rounded-md border border-gray-300 p-2 min-h-[100px]"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Your address"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
