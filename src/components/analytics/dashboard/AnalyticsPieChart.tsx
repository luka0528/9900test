"use client";

import React from "react";
import { Label, Pie, PieChart } from "recharts";
import { api } from "~/trpc/react";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/charts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loading } from "~/components/ui/loading";

export const AnalyticsPieChart = () => {
  const { data: services, isLoading: servicesLoading } =
    api.analytics.getServicesByUser.useQuery();

  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("");

  React.useEffect(() => {
    if (
      services &&
      services.length > 0 &&
      !selectedServiceId &&
      services[0]?.id
    ) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const { data: serviceTierData, isLoading: isServiceTierDataLoading } =
    api.analytics.getNumCustomersPerServiceTier.useQuery(
      { service: selectedServiceId },
      { enabled: !!selectedServiceId },
    );

  const selectedService = React.useMemo(() => {
    return services?.find((service) => service.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const colors = React.useMemo(
    () => [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ],
    [],
  );

  const chartData = React.useMemo(() => {
    console.log("Service Tier Data: 😃 ", serviceTierData);
    if (!serviceTierData) return [];

    const data = serviceTierData.map((tier, index) => ({
      name: tier.tierName,
      value: tier.customerCount,
      fill: colors[index % colors.length],
    }));

    const isZero = data.every((item) => item.value === 0);

    if (isZero) {
      return data.map((item) => ({
        ...item,
        value: 1,
      }));
    }

    return data;
  }, [serviceTierData, colors]);

  const chartConfig = React.useMemo(() => {
    if (!serviceTierData) return {};

    const config: Record<string, { label: string; color: string }> = {};
    serviceTierData.forEach((tier, index) => {
      config[tier.tierName] = {
        label: tier.tierName,
        color: colors[index % colors.length] ?? "#ccc",
      };
    });

    return config;
  }, [serviceTierData, colors]);

  const totalUsers = React.useMemo(() => {
    if (!serviceTierData) return 0;
    return serviceTierData.reduce((sum, tier) => sum + tier.customerCount, 0);
  }, [serviceTierData]);

  return (
    <Card className="flex h-full w-3/5 lg:w-2/5 flex-col">
      {servicesLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          Loading...
        </div>
      ) : (
        <>
          <CardHeader className="relative h-8 p-0">
            <div className="absolute right-4 top-4 z-10">
              <Select
                value={selectedServiceId}
                onValueChange={setSelectedServiceId}
              >
                <SelectTrigger className="flex w-40">
                  <SelectValue placeholder="Select service">
                    {selectedService?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl" align="end">
                  {services?.map((service) => (
                    <SelectItem
                      key={service.id}
                      value={service.id}
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
            {isServiceTierDataLoading ? (
              <Loading />
            ) : (
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
                    verticalAlign="middle"
                    align="right"
                    className="mb-4 flex h-20 w-28 flex-col items-start p-2"
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                    cx="50%"
                    cy="50%"
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
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalUsers.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 24}
                                className="fill-muted-foreground text-sm"
                              >
                                Users
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
};
