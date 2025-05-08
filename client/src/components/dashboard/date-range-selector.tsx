import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const options = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4">
            {options.map((option) => (
              <Button
                key={option.id}
                variant={value === option.id ? "subtle" : "outline"}
                size="sm"
                className={
                  value === option.id
                    ? "text-primary-700 bg-primary-50 hover:bg-primary-100"
                    : ""
                }
                onClick={() => onChange(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 sm:mt-0">
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Custom Range
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
