import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import type { ServiceTierData } from "~/app/analytics/services/columns";

type ServiceTableTierTableProps = {
  data: ServiceTierData[];
};
export const ServiceTableTierTable = ({ data }: ServiceTableTierTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="group [&>td]:py-4 [&>th]:h-8">
          <TableHead>Tiers</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Num. Customers</TableHead>
          <TableHead>Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} className="group [&>td]:py-1">
            <TableCell className="w-[200px]">{row.name}</TableCell>
            <TableCell className="w-[100px]">
              A${row.price.toFixed(2)}
            </TableCell>
            <TableCell className="w-[200px]">{row.numCustomers}</TableCell>
            <TableCell>A${row.revenue.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
