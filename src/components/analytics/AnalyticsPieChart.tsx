"use client"

import React from "react"
import { Label, Pie, PieChart } from "recharts"
import { api } from "~/trpc/react"

import {
  Card,
  CardContent,
  CardHeader,
} from "~/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/charts"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

type ChartDataPoint = {
  browser: string
  visitors: number
  fill: string
}

export const AnalyticsPieChart = () => {
  const [currService, setCurrService] = React.useState("Service A");
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>();

  const {
    data: userServiceData,
    isLoading
  } = api.analytics.getNumCustomersPerServiceTier.useQuery();

  const {
    data: allServices,
    isLoading: allServicesLoading
  } = api.service.getAllByUserId.useQuery();

  const chartConfig = React.useMemo(() => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-1))",
    ];

    if (!userServiceData || !currService) {
      return {};
    }

    const serviceTiers = userServiceData.get(currService)!;

    type ChartConfigPoint = { label: string; color: string };
    const config: Record<string, ChartConfigPoint> = {};
    for (let i = 0; i < serviceTiers.length; i++) {
      const tier = serviceTiers[i]!;
      config[tier.tierName] = {
        label: tier.tierName,
        color: colors[i % colors.length]!,
      };
    }

    return config as ChartConfig;
  }, [userServiceData, currService]);

  React.useEffect(() => {
    if (isLoading) return;

    console.log("Changed")

    setChartData(() => {
      return (
        userServiceData?.get(currService)?.map((tier) => ({
          browser: tier.tierName,
          visitors: tier.customerCount,
          fill: chartConfig[tier.tierName]?.color ?? "#ccc"
        }))!
      )
    })
  }, [currService, userServiceData])

  const totalVisitors = React.useMemo(() => {
    if (!userServiceData) {
      return 0;
    }

    if (!userServiceData || !currService || !userServiceData.get(currService)) {
      return 0;
    }

    return userServiceData.get(currService)!.reduce(
      (acc: number, curr) => acc + (curr.customerCount ?? 0),
      0
    );


  }, [currService, userServiceData])

  return (
    <Card className="flex flex-col h-64 w-1/3">
      {
        isLoading || allServicesLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            Loading...
          </div>
        ) : (
          <>
          <CardHeader className="p-0 h-8 relative">
          <div className="absolute right-4 top-4 z-10">
            <Select value={currService} onValueChange={setCurrService}>
              <SelectTrigger className="flex w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {allServices?.map((service) => (
                  <SelectItem
                    key={service.id}
                    value={service.name}
                    className="rounded-xl"
                  >
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </CardHeader>
          <CardContent className="flex-1 grow p-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square max-h-[220px] w-full"
            >
              <PieChart width={250} height={250}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <ChartLegend
                  content={<ChartLegendContent />}
                  layout="vertical"
                  verticalAlign="bottom"
                  align="right"
                  className="flex flex-col items-start w-28 h-20 p-2 mb-4"
                />
                <Pie
                  data={chartData}
                  dataKey="visitors"
                  nameKey="browser"
                  innerRadius={60}
                  strokeWidth={5}
                  cx="48%"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Users
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          </>
        )
      }
    </Card>
  )
}
