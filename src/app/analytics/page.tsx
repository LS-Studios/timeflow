
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-provider";
import { useAuth } from "@/lib/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, YAxis, Cell, LineChart, Line, Label } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Coffee, Target, BookOpen, BarChart2, CheckCircle, Circle, Percent, Edit, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DayHistory, Session, LearningObjective } from "@/lib/types";
import { storageService } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditLearningDialog } from "@/components/edit-learning-dialog";
import { WorkDayDetailDialog } from "@/components/work-day-detail-dialog";
import { useToast } from "@/hooks/use-toast";


const workBreakdownChartConfig = {
  work: { label: "Work", color: "hsl(var(--primary))" },
  breaks: { label: "Breaks", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const breakTypeChartConfig = {
  count: { label: "Count" },
  coffee: { label: "Coffee", color: "hsl(var(--chart-1))" },
  toilet: { label: "Toilet", color: "hsl(var(--chart-2))" },
  freshair: { label: "Fresh Air", color: "hsl(var(--chart-3))" },
  smoking: { label: "Smoking", color: "hsl(var(--chart-4))" },
  other: { label: "Other", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const learningFocusChartConfig = {
  sessions: { label: "Sessions" },
} satisfies ChartConfig;

const completionChartConfig = {
  completion: { label: "Completion", color: "hsl(var(--primary))" },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [groupedHistory, setGroupedHistory] = useState<DayHistory[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  
  const [dayToEdit, setDayToEdit] = useState<DayHistory | null>(null);

  const isInOrganization = !!settings.organizationName;

  const processSessions = useCallback((sessions: Session[]) => {
      const groupedByDay: { [key: string]: Session[] } = {};
      sessions.forEach(session => {
          const dayKey = format(new Date(session.start), 'yyyy-MM-dd');
          if (!groupedByDay[dayKey]) {
              groupedByDay[dayKey] = [];
          }
          groupedByDay[dayKey].push(session);
      });

      const finalHistory: DayHistory[] = Object.keys(groupedByDay).map(dayKey => ({
          id: dayKey,
          date: dayKey,
          sessions: groupedByDay[dayKey].sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setGroupedHistory(finalHistory);
      setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (!settings || !user) return;
    
    setIsLoading(true);

    const unsubscribeSessions = storageService.onSessionsChange(user.uid, settings.mode, processSessions);
    const unsubscribeRequests = storageService.onPendingRequestsChange(user.uid, setPendingRequests);

    storageService.getAllTopics(user.uid).then(setAllTopics);

    return () => {
      unsubscribeSessions();
      unsubscribeRequests();
    };
  }, [settings, user, processSessions]);

  const updateAndRefresh = (newSessions: Session[], mode: 'work' | 'learning') => {
      if (!user) return;
      // Saving will trigger the onSessionsChange listener, which will refresh the data
      storageService.saveSessions(user.uid, mode, newSessions);
  }
  
  const handleUpdateLearningSession = (updatedSession: Session) => {
    if (!user) return;
    storageService.getSessions(user.uid, 'learning').then(allSessions => {
        const sessionIndex = allSessions.findIndex(s => s.id === updatedSession.id);
        
        if (sessionIndex > -1) {
          allSessions[sessionIndex] = updatedSession;
          updateAndRefresh(allSessions, 'learning');
          setSelectedSession(updatedSession);
        }
        
        setSessionToEdit(null);
    });
  }


  const handleSaveDayChanges = (pendingSessions: Session[]) => {
    if (!dayToEdit || !user) return;

    storageService.getSessions(user.uid, 'work').then(allWorkSessions => {
        // Get all work sessions EXCEPT for the day being edited
        let filteredSessions = allWorkSessions
            .filter(s => format(new Date(s.start), 'yyyy-MM-dd') !== dayToEdit.date);

        // Add the updated sessions for the edited day
        const updatedSessions = [...filteredSessions, ...pendingSessions];
        
        updateAndRefresh(updatedSessions, 'work');
        setDayToEdit(null);
    });
  }

  const handleRequestChange = async (pendingSessions: Session[], reason: string) => {
     if (!dayToEdit || !user) return;
     await storageService.addPendingRequest(user.uid, dayToEdit.date);
     
     console.log("Requesting change for day:", dayToEdit.date);
     console.log("Reason:", reason);
     console.log("New session data:", pendingSessions);
     // In a real app, this would send a request to a backend.
     // Here, we just log it and close the dialog without saving.
     toast({
        title: t('requestSent'),
        description: t('requestSentDescription'),
     });
     setDayToEdit(null);
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const formatString = language === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      return format(date, formatString);
    } catch (e) {
      return dateString;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getDurations = (sessions: Session[]) => {
    let workMs = 0;
    let breakMs = 0;
    sessions.forEach(s => {
      if (s.end) {
        const duration = new Date(s.end).getTime() - new Date(s.start).getTime();
        if (s.type === 'work') {
          workMs += duration;
        } else {
          breakMs += duration;
        }
      }
    });
    return { workMs, breakMs };
  }

  const filteredHistory = groupedHistory.filter(day => {
    const dateMatch = formatDate(day.date).toLowerCase().includes(searchTerm.toLowerCase());
    if (settings.mode === 'work') return dateMatch;

    const learningGoalMatch = day.sessions.some(s => s.learningGoal?.toLowerCase().includes(searchTerm.toLowerCase()));
    const topicMatch = day.sessions.some(s => s.topics?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    return dateMatch || learningGoalMatch || topicMatch;
  });
  
  const OvertimeBadge = ({ overtimeMs }: { overtimeMs: number }) => {
    const isPositive = overtimeMs >= 0;
    const overtimeString = formatDuration(Math.abs(overtimeMs));
    
    return (
       <Badge variant={isPositive ? 'default' : 'destructive'} className={cn('items-center justify-center min-w-[60px]', isPositive ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30')}>
          <span>{isPositive ? '+' : '-'}{overtimeString}</span>
        </Badge>
    );
  }
  
  const CompletionBadge = ({ completion }: { completion: number }) => {
    const colorClass = completion >= 80 ? 'bg-green-500/20 text-green-700' 
                     : completion >= 50 ? 'bg-yellow-500/20 text-yellow-700' 
                     : 'bg-red-500/20 text-red-700';

    return (
      <Badge variant="outline" className={cn('items-center justify-center font-semibold', colorClass)}>
        <Target className="h-3 w-3 mr-1.5" />
        {completion}%
      </Badge>
    )
  }

  const NoDataPlaceholder = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
      <BarChart2 className="h-10 w-10 mb-4" />
      <p className="font-semibold">{t('notEnoughData')}</p>
      <p className="text-sm">{message}</p>
    </div>
  )

  const AnalyticsSkeleton = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent className="flex items-center justify-center"><Skeleton className="h-[200px] w-[200px] rounded-full" /></CardContent>
        </Card>
        <Card>
           <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
           <CardContent className="space-y-4 pt-2">
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
           </CardContent>
        </Card>
         <Card>
           <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
           <CardContent className="flex items-center justify-center h-[160px]"><Skeleton className="h-12 w-1/2" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
        <CardContent>
          <div className="relative mb-4"><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderWorkAnalytics = () => {
     if (groupedHistory.length === 0) {
      return <NoDataPlaceholder message={t('noHistoryDescriptionWork')} />
    }
    // Aggregate data for charts
    const totalWorkMs = groupedHistory.reduce((acc, day) => acc + getDurations(day.sessions).workMs, 0);
    const totalBreakMs = groupedHistory.reduce((acc, day) => acc + getDurations(day.sessions).breakMs, 0);
    const totalOvertimeMs = groupedHistory.reduce((acc, day) => {
        const { workMs } = getDurations(day.sessions);
        const dailyGoalMs = (settings.dailyGoal || 8) * 60 * 60 * 1000;
        return acc + (workMs - dailyGoalMs);
    }, 0);
    const breakTypeCounts = groupedHistory
        .flatMap(day => day.sessions)
        .filter(s => s.type === 'pause' && s.note)
        .reduce((acc, s) => {
            const note = s.note!;
            if (note === t('breakCoffee')) acc.coffee = (acc.coffee || 0) + 1;
            else if (note === t('breakToilet')) acc.toilet = (acc.toilet || 0) + 1;
            else if (note === t('breakFreshAir')) acc.freshair = (acc.freshair || 0) + 1;
            else if (note === t('breakSmoking')) acc.smoking = (acc.smoking || 0) + 1;
            else acc.other = (acc.other || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const workBreakdownData = [
        { type: "work", total: totalWorkMs, fill: "var(--color-work)" },
        { type: "breaks", total: totalBreakMs, fill: "var(--color-breaks)" },
    ];
    const breakTypeData = Object.entries(breakTypeCounts).map(([type, count]) => ({ type, count }));


    return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('workLifeBalance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                  config={workBreakdownChartConfig}
                  className="mx-auto aspect-square h-[200px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={workBreakdownData}
                      dataKey="total"
                      nameKey="type"
                      innerRadius={60}
                      strokeWidth={12}
                    >
                      {workBreakdownData.map((entry) => (
                        <Cell key={`cell-${entry.type}`} fill={workBreakdownChartConfig[entry.type as keyof typeof workBreakdownChartConfig].color} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="type" />}
                      className="-mt-4 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Produktivitätstrend</CardTitle>
              <CardDescription>Arbeitszeit pro Tag der letzten Wochen</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={completionChartConfig} className="h-[200px] w-full">
                <LineChart
                  accessibilityLayer
                  data={groupedHistory.slice(0, 14).reverse().map(day => {
                    const { workMs } = getDurations(day.sessions);
                    const workHours = workMs / (1000 * 60 * 60);
                    return {
                      date: day.date,
                      hours: Math.round(workHours * 10) / 10,
                      goal: settings.dailyGoal || 8
                    };
                  })}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}h`}
                    width={40}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Datum
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {format(new Date(label), 'dd.MM.yyyy')}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Arbeitszeit
                                </span>
                                <span className="font-bold">
                                  {payload[0].value}h
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    dataKey="hours"
                    type="natural"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    dataKey="goal"
                    type="linear"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('overtime')}</CardTitle>
              <CardDescription>{t('overtimeDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[160px]">
              <div className={cn("text-5xl font-bold", totalOvertimeMs >= 0 ? "text-green-500" : "text-red-500")}>
                {totalOvertimeMs >= 0 ? '+' : '-'}{formatDuration(Math.abs(totalOvertimeMs))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('history')}</CardTitle>
            <CardDescription>{t('historyDescriptionWork')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('searchHistory')} 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('workDuration')}</TableHead>
                      <TableHead>{t('breakDuration')}</TableHead>
                      <TableHead className="text-right">{t('overtime')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((day) => {
                      const { workMs, breakMs } = getDurations(day.sessions);
                      const overtimeMs = workMs - ((settings.dailyGoal || 8) * 60 * 60 * 1000);
                      const isPending = pendingRequests.includes(day.date);
                      return (
                        <TableRow key={day.id} onClick={() => setDayToEdit(day)} className="cursor-pointer">
                          <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                          <TableCell>{formatDuration(workMs)}</TableCell>
                          <TableCell>{formatDuration(breakMs)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                                <OvertimeBadge overtimeMs={overtimeMs} />
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center justify-end">
                                {isPending && <Clock className="h-4 w-4 text-yellow-500 mr-2" title={t('requestPending')} />}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
    </>
  )};
  
  const renderLearningAnalytics = () => {
    if (groupedHistory.length === 0) {
      return <NoDataPlaceholder message={t('noHistoryDescriptionLearning')} />
    }

    const allLearningSessions = groupedHistory.flatMap(day => day.sessions.filter(s => s.learningGoal && s.end));
    
    // For "Learning Focus" chart
    const topicData = allLearningSessions
      .flatMap(s => s.topics || [])
      .reduce((acc, topic) => {
          if (!topic) return acc;
          const lowerCaseTopic = topic.toLowerCase();
          acc[lowerCaseTopic] = (acc[lowerCaseTopic] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
    const learningFocusChartData = Object.entries(topicData)
        .map(([topic, sessions]) => ({ topic, sessions }))
        .sort((a,b) => b.sessions - a.sessions);

    // For "Completion over Time" chart
    const completionOverTimeData = allLearningSessions
        .map(session => ({ date: new Date(session.end!), completion: session.completionPercentage || 0 }))
        .sort((a,b) => a.date.getTime() - b.date.getTime());

    // For "Average Session Success" card
    const totalCompletion = allLearningSessions.reduce((acc, s) => acc + (s.completionPercentage || 0), 0);
    const averageCompletion = allLearningSessions.length > 0 ? Math.round(totalCompletion / allLearningSessions.length) : 0;


    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('learningFocus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {learningFocusChartData.length > 0 ? (
                <ChartContainer config={learningFocusChartConfig} className="h-[200px] w-full">
                  <BarChart accessibilityLayer data={learningFocusChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis type="number" dataKey="sessions" hide />
                    <YAxis
                      dataKey="topic"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => (value.charAt(0).toUpperCase() + value.slice(1))}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="sessions" layout="vertical" radius={5} fill="hsl(var(--primary))" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">{t('noTopicsYet')}</div>
              )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>{t('completionOverTime')}</CardTitle>
            </CardHeader>
            <CardContent>
               <ChartContainer config={completionChartConfig} className="h-[200px] w-full">
                <LineChart
                  accessibilityLayer
                  data={completionOverTimeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    width={30}
                  >
                  </YAxis>

                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Line
                    dataKey="completion"
                    type="natural"
                    stroke="var(--color-completion)"
                    strokeWidth={3}
                    dot={true}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('averageSessionSuccess')}</CardTitle>
              <CardDescription>{t('averageSessionSuccessDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[160px]">
              <div className={cn("text-2xl sm:text-4xl md:text-5xl font-bold text-primary flex items-center gap-2")}>
                {averageCompletion}<Percent className="h-6 w-6 sm:h-8 sm:h-8 md:h-10 md:w-10" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('learningHistory')}</CardTitle>
            <CardDescription>{t('learningHistoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('searchHistoryLearning')} 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
             <div className="space-y-4">
              {filteredHistory.flatMap(day => 
                day.sessions
                  .filter(s => s.learningGoal && s.end)
                  .map(learningSession => {
                    const { workMs } = getDurations([learningSession]);

                    return (
                        <Card key={learningSession.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSession(learningSession)}>
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <div>
                                    <p className="font-medium text-sm text-muted-foreground">{formatDate(day.date)}</p>
                                    <p className="font-semibold text-base">{learningSession.learningGoal}</p>
                                </div>
                                {learningSession.completionPercentage !== undefined && (
                                    <CompletionBadge completion={learningSession.completionPercentage} />
                                )}
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground gap-4">
                                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatDuration(workMs)}</div>
                            </div>
                            {learningSession.topics && learningSession.topics.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {learningSession.topics.map(topic => (
                                        <Badge key={topic} variant="secondary">{topic}</Badge>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </>
  )};

  const LearningSessionDetailDialog = () => {
    if (!selectedSession) return null;

    const { learningGoal, learningObjectives = [], completionPercentage } = selectedSession;

    const handleEditClick = () => {
      setSessionToEdit(selectedSession);
      setSelectedSession(null);
    }

    return (
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{learningGoal}</DialogTitle>
            <DialogDescription>{t('learningSessionDetails')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
             {learningObjectives.map((obj, index) => (
                <div key={index} className="flex items-center gap-3">
                    {obj.completed === 100 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-yellow-500" />}
                    <span className="flex-1">{obj.text}</span>
                    <Badge variant="outline">{obj.completed}%</Badge>
                </div>
             ))}
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted mt-4">
            <span className="font-semibold">{t('totalCompletion')}</span>
            <span className="text-xl font-bold text-primary">{completionPercentage}%</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              {t('edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">{t('analytics')}</h1>
      <p className="text-muted-foreground mb-8">
        {settings.mode === 'work' ? t('analyticsDescription') : t('learningAnalyticsDescription')}
      </p>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : settings.mode === 'work' ? (
        renderWorkAnalytics()
      ) : (
        renderLearningAnalytics()
      )}
      
      <LearningSessionDetailDialog />
      <EditLearningDialog
        isOpen={!!sessionToEdit}
        onOpenChange={(isOpen) => !isOpen && setSessionToEdit(null)}
        onSave={handleUpdateLearningSession}
        session={sessionToEdit}
        allTopics={allTopics}
      />
      
      <WorkDayDetailDialog
        day={dayToEdit}
        isOpen={!!dayToEdit}
        onOpenChange={() => setDayToEdit(null)}
        onSave={handleSaveDayChanges}
        onRequestChange={handleRequestChange}
        isInOrganization={isInOrganization}
        isPending={dayToEdit ? pendingRequests.includes(dayToEdit.date) : false}
      />
    </div>
  );
}
