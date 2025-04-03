
import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Info,
  FileText
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: any;
  read: boolean;
  sender?: string;
}

const StudentNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, "notifications");
    const studentNotificationsQuery = query(
      notificationsRef,
      where("target", "in", ["student", "all", currentUser.uid])
    );

    const unsubscribe = onSnapshot(studentNotificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      
      // Sort notifications by timestamp (newest first)
      notificationsList.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      
      setNotifications(notificationsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      // Create a batch of promises to update each notification
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, "notifications", notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-500">Alert</Badge>;
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      default:
        return <Badge>Notification</Badge>;
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {notifications.some(notification => !notification.read) && (
            <Button onClick={markAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-lg text-gray-500">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={notification.read ? "bg-white" : "bg-blue-50"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {notification.title} {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.timestamp?.toDate().toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          {getNotificationBadge(notification.type)}
                          {notification.sender && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              From: {notification.sender}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2">{notification.message}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    {!notification.read && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentNotifications;
