// components/api-tester/HeadersTable.tsx
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Trash } from "lucide-react";
import { KeyValue } from "~/types/api-tester";

interface HeadersTableProps {
  headers: KeyValue[];
  updateHeader: (
    id: string,
    key: string,
    value: string,
    enabled: boolean,
  ) => void;
  removeHeader: (id: string) => void;
}

export function HeadersTable({
  headers,
  updateHeader,
  removeHeader,
}: HeadersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: "4rem" }}></TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead style={{ width: "4rem" }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headers.map((header) => (
            <TableRow key={header.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) =>
                    updateHeader(
                      header.id,
                      header.key,
                      header.value,
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={header.key}
                  onChange={(e) =>
                    updateHeader(
                      header.id,
                      e.target.value,
                      header.value,
                      header.enabled,
                    )
                  }
                  placeholder="Key"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={header.value}
                  onChange={(e) =>
                    updateHeader(
                      header.id,
                      header.key,
                      e.target.value,
                      header.enabled,
                    )
                  }
                  placeholder="Value"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHeader(header.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
