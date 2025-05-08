import { useCurrency } from "@/hooks/use-currency";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "success" | "error" | "secondary";
  change?: number;
  changePeriod?: string;
  isPercentage?: boolean;
  progressValue?: number;
  isLoading?: boolean;
}

export function SummaryCard({
  title,
  value,
  icon,
  color,
  change,
  changePeriod,
  isPercentage = false,
  progressValue,
  isLoading = false,
}: SummaryCardProps) {
  const { formatAmount } = useCurrency();

  const colorVariants = {
    primary: {
      bg: "bg-primary-50",
      text: "text-primary-500",
      progressBg: "bg-primary-500",
    },
    success: {
      bg: "bg-green-50",
      text: "text-green-500",
      progressBg: "bg-green-500",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-500",
      progressBg: "bg-red-500",
    },
    secondary: {
      bg: "bg-secondary-50",
      text: "text-secondary-500",
      progressBg: "bg-secondary-500",
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 p-3 rounded-md ${colorVariants[color].bg} ${colorVariants[color].text}`}
          >
            <span className="material-icons">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">
                  {isPercentage
                    ? `${value.toFixed(1)}%`
                    : formatAmount(value)
                  }
                </div>
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          {progressValue !== undefined ? (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${colorVariants[color].progressBg} h-2 rounded-full`}
                style={{ width: `${Math.min(progressValue, 100)}%` }}
              ></div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{changePeriod}</span>
              {change !== undefined && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    change >= 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span className="material-icons text-xs mr-1">
                    {change >= 0 ? "arrow_upward" : "arrow_downward"}
                  </span>
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
