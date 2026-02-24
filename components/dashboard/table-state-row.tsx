import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";

type TableStateRowProps = {
  colSpan: number;
  isLoading: boolean;
  emptyMessage: string;
};

export function TableStateRow({ colSpan, isLoading, emptyMessage }: TableStateRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-20 text-center">
        {isLoading ? (
          <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <Spinner className="size-4" />
            Loading...
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">{emptyMessage}</span>
        )}
      </TableCell>
    </TableRow>
  );
}
