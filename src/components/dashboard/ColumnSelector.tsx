import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { SlidersHorizontal } from "lucide-react";

interface ColumnSelectorProps {
  allColumns: string[];
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
}

export default function ColumnSelector({ allColumns, visibleColumns, onChange }: ColumnSelectorProps) {
  const toggle = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length <= 1) return; // keep at least 1
      onChange(visibleColumns.filter((c) => c !== col));
    } else {
      onChange([...visibleColumns, col]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-border/50 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground gap-2">
          <SlidersHorizontal size={14} />
          Campos
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-2" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2">Colunas visíveis</p>
        {allColumns.map((col) => (
          <label
            key={col}
            className="flex items-center gap-2 cursor-pointer text-sm text-foreground hover:text-primary transition-colors py-1"
          >
            <Checkbox
              checked={visibleColumns.includes(col)}
              onCheckedChange={() => toggle(col)}
            />
            {col}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
