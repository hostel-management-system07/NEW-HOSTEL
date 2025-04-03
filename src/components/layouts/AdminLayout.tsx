
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Home, 
  Users, 
  DoorOpen, 
  Bell, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  UserCog,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to notifications
    const notificationsRef = collection(db, "notifications");
    const adminNotificationsQuery = query(
      notificationsRef,
      where("target", "in", ["admin", "all"]),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(adminNotificationsQuery, (snapshot) => {
      setNotificationCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Rooms", href: "/admin/rooms", icon: DoorOpen },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Fees", href: "/admin/fees", icon: FileText },
    { name: "Complaints", href: "/admin/complaints", icon: MessageSquare },
    { name: "Security", href: "/admin/security", icon: ShieldAlert },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <Link to="/admin" className="flex items-center space-x-2">
                      <span className="font-bold text-xl">AI Hostel Connect</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-4">
                    <nav className="space-y-1 px-2">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                            location.pathname === item.href
                              ? "bg-primary text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500" 
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/admin" className="flex items-center space-x-2 ml-2 lg:ml-0">
              <span className="font-bold text-xl hidden sm:inline">AI Hostel Connect</span>
              <span className="font-bold text-xl sm:hidden">HMS</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/admin/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/admin/profile">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {currentUser?.displayName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex h-[calc(100vh-64px)] w-64 flex-col fixed overflow-y-auto bg-white border-r border-gray-200">
          <nav className="mt-5 flex-1 px-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
