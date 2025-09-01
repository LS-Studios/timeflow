"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, YAxis, Cell } from "recharts";
import { MOCK_WORK_DAYS, MOCK_BREAKDOWN_DATA, MOCK_BREAK_TYPE_DATA } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Coffee } from "lucide-react";
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


export default function AnalyticsPage() {
  const { t, language } = useTranslation();
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
  
  const OvertimeBadge = ({ overtime }: { overtime: string }) => {
    const isPositive = overtime.startsWith('+');
    
    return (
       <Badge variant={isPositive ? 'default' : 'destructive'} className={cn('flex items-center', isPositive ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30')}>
          <span>{overtime}</span>
        </Badge>
    );
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto px-4">
      <h1 className="text-2xl font-bold mb-2">{t('analytics')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('analyticsDescription')}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
                     {MOCK_BREAKDOWN_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={workBreakdownChartConfig[entry.type as keyof typeof workBreakdownChartConfig].color} />
                    ))}
                  </Pie>
                   <ChartLegend
                    content={<ChartLegendContent nameKey="type" />}
                    className="mt-4 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
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
                   {MOCK_BREAK_TYPE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={breakTypeChartConfig[entry.type as keyof typeof breakTypeChartConfig].color} />
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
                    <p className="font-semibold flex items-center gap-1"><Clock className="h-4 w-4" /> {day.workDuration}</p>
                  </div>
                  <div>
                     <p className="text-muted-foreground">{t('breakDuration')}</p>
                     <p className="font-semibold flex items-center gap-1"><Coffee className="h-4 w-4" /> {day.breakDuration}</p>
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
                      <TableCell className="text-right">
                         <Badge variant={day.overtime.startsWith('+') ? 'default' : 'destructive'} className={day.overtime.startsWith('+') ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30'}>
                          {day.overtime}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
