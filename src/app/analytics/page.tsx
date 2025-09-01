
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, YAxis, Cell, LineChart, Line, Label } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Coffee, Target, BookOpen, BarChart2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { DayHistory, Session } from "@/lib/types";
import { storageService } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";

const workBreakdownChartConfig = {
  work: { label: "Work", color: "hsl(var(--primary))" },
  breaks: { label: "Breaks", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const breakTypeChartConfig = {
  count: { label: "Count" },
  coffee: { label: "Coffee", color: "hsl(var(--chart-1))" },
  lunch: { label: "Lunch", color: "hsl(var(--chart-2))" },
  walk: { label: "Walk", color: "hsl(var(--chart-3))" },
  other: { label: "Other", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const learningFocusChartConfig = {
  sessions: { label: "Sessions" },
  react: { label: "React", color: "hsl(var(--chart-1))" },
  typescript: { label: "TypeScript", color: "hsl(var(--chart-2))" },
  figma: { label: "Figma", color: "hsl(var(--chart-3))" },
  go: { label: "Go", color: "hsl(var(--chart-4))" },
  "next.js": { label: "Next.js", color: "hsl(var(--chart-5))" },
  deutsch: { label: "Deutsch", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const completionChartConfig = {
  completion: { label: "Completion", color: "hsl(var(--primary))" },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [groupedHistory, setGroupedHistory] = useState<DayHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!settings) return;
    setIsLoading(true);
    const relevantSessions = storageService.getSessions(settings.mode);

    // Group sessions by day
    const groupedByDay: { [key: string]: Session[] } = {};
    relevantSessions.forEach(session => {
        const dayKey = format(new Date(session.start), 'yyyy-MM-dd');
        if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(session);
    });

    const finalHistory: DayHistory[] = Object.keys(groupedByDay).map(dayKey => ({
        id: dayKey,
        date: dayKey,
        sessions: groupedByDay[dayKey]
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setGroupedHistory(finalHistory);
    setIsLoading(false);
  }, [settings.mode, settings]);
  

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

  const filteredHistory = groupedHistory.filter(day =>
    formatDate(day.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (settings.mode === 'learning' && day.sessions.some(s => s.learningGoal?.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
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
            else if (note === t('breakLunch')) acc.lunch = (acc.lunch || 0) + 1;
            else if (note === t('breakFreshAir')) acc.walk = (acc.walk || 0) + 1;
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
              <CardTitle>{t('breakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={breakTypeChartConfig} className="h-[200px] w-full">
                <BarChart accessibilityLayer data={breakTypeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis type="number" dataKey="count" hide />
                  <YAxis
                    dataKey="type"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) =>
                      breakTypeChartConfig[value as keyof typeof breakTypeChartConfig]?.label
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="count" layout="vertical" radius={5}>
                    {breakTypeData.map((entry) => (
                        <Cell key={`cell-${entry.type}`} fill={breakTypeChartConfig[entry.type as keyof typeof breakTypeChartConfig]?.color || '#ccc'} />
                      ))}
                  </Bar>
                </BarChart>
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
            <CardDescription>{t('historyDescription')}</CardDescription>
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
            {/* Mobile View: List of Cards */}
            <div className="md:hidden space-y-4">
              {filteredHistory.map((day) => {
                  const { workMs, breakMs } = getDurations(day.sessions);
                  const overtimeMs = workMs - ((settings.dailyGoal || 8) * 60 * 60 * 1000);
                  return (
                    <Card key={day.id} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-medium">{formatDate(day.date)}</p>
                        <OvertimeBadge overtimeMs={overtimeMs} />
                      </div>
                      <div className="flex justify-around text-center text-sm gap-8">
                        <div>
                          <p className="text-muted-foreground">{t('workDuration')}</p>
                          <p className="font-semibold flex items-center gap-1 justify-center"><Clock className="h-4 w-4" /> {formatDuration(workMs)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('breakDuration')}</p>
                          <p className="font-semibold flex items-center gap-1 justify-center"><Coffee className="h-4 w-4" /> {formatDuration(breakMs)}</p>
                        </div>
                      </div>
                    </Card>
                  );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block border rounded-md">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('workDuration')}</TableHead>
                      <TableHead>{t('breakDuration')}</TableHead>
                      <TableHead className="text-right">{t('overtime')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((day) => {
                      const { workMs, breakMs } = getDurations(day.sessions);
                      const overtimeMs = workMs - ((settings.dailyGoal || 8) * 60 * 60 * 1000);
                      return (
                        <TableRow key={day.id}>
                          <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                          <TableCell>{formatDuration(workMs)}</TableCell>
                          <TableCell>{formatDuration(breakMs)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                                <OvertimeBadge overtimeMs={overtimeMs} />
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

    // Aggregate learning data
    const allLearningSessions = groupedHistory.flatMap(day => day.sessions.filter(s => s.learningGoal));
    const learningFocusData = allLearningSessions
      .flatMap(s => s.topics || [])
      .reduce((acc, topic) => {
          const key = topic.toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
    const learningFocusChartData = Object.entries(learningFocusData)
        .map(([topic, sessions]) => ({ topic, sessions }))
        .sort((a,b) => b.sessions - a.sessions);

    const completionOverTimeData = groupedHistory
        .flatMap(day => day.sessions)
        .map(session => {
            return session.learningGoal && session.completionPercentage !== undefined && session.end
                ? { date: new Date(session.end), completion: session.completionPercentage } 
                : null;
        })
        .filter((item): item is { date: Date; completion: number } => item !== null)
        .sort((a,b) => a.date.getTime() - b.date.getTime());


    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('learningFocus')}</CardTitle>
            </CardHeader>
            <CardContent>
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
                    // Capitalize topic
                    tickFormatter={(value) => learningFocusChartConfig[value as keyof typeof learningFocusChartConfig]?.label || (value.charAt(0).toUpperCase() + value.slice(1))}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="sessions" layout="vertical" radius={5}>
                    {learningFocusChartData.map((entry) => (
                        <Cell key={`cell-${entry.topic}`} fill={learningFocusChartConfig[entry.topic as keyof typeof learningFocusChartConfig]?.color || 'hsl(var(--muted))'} />
                      ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
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
                    right: 20,
                    left: 0,
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
                placeholder={t('searchHistory')} 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
             <div className="space-y-4">
              {filteredHistory.map((day) => {
                return day.sessions.map(learningSession => {
                  if (!learningSession.learningGoal) return null;
                  
                  const { workMs } = getDurations([learningSession]);

                  return (
                      <Card key={learningSession.id} className="p-4">
                          <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-sm">{formatDate(day.date)}</p>
                          {learningSession.completionPercentage !== undefined && (
                              <CompletionBadge completion={learningSession.completionPercentage} />
                          )}
                          </div>
                          <p className="font-semibold text-base mb-2">{learningSession.learningGoal}</p>
                          <div className="flex items-center text-sm text-muted-foreground gap-4">
                              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatDuration(workMs)}</div>
                              {learningSession.topics && learningSession.topics.length > 0 && (
                                  <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {learningSession.topics.join(', ')}</div>
                              )}
                          </div>
                      </Card>
                  )
                });
              })}
            </div>
          </CardContent>
        </Card>
      </>
  )};

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

    </div>
  );
}

    