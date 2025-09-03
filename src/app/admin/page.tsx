
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-provider";
import { useTranslation } from "@/lib/i18n";
import { Copy, Building, Users, TrendingUp, AlertTriangle, Award, Brain, Clock, BookOpen, BarChart2, Trash2, Share2, PlusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-provider";
import { storageService, type UserAccount } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/types";


interface EmployeeDisplayData {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  efficiency?: number;
  lastActive?: string;
  avgCompletion?: number;
  sessionCount?: number;
  topTopic?: string;
}

export default function AdminPanel() {
  const { settings, isLoaded, updateSettings } = useSettings();
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [organizationName, setOrganizationName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [newOrganizationName, setNewOrganizationName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeDisplayData[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const processEmployeeData = useCallback((rawData: { userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; }[]): EmployeeDisplayData[] => {
      if (settings.mode === 'work') {
          return rawData.map(emp => {
              const allSessions = emp.workSessions || [];
              const totalWorkTime = allSessions.reduce((total, session) => total + (session.totalWorkTime || 0), 0);
              const totalHours = Math.round(totalWorkTime / (1000 * 60 * 60));
              
              const completedSessions = allSessions.filter(s => s.isCompleted).length;
              const totalSessions = allSessions.length;
              const efficiency = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
              
              const lastSession = [...allSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              const lastActive = lastSession ? lastSession.date : "Never";

              return {
                  id: emp.userId,
                  name: emp.account?.name || 'Unknown User',
                  email: emp.account?.email || '',
                  totalHours,
                  efficiency: Math.min(100, Math.max(0, efficiency)),
                  lastActive,
              };
          });
      } else { // Learning Mode
          return rawData.map(emp => {
              const allSessions = emp.learningSessions || [];
              const totalLearningTime = allSessions.reduce((total, session) => total + (session.totalWorkTime || 0), 0);
              const totalHours = Math.round(totalLearningTime / (1000 * 60 * 60));

              const totalCompletion = allSessions.reduce((sum, s) => sum + (s.completionPercentage || 0), 0);
              const avgCompletion = allSessions.length > 0 ? Math.round(totalCompletion / allSessions.length) : 0;
              
              const allTopics = allSessions.flatMap(s => s.topics || []);
              const topTopic = allTopics.length > 0 ? 
                  Object.entries(allTopics.reduce((acc, topic) => { acc[topic] = (acc[topic] || 0) + 1; return acc; }, {} as Record<string, number>))
                  .sort((a, b) => b[1] - a[1])[0][0] 
                  : 'None';

              return {
                  id: emp.userId,
                  name: emp.account?.name || 'Unknown User',
                  email: emp.account?.email || '',
                  totalHours,
                  avgCompletion,
                  sessionCount: allSessions.length,
                  topTopic,
              };
          });
      }
  }, [settings.mode]);

  // Handle initialization and admin mode changes
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!settings.isAdmin) {
      router.push('/');
      return;
    }
    
    const loadOrganizationData = async () => {
      // If an organization is already defined in settings, load from database
      if (settings.organizationSerialNumber) {
        setSerialNumber(settings.organizationSerialNumber);
        
        // Load actual organization data from database
        try {
          const orgData = await storageService.getOrganization(settings.organizationSerialNumber);
          if (orgData) {
            setOrganizationName(orgData.name);
            // Update settings if they're out of sync
            if (settings.organizationName !== orgData.name) {
              updateSettings({ organizationName: orgData.name });
            }
          } else {
            // Organization doesn't exist anymore, clear settings
            setOrganizationName("");
            updateSettings({ organizationName: null, organizationSerialNumber: null });
          }
        } catch (error) {
          console.error('Error loading organization:', error);
          setOrganizationName(settings.organizationName || "");
        }
      } else {
        // Clear any old state if settings don't have an org
        setSerialNumber("");
        setOrganizationName("");
      }
    };

    loadOrganizationData();
  }, [isLoaded, settings.isAdmin, settings.organizationSerialNumber, settings.organizationName, router, updateSettings]);


  useEffect(() => {
    if (!settings.organizationSerialNumber || !settings.isAdmin) {
      setEmployeeData([]);
      setIsLoadingEmployees(false);
      return;
    }
    
    setIsLoadingEmployees(true);
    
    const unsubscribe = storageService.onOrganizationEmployeesChange(
        settings.organizationSerialNumber,
        (data) => {
            const processed = processEmployeeData(data);
            setEmployeeData(processed);
            setIsLoadingEmployees(false);
        }
    );

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [settings.organizationSerialNumber, settings.mode, processEmployeeData, settings.isAdmin]);
  
  const handleCreateOrganization = async () => {
    if (!user || !newOrganizationName.trim()) {
      toast({ title: "Error", description: "Please enter an organization name", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
        const newSerial = Math.random().toString(36).substring(2, 11).toUpperCase();
        await storageService.createOrganization(user.uid, newSerial, newOrganizationName);
        
        // This will update the user's local settings and trigger the main view to render
        updateSettings({ organizationSerialNumber: newSerial, organizationName: newOrganizationName });
        
        setNewOrganizationName("");
        toast({ title: "Organization Created", description: `"${newOrganizationName}" is ready.` });

    } catch (error) {
        console.error('Error creating organization:', error);
        toast({ title: "Error", description: "Failed to create organization", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const copySerialNumber = () => {
    navigator.clipboard.writeText(serialNumber);
    toast({
      title: "Serial Number Copied",
      description: "The organization serial number has been copied to your clipboard.",
    });
  };

  const copyShareLink = () => {
    const shareUrl = `https://timeflow.leshift.de?organisation=${serialNumber}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied",
      description: "The invitation link has been copied to your clipboard.",
    });
  };

  const saveOrganizationName = async () => {
    if (!user || !organizationName.trim()) {
      toast({ title: "Error", description: "Please enter an organization name", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
        await storageService.updateOrganizationName(serialNumber, organizationName);
        updateSettings({ organizationName });
        toast({ title: "Organization Name Updated", description: `Organization name changed to "${organizationName}"` });
    } catch (error) {
      console.error('Error saving organization:', error);
      toast({ title: "Error", description: "Failed to save organization", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteOrganization = async () => {
    if (!settings.organizationSerialNumber) return;
    setIsDeleting(true);
    try {
        await storageService.deleteOrganizationAndCleanup(settings.organizationSerialNumber);
        toast({ title: "Organization Deleted", description: "The organization and all associated employee links have been removed." });
        updateSettings({ organizationName: null, organizationSerialNumber: null });
    } catch (error) {
        console.error("Error deleting organization:", error);
        toast({ title: "Deletion Failed", description: "Could not delete the organization.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  }


  if (!settings.isAdmin) return null;

  const renderWorkAnalytics = () => {
    const topPerformers = employeeData.filter(emp => emp.efficiency! > 90).sort((a, b) => b.efficiency! - a.efficiency!).slice(0, 3);
    const lowPerformers = employeeData.filter(emp => emp.efficiency! < 75).sort((a, b) => a.efficiency! - b.efficiency!).slice(0, 3);
    const companyStats = {
      totalEmployees: employeeData.length,
      avgHoursPerWeek: employeeData.length > 0 ? Math.round(employeeData.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeData.length) : 0,
      avgEfficiency: employeeData.length > 0 ? Math.round(employeeData.reduce((sum, emp) => sum + (emp.efficiency || 0), 0) / employeeData.length) : 0,
    };

    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{companyStats.totalEmployees}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Hours/Week</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold">{companyStats.avgHoursPerWeek}h</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Efficiency</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{companyStats.avgEfficiency}%</span></div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Employee Overview</CardTitle></CardHeader>
            <CardContent>
              {isLoadingEmployees ? <Skeleton className="h-24 w-full" /> : employeeData.length === 0 ? <div className="text-muted-foreground">No employees found.</div> : (
                <div className="space-y-3">{employeeData.map((employee) => (<div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg"><div><div className="font-medium">{employee.name}</div><div className="text-sm text-muted-foreground">Last active: {employee.lastActive}</div></div><div className="text-right"><div className="font-medium">{employee.totalHours}h total</div><div className={`text-sm ${employee.efficiency! >= 80 ? 'text-green-600' : employee.efficiency! >= 65 ? 'text-yellow-600' : 'text-red-600'}`}>{employee.efficiency}% efficiency</div></div></div>))}</div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><Award className="h-5 w-5" />Top Performers</CardTitle></CardHeader>
              <CardContent><div className="space-y-3">{topPerformers.map((employee, index) => (<div key={employee.id} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center">{index + 1}</div><div className="flex-1"><div className="font-medium text-sm">{employee.name}</div><div className="text-xs text-muted-foreground">{employee.efficiency}% efficiency</div></div></div>))}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Needs Attention</CardTitle></CardHeader>
              <CardContent><div className="space-y-3">{lowPerformers.map((employee) => (<div key={employee.id} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">!</div><div className="flex-1"><div className="font-medium text-sm">{employee.name}</div><div className="text-xs text-muted-foreground">{employee.efficiency}% efficiency</div></div></div>))}</div></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderLearningAnalytics = () => {
    const totalLearningHours = employeeData.reduce((sum, emp) => sum + emp.totalHours, 0);
    const totalSessions = employeeData.reduce((sum, emp) => sum + (emp.sessionCount || 0), 0);
    const avgCompletion = employeeData.length > 0 ? Math.round(employeeData.reduce((sum, emp) => sum + (emp.avgCompletion || 0), 0) / employeeData.length) : 0;
    
    const allTopics = employeeData.flatMap(emp => emp.topTopic !== 'None' ? emp.topTopic : []);
    const topicCounts = allTopics.reduce((acc, topic) => { acc[topic as string] = (acc[topic as string] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(item => item[0]);

    const topLearners = [...employeeData].sort((a, b) => b.totalHours - a.totalHours).slice(0, 3);

    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Learning Hours</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{totalLearningHours}h</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. Success Rate</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Award className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold">{avgCompletion}%</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{totalSessions}</span></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Top Topics</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-1 text-xs">{topTopics.map(t => <div key={t} className="bg-muted px-2 py-1 rounded-full">{t}</div>)}</div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Employee Learning Overview</CardTitle></CardHeader>
            <CardContent>
              {isLoadingEmployees ? <Skeleton className="h-24 w-full" /> : employeeData.length === 0 ? <div className="text-muted-foreground">No employees found.</div> : (
                <div className="space-y-3">{employeeData.map((employee) => (<div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg"><div><div className="font-medium">{employee.name}</div><div className="text-sm text-muted-foreground">Top Topic: {employee.topTopic}</div></div><div className="text-right"><div className="font-medium">{employee.totalHours}h learned</div><div className={`text-sm ${employee.avgCompletion! >= 80 ? 'text-green-600' : employee.avgCompletion! >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{employee.avgCompletion}% success rate</div></div></div>))}</div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Brain className="h-5 w-5" />Top Learners</CardTitle></CardHeader>
              <CardContent><div className="space-y-3">{topLearners.map((employee, index) => (<div key={employee.id} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">{index + 1}</div><div className="flex-1"><div className="font-medium text-sm">{employee.name}</div><div className="text-xs text-muted-foreground">{employee.totalHours}h learned</div></div></div>))}</div></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateOrganizationView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Create Your Organization</CardTitle>
        <CardDescription>Give your organization a name to get started. You can invite employees after creation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-org-name">Organization Name</Label>
          <Input 
            id="new-org-name" 
            value={newOrganizationName} 
            onChange={(e) => setNewOrganizationName(e.target.value)} 
            placeholder="e.g., My Awesome Company" 
          />
        </div>
        <Button onClick={handleCreateOrganization} disabled={isLoading || !newOrganizationName.trim()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isLoading ? "Creating..." : "Create Organization"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderDashboardView = () => (
    <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Organization Management</CardTitle>
            <CardDescription>Manage your organization settings and serial number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Enter organization name" />
                <Button onClick={saveOrganizationName} size="sm" disabled={isLoading}>{isLoading ? "Saving..." : "Save Name"}</Button>
              </div>
              <div className="space-y-2">
                <Label>Organization Serial Number</Label>
                <div className="flex gap-2">
                  <Input value={serialNumber} readOnly className="font-mono" />
                  <Button onClick={copySerialNumber} size="icon" variant="outline"><Copy className="h-4 w-4" /></Button>
                  <Button onClick={copyShareLink} size="icon" variant="outline"><Share2 className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this link with employees to have them join your organization</p>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete Organization"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the organization.
                      Employee time data will remain, but the organization link will be broken.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteOrganization} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        
        {settings.mode === 'work' ? renderWorkAnalytics() : renderLearningAnalytics()}
    </>
  );

  return (
    <div className="container max-w-6xl py-8 mx-auto px-4">
      <div className="flex items-center gap-2 mb-8">
        <Building className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      <div className="grid gap-6">
        {settings.organizationSerialNumber ? renderDashboardView() : renderCreateOrganizationView()}
      </div>
    </div>
  );
}
