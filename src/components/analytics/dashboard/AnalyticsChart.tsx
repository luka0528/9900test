"use client";

import React from "react";
import { api } from "~/trpc/react";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "~/components/ui/charts";
import type { ChartConfig } from "~/components/ui/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export const AnalyticsChart = () => {
  const { data: serviceRevenueData = [] } =
    api.analytics.getRevenueGraphByUser.useQuery();

  // Sets-up the chart configuration
  const chartConfig = React.useMemo(() => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-1))",
    ];

    if (!serviceRevenueData || serviceRevenueData.length === 0) {
      return {};
    }

    // Remove the 'date' key from the legend.
    const serviceTypes = Object.keys(serviceRevenueData[0]!).filter(
      (key) => key !== "date",
    );

    type ChartConfigPoint = { label: string; color: string };
    const config: Record<string, ChartConfigPoint> = {};
    for (let i = 0; i < serviceTypes.length; i++) {
      const service = serviceTypes[i]!;
      config[service] = {
        label: service,
        color: colors[i % colors.length]!,
      };
    }

    return config as ChartConfig;
  }, [serviceRevenueData]);

  const [timeRange, setTimeRange] = React.useState("30d");

  const filteredData = React.useMemo(() => {
    const currentDate = new Date();

    return serviceRevenueData.filter((item) => {
      const date = new Date(item.date);
      let daysToSubtract = 0;

      if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "365d") {
        daysToSubtract = 365;
      }

      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);

      return date >= startDate;
    });
  }, [serviceRevenueData, timeRange]);

  return (
    <Card className="my-4">
      <CardHeader className="relative pb-0">
        <CardTitle>Revenue Chart</CardTitle>
        <CardDescription>
          <div className="absolute right-4 top-4">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="@[767px]/card:flex hidden"
            >
              <ToggleGroupItem value="365d" className="h-8 px-2.5">
                Last Year
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="h-8 px-2.5">
                Last 30 days
              </ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="flex w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="365d" className="rounded-lg">
                  Last Year
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <ChartLegend content={<ChartLegendContent />} />
            <defs>
              {Object.entries(chartConfig).map(([key, config]) => (
                <linearGradient
                  key={key}
                  id={`fill${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={config.color}
                    stopOpacity={0.75}
                  />
                  <stop
                    offset="95%"
                    stopColor={config.color}
                    stopOpacity={0.25}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid />
            <XAxis
              dataKey="date"
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string | number | Date) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: number) => {
                return `$${value.toLocaleString()}`;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string | number | Date) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {Object.entries(chartConfig).map(([key, config]) => (
              <Area
                key={key}
                dataKey={key}
                type={timeRange === "30d" ? "monotone" : "step"}
                fill={`url(#fill${key})`}
                stroke={config.color}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
