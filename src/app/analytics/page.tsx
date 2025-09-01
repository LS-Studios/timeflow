"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, YAxis, Cell, LineChart, Line, Label } from "recharts";
import { MOCK_WORK_DAYS, MOCK_BREAKDOWN_DATA, MOCK_BREAK_TYPE_DATA, MOCK_LEARNING_SESSIONS, MOCK_LEARNING_FOCUS, MOCK_LEARNING_COMPLETION } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Coffee, Target, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
} satisfies ChartConfig;

const completionChartConfig = {
  completion: { label: "Completion", color: "hsl(var(--primary))" },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { t, language } = useTranslation();
  const { mode } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const formatString = language === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
    return format(date, formatString);
  };

  const filteredWorkDays = MOCK_WORK_DAYS.filter(day =>
    formatDate(day.date).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredLearningSessions = MOCK_LEARNING_SESSIONS.filter(session =>
    formatDate(session.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.goal.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const OvertimeBadge = ({ overtime }: { overtime: string }) => {
    const isPositive = overtime.startsWith('+');
    
    return (
       <Badge variant={isPositive ? 'default' : 'destructive'} className={cn('items-center justify-center', isPositive ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30')}>
          <span>{overtime}</span>
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

  const renderWorkAnalytics = () => (
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
                      data={MOCK_BREAKDOWN_DATA}
                      dataKey="total"
                      nameKey="type"
                      innerRadius={60}
                      strokeWidth={12}
                    >
                      {MOCK_BREAKDOWN_DATA.map((entry) => (
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
                <BarChart accessibilityLayer data={MOCK_BREAK_TYPE_DATA} layout="vertical" margin={{ left: 10, right: 10 }}>
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
                    {MOCK_BREAK_TYPE_DATA.map((entry) => (
                        <Cell key={`cell-${entry.type}`} fill={breakTypeChartConfig[entry.type as keyof typeof breakTypeChartConfig].color} />
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
              <div className="text-5xl font-bold text-green-500">+8.5h</div>
              <p className="text-sm text-muted-foreground mt-2">{t('last30days')}</p>
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
              {filteredWorkDays.map((day) => (
                <Card key={day.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <OvertimeBadge overtime={day.overtime} />
                  </div>
                  <div className="flex justify-around text-center text-sm gap-8">
                    <div>
                      <p className="text-muted-foreground">{t('workDuration')}</p>
                      <p className="font-semibold flex items-center gap-1 justify-center"><Clock className="h-4 w-4" /> {day.workDuration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('breakDuration')}</p>
                      <p className="font-semibold flex items-center gap-1 justify-center"><Coffee className="h-4 w-4" /> {day.breakDuration}</p>
                    </div>
                  </div>
                </Card>
              ))}
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
                    {filteredWorkDays.map((day) => (
                      <TableRow key={day.id}>
                        <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                        <TableCell>{day.workDuration}</TableCell>
                        <TableCell>{day.breakDuration}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                              <OvertimeBadge overtime={day.overtime} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
    </>
  );
  
  const renderLearningAnalytics = () => (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('learningFocus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={learningFocusChartConfig} className="h-[200px] w-full">
                <BarChart accessibilityLayer data={MOCK_LEARNING_FOCUS} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis type="number" dataKey="sessions" hide />
                  <YAxis
                    dataKey="topic"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) =>
                      learningFocusChartConfig[value as keyof typeof learningFocusChartConfig]?.label
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="sessions" layout="vertical" radius={5}>
                    {MOCK_LEARNING_FOCUS.map((entry) => (
                        <Cell key={`cell-${entry.topic}`} fill={learningFocusChartConfig[entry.topic as keyof typeof learningFocusChartConfig].color} />
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
                  data={MOCK_LEARNING_COMPLETION}
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
                    tickFormatter={(value) => value.slice(-2)}
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
              {filteredLearningSessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-sm">{formatDate(session.date)}</p>
                    <CompletionBadge completion={session.completion} />
                  </div>
                  <p className="font-semibold text-base mb-2">{session.goal}</p>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                     <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {session.duration}</div>
                     <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {session.topic}</div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
  );

  return (
    <div className="container max-w-5xl py-8 mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">{t('analytics')}</h1>
      <p className="text-muted-foreground mb-8">
        {mode === 'work' ? t('analyticsDescription') : t('learningAnalyticsDescription')}
      </p>

      {mode === 'work' ? renderWorkAnalytics() : renderLearningAnalytics()}

    </div>
  );
}
