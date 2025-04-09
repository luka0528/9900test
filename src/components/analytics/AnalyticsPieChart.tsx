"use client"

import React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { api } from "~/trpc/react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/charts"

export const AnalyticsPieChart = () => {
  const [currService, setCurrService] = React.useState("Service A");
  
  const {
    data: userServiceData,
    isLoading
  } = api.analytics.getNumCustomersPerServiceTier.useQuery();

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
        label: `${tier.tierName} ($${tier.price.toFixed(2)})`,
        color: colors[i % colors.length]!,
      };
    }

    return config as ChartConfig;
  }, [userServiceData]);


  const totalVisitors = React.useMemo(() => {
    if (!userServiceData) {
      return 0;
    }
    console.log("currService", currService, userServiceData.get(currService) ?? 0);

    if (!userServiceData || !currService || !userServiceData.get(currService)) {
      return 0;
    }
    return userServiceData.get(currService)!.reduce(
      (acc: number, curr) => acc + (curr.customerCount ?? 0), 
      0
    );

    
  }, [userServiceData, currService])


  return (
    <Card className="flex flex-col h-64 w-1/4">
      {
        isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            Loading...
          </div>
        ) : (
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={userServiceData?.get(currService)!}
                  dataKey="visitors"
                  nameKey="browser"
                  innerRadius={60}
                  strokeWidth={5}
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
        )
      }
    </Card>
  )
}
