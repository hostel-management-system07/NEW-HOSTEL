
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StudentLayout from "../../components/layouts/StudentLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangleIcon, KeyIcon, ShieldAlertIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import ChatBot from "../../components/ChatBot";

const StudentSecurity = () => {
  const { currentUser, changePassword, deleteAccount } = useAuth();
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  
  // Delete account state
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await changePassword(newPassword);
      toast.success("Password changed successfully");
      setOpenPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmDeleteText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    
    setIsDeletingAccount(true);
    
    try {
      await deleteAccount();
      // Redirect to login handled by AuthContext useEffect
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(error.message || "Failed to delete account");
      setIsDeletingAccount(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and privacy
          </p>
        </div>

        {/* Password Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyIcon className="mr-2 h-5 w-5" />
              Password Management
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              It's recommended to use a strong, unique password that you don't use for other services.
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number and special character</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
              <DialogTrigger asChild>
                <Button>Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and new password
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenPasswordDialog(false)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* Account Deletion */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <TrashIcon className="mr-2 h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-destructive/10">
                <ShieldAlertIcon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Warning: This action cannot be undone</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Deleting your account will remove all your personal information, bookings, 
                  complaints, and any other data associated with your account from our system.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Your account and all associated data will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDeleteAccount}>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangleIcon className="h-5 w-5 text-destructive" />
                      <p className="text-sm font-medium">
                        Are you absolutely sure you want to delete your account?
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmDelete">
                        Type <span className="font-bold">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="confirmDelete"
                        value={confirmDeleteText}
                        onChange={(e) => setConfirmDeleteText(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenDeleteDialog(false)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      type="submit" 
                      disabled={isDeletingAccount || confirmDeleteText !== "DELETE"}
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
      <ChatBot />
    </StudentLayout>
  );
};

export default StudentSecurity;
