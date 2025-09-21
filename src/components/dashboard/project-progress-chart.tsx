'use client';

import { useEffect, useState, memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface PhaseData {
  phaseId: string;
  phaseName: string;
  color: string;
  progress: number;
  displayOrder: number;
}

interface ProjectProgressData {
  projectId: string;
  projectName: string;
  phases: PhaseData[];
}

interface ProjectProgressChartProps {
  data: ProjectProgressData[];
}

export const ProjectProgressChart = memo(function ProjectProgressChart({ data }: ProjectProgressChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Transform data for Recharts - need to flatten the structure
  const chartData = data.map(project => {
    const dataPoint: Record<string, unknown> = {
      name: project.projectName,
      projectId: project.projectId,
    };

    // Add each phase as a separate key
    project.phases.forEach(phase => {
      dataPoint[phase.phaseId] = phase.progress;
      dataPoint[`${phase.phaseId}_color`] = phase.color;
      dataPoint[`${phase.phaseId}_name`] = phase.phaseName;
    });

    return dataPoint;
  });

  // Get all unique phases across all projects
  const allPhases = new Map();
  data.forEach(project => {
    project.phases.forEach(phase => {
      if (!allPhases.has(phase.phaseId)) {
        allPhases.set(phase.phaseId, {
          id: phase.phaseId,
          name: phase.phaseName,
          color: phase.color,
          displayOrder: phase.displayOrder
        });
      }
    });
  });

  // Sort phases by display order
  const sortedPhases = Array.from(allPhases.values()).sort((a, b) => a.displayOrder - b.displayOrder);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      payload: Record<string, unknown>;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const validPayload = payload.filter(p => p.value > 0);
      if (validPayload.length === 0) return null;

      return (
        <div className="chart-tooltip">
          <div className="flex flex-col mb-2">
            <span className="font-bold text-foreground">
              {label}
            </span>
          </div>
          {validPayload.map((entry, index) => {
            const phaseName = entry.payload[`${entry.dataKey}_name`] as string;
            return (
              <div key={index} className="mt-2 flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  {phaseName}
                </span>
                <span className="font-bold text-foreground">
                  {entry.value}% Complete
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: { payload?: Array<{ value: string; color: string }> }) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {sortedPhases.map((phase) => (
          <div key={phase.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
              {phase.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>No phase progress data available</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: isDark ? '#94a3b8' : '#6b7280' }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: isDark ? '#94a3b8' : '#6b7280' }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        {sortedPhases.map((phase) => (
          <Bar
            key={phase.id}
            dataKey={phase.id}
            stackId="a"
            fill={phase.color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});