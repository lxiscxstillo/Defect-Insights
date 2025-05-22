"use client";

import type { DefectRecord, NumericalStats, FrequencyDistribution } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart as LBarChart, PieChart as LPieChart, LineChart as LLineChart, TrendingUp, ListChecks } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { calculateDescriptiveStats, calculateFrequencyDistribution, createHistogramData } from '@/lib/statistics';
import { useMemo } from 'react';

interface DescriptiveStatsCardProps {
  data: DefectRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-2 border border-border rounded shadow-lg">
        <p className="label text-sm font-medium">{`${label}`}</p>
        <p className="intro text-sm text-foreground">{`Count : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


export default function DescriptiveStatsCard({ data }: DescriptiveStatsCardProps) {
  const repairCosts = useMemo(() => data.map(d => d.repair_cost), [data]);
  const stats = useMemo(() => calculateDescriptiveStats(repairCosts), [repairCosts]);

  const defectTypeFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.defect_type)), [data]);
  const severityFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.severity)), [data]);
  const locationFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.defect_location)), [data]);
  const inspectionFreq = useMemo(() => calculateFrequencyDistribution(data.map(d => d.inspection_method)), [data]);

  const histogramData = useMemo(() => createHistogramData(repairCosts, 10), [repairCosts]);
  
  const formatFrequencyDataForChart = (freq: FrequencyDistribution) => {
    return Object.entries(freq).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0,10); // Top 10
  };

  if (data.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" />Descriptive Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data loaded to calculate statistics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-primary" />Descriptive Statistics</CardTitle>
        <CardDescription>Summary statistics and distributions for defect data, focusing on repair costs and categorical attributes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Repair Cost Statistics</h3>
          {stats ? (
            <Table>
              <TableBody>
                <TableRow><TableCell>Mean</TableCell><TableCell className="text-right">${stats.mean.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Median</TableCell><TableCell className="text-right">${stats.median.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Mode</TableCell><TableCell className="text-right">{Array.isArray(stats.mode) ? stats.mode.join(', ') : stats.mode ?? 'N/A'}</TableCell></TableRow>
                <TableRow><TableCell>Std. Deviation</TableCell><TableCell className="text-right">${stats.stdDev.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Variance</TableCell><TableCell className="text-right">${stats.variance.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Min</TableCell><TableCell className="text-right">${stats.min.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Max</TableCell><TableCell className="text-right">${stats.max.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Range</TableCell><TableCell className="text-right">${stats.range.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Q1 (25th Pctl)</TableCell><TableCell className="text-right">${stats.q1.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>Q3 (75th Pctl)</TableCell><TableCell className="text-right">${stats.q3.toFixed(2)}</TableCell></TableRow>
                <TableRow><TableCell>IQR</TableCell><TableCell className="text-right">${stats.iqr.toFixed(2)}</TableCell></TableRow>
              </TableBody>
            </Table>
          ) : <p>No repair cost data available.</p>}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Repair Cost Distribution (Histogram)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bin" angle={-30} textAnchor="end" height={70} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }}/>
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--primary), 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
           <p className="text-xs text-muted-foreground text-center mt-1">Note: Boxplot visualization for Repair Cost is represented numerically (Q1, Median, Q3, Min, Max) above.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FrequencyChart title="Defect Types" data={formatFrequencyDataForChart(defectTypeFreq)} icon={<ListChecks className="mr-2 h-5 w-5 text-accent" />} />
          <FrequencyChart title="Severity Levels" data={formatFrequencyDataForChart(severityFreq)} icon={<LPieChart className="mr-2 h-5 w-5 text-accent" />} />
          <FrequencyChart title="Defect Locations" data={formatFrequencyDataForChart(locationFreq)} icon={<LLineChart className="mr-2 h-5 w-5 text-accent" />} />
          <FrequencyChart title="Inspection Methods" data={formatFrequencyDataForChart(inspectionFreq)} icon={<LBarChart className="mr-2 h-5 w-5 text-accent" />} />
        </div>
      </CardContent>
    </Card>
  );
}

interface FrequencyChartProps {
  title: string;
  data: { name: string; count: number }[];
  icon?: React.ReactNode;
}

function FrequencyChart({ title, data, icon }: FrequencyChartProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
        {icon}{title} (Top 10)
      </h3>
      {data.length > 0 ? (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, width: 95 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent), 0.1)' }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" name="Frequency" barSize={20}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <p className="text-muted-foreground text-sm">No data for {title}.</p>}
    </div>
  );
}
