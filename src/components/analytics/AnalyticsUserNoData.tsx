import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "~/components/ui/card";
  import { Button } from "~/components/ui/button";
  import { CalendarOffIcon } from "lucide-react";
  import Link from "next/link";
  
  export const AnalyticsUserNoData = () => {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Card className="m-4 border-none shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarOffIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">No Analytics Data</CardTitle>
            <CardDescription>
              You must have at least one service.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/service/owned">Add Service</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  