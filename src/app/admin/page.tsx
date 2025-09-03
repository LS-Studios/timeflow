"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-provider";
import { useTranslation } from "@/lib/i18n";
import { Copy, Building, Users, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-provider";
import { storageService } from "@/lib/storage";

export default function AdminPanel() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [organizationName, setOrganizationName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  useEffect(() => {
    if (!settings.isAdmin) {
      router.push('/');
      return;
    }

    // Load existing organization data or generate new serial number
    const initializeOrganization = async () => {
      if (settings.organizationSerialNumber) {
        // Load existing organization
        setSerialNumber(settings.organizationSerialNumber);
        const org = await storageService.getOrganization(settings.organizationSerialNumber);
        if (org) {
          setOrganizationName(org.name);
        }
      } else {
        // Generate new serial number
        setSerialNumber(Math.random().toString(36).substr(2, 9).toUpperCase());
      }
    };

    initializeOrganization();
  }, [settings.isAdmin, settings.organizationSerialNumber, router]);

  // Load employee data when organization is available
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (settings.organizationSerialNumber) {
        setIsLoadingEmployees(true);
        try {
          const data = await storageService.getOrganizationEmployeeData(settings.organizationSerialNumber);
          
          // Process employee data for analytics
          const processedEmployees = data.map(emp => {
            const allSessions = [...emp.workSessions, ...emp.learningSessions];
            const totalWorkTime = allSessions.reduce((total, session) => {
              const sessionTime = session.steps.reduce((stepTotal, step) => {
                if (step.type === 'work' && step.end) {
                  return stepTotal + (step.end.getTime() - step.start.getTime());
                }
                return stepTotal;
              }, 0);
              return total + sessionTime;
            }, 0);
            
            const totalHours = Math.round(totalWorkTime / (1000 * 60 * 60));
            const recentSessions = allSessions.filter(s => {
              const sessionDate = new Date(s.date);
              const daysDiff = (new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
              return daysDiff <= 7;
            });
            
            // Simple efficiency calculation based on session completion and consistency
            const completedSessions = allSessions.filter(s => s.isCompleted).length;
            const totalSessions = allSessions.length;
            const efficiency = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
            
            const lastSession = allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const lastActive = lastSession ? lastSession.date : "Never";

            return {
              id: emp.userId,
              name: emp.account?.name || 'Unknown User',
              email: emp.account?.email || '',
              totalHours,
              efficiency: Math.min(100, Math.max(0, efficiency)), // Clamp between 0-100
              lastActive,
              sessionsThisWeek: recentSessions.length
            };
          });

          setEmployeeData(processedEmployees);
        } catch (error) {
          console.error('Error loading employee data:', error);
          setEmployeeData([]);
        } finally {
          setIsLoadingEmployees(false);
        }
      } else {
        setEmployeeData([]);
        setIsLoadingEmployees(false);
      }
    };

    loadEmployeeData();
  }, [settings.organizationSerialNumber]);

  const copySerialNumber = () => {
    navigator.clipboard.writeText(serialNumber);
    toast({
      title: "Serial Number Copied",
      description: "The organization serial number has been copied to your clipboard.",
    });
  };

  const saveOrganizationName = async () => {
    if (!user || !organizationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an organization name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let currentSerialNumber = serialNumber;
      
      // Check if organization exists, if not create it
      if (settings.organizationSerialNumber) {
        currentSerialNumber = settings.organizationSerialNumber;
        // Check if organization exists in database
        const existingOrg = await storageService.getOrganization(currentSerialNumber);
        if (existingOrg) {
          // Update existing organization
          await storageService.updateOrganizationName(currentSerialNumber, organizationName);
        } else {
          // Organization was deleted or never created, recreate it
          await storageService.createOrganization(user.uid, currentSerialNumber, organizationName);
        }
        // Always update settings to keep organizationName in sync
        await updateSettings({
          organizationName: organizationName,
        });
      } else {
        // Create completely new organization
        await storageService.createOrganization(user.uid, currentSerialNumber, organizationName);
        // Update settings with the new organization info
        await updateSettings({
          organizationSerialNumber: currentSerialNumber,
          organizationName: organizationName,
        });
      }

      toast({
        title: "Organization Saved",
        description: `Organization "${organizationName}" with serial ${currentSerialNumber}`,
      });
    } catch (error) {
      console.error('Error saving organization:', error);
      toast({
        title: "Error",
        description: "Failed to save organization name",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings.isAdmin) {
    return null;
  }

  // Calculate analytics from real employee data
  const topPerformers = employeeData
    .filter(emp => emp.efficiency > 90)
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 3);

  const lowPerformers = employeeData
    .filter(emp => emp.efficiency < 75)
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 3);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const companyStats = {
    totalEmployees: employeeData.length,
    avgHoursPerWeek: employeeData.length > 0 ? Math.round(employeeData.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeData.length) : 0,
    avgEfficiency: employeeData.length > 0 ? Math.round(employeeData.reduce((sum, emp) => sum + emp.efficiency, 0) / employeeData.length) : 0,
    activeToday: employeeData.filter(emp => emp.lastActive === today).length,
  };

  return (
    <div className="container max-w-6xl py-8 mx-auto px-4">
      <div className="flex items-center gap-2 mb-8">
        <Building className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="grid gap-6">
        {/* Organization Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Management
            </CardTitle>
            <CardDescription>
              Manage your organization settings and serial number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                />
                <Button onClick={saveOrganizationName} size="sm" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Name"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Organization Serial Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={serialNumber}
                    readOnly
                    className="font-mono"
                  />
                  <Button onClick={copySerialNumber} size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this serial number with employees to join your organization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{companyStats.totalEmployees}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Hours/Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{companyStats.avgHoursPerWeek}h</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{companyStats.avgEfficiency}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">{companyStats.activeToday}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading employee data...</div>
                </div>
              ) : employeeData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">No employees found. Share the serial number to add employees.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeData.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last active: {employee.lastActive}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{employee.totalHours}h total</div>
                        <div className={`text-sm ${employee.efficiency >= 80 ? 'text-green-600' : employee.efficiency >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {employee.efficiency}% efficiency
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Lists */}
          <div className="space-y-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Award className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((employee, index) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.efficiency}% efficiency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowPerformers.map((employee) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                        !
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.efficiency}% efficiency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}