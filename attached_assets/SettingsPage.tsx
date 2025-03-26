import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { SupportForm } from "@/components/SupportForm";
import { LegalContent } from "@/components/LegalContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Bell,
  ChevronRight,
  Shield,
  Moon,
  LogOut,
  ChevronLeft,
  DiamondPlus,
  Users,
  Scale,
} from "lucide-react";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const handleNotificationChange = (checked: boolean) => {
    setNotifications(checked);
    toast({
      title: checked ? "Notifications enabled" : "Notifications disabled",
      description: checked
        ? "You will now receive notifications"
        : "You will no longer receive notifications",
    });
  };

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    // Implementation for dark mode toggle will be added later
    toast({
      title: checked ? "Dark mode enabled" : "Dark mode disabled",
      description: "Theme preference saved",
    });
  };

  //password update close dialog
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
        }),
      });
      if (!response.ok) throw await response.json();
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setIsPasswordDialogOpen(false); // Close the dialog
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  //email update close dialog
  const handleEmailUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
        }),
      });
      if (!response.ok) throw await response.json();
      toast({
        title: "Success",
        description: "Email updated successfully",
      });
      setIsEmailDialogOpen(false); // Close the dialog
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error || "Failed to update email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-4 max-w-md w-full md:w-[400px] h-[calc(100vh-4.1rem)] md:h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide px-4">
      <div className="flex items-center gap-4 mb-6 px-4">
        <Link href="/profile">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={handleNotificationChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <DiamondPlus className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-between">
              Subscribe to the Circle
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Privacy & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password Dialog */}
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="change-password-description">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <p
                  className="text-sm text-muted-foreground"
                  id="change-password-description"
                >
                  Enter your current password and a new password to update your
                  credentials.
                </p>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Update Password</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isEmailDialogOpen}
              onOpenChange={setIsEmailDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Change Email
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="change-password-description">
                <DialogHeader>
                  <DialogTitle>Change Email</DialogTitle>
                </DialogHeader>
                <p
                  className="text-sm text-muted-foreground"
                  id="change-email-description"
                >
                  Enter your new email to update your credentials.
                </p>
                <form onSubmit={handleEmailUpdate}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">New Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Update Email</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Community</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-between">
              Safety & Community Guidelines
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Support Center
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact Support</DialogTitle>
                </DialogHeader>
                <SupportForm onSubmit={() => {}} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Scale className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Legal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowPrivacyPolicy(true)}
            >
              Privacy Policy
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowTermsOfService(true)}
            >
              Terms of Service
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <LegalContent
              type="privacy"
              isOpen={showPrivacyPolicy}
              onClose={() => setShowPrivacyPolicy(false)}
            />
            <LegalContent
              type="terms"
              isOpen={showTermsOfService}
              onClose={() => setShowTermsOfService(false)}
            />
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <div className="flex items-center">
              <Moon className="w-5 h-5 mr-3" />
              <CardTitle className="text-xl">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
              />
            </div>
          </CardContent>
        </Card> */}

        <form
          action="/api/logout"
          method="POST"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
              });
              if (response.ok) {
                window.location.href = "/";
              }
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
        >
          <Button
            type="submit"
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
