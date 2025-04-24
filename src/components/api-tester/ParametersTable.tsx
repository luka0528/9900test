// components/api-tester/ParametersTable.tsx
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
import type { KeyValue } from "~/types/api-tester";

interface ParametersTableProps {
  params: KeyValue[];
  updateParam: (
    id: string,
    key: string,
    value: string,
    enabled: boolean,
  ) => void;
  removeParam: (id: string) => void;
}

export function ParametersTable({
  params,
  updateParam,
  removeParam,
}: ParametersTableProps) {
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
          {params.map((param) => (
            <TableRow key={param.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={(e) =>
                    updateParam(
                      param.id,
                      param.key,
                      param.value,
                      e.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={param.key}
                  onChange={(e) =>
                    updateParam(
                      param.id,
                      e.target.value,
                      param.value,
                      param.enabled,
                    )
                  }
                  placeholder="Key"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={param.value}
                  onChange={(e) =>
                    updateParam(
                      param.id,
                      param.key,
                      e.target.value,
                      param.enabled,
                    )
                  }
                  placeholder="Value"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParam(param.id)}
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
