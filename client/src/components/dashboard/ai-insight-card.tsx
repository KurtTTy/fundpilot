import { Button } from "@/components/ui/button";

interface AIInsightCardProps {
  type: string;
  title: string;
  description: string;
  actionText: string;
  icon: string;
}

export function AIInsightCard({
  type,
  title,
  description,
  actionText,
  icon,
}: AIInsightCardProps) {
  const getBackgroundColor = () => {
    switch (type) {
      case "spending":
        return "bg-blue-50";
      case "saving":
        return "bg-green-50";
      case "subscription":
        return "bg-purple-50";
      case "forecast":
        return "bg-indigo-50";
      default:
        return "bg-gray-50";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "spending":
        return "bg-blue-100 text-blue-600";
      case "saving":
        return "bg-green-100 text-green-600";
      case "subscription":
        return "bg-purple-100 text-purple-600";
      case "forecast":
        return "bg-indigo-100 text-indigo-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "spending":
        return "text-blue-900";
      case "saving":
        return "text-green-900";
      case "subscription":
        return "text-purple-900";
      case "forecast":
        return "text-indigo-900";
      default:
        return "text-gray-900";
    }
  };

  const getDescriptionColor = () => {
    switch (type) {
      case "spending":
        return "text-blue-700";
      case "saving":
        return "text-green-700";
      case "subscription":
        return "text-purple-700";
      case "forecast":
        return "text-indigo-700";
      default:
        return "text-gray-700";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "spending":
        return "text-blue-800 hover:text-blue-900";
      case "saving":
        return "text-green-800 hover:text-green-900";
      case "subscription":
        return "text-purple-800 hover:text-purple-900";
      case "forecast":
        return "text-indigo-800 hover:text-indigo-900";
      default:
        return "text-gray-800 hover:text-gray-900";
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getBackgroundColor()}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div
            className={`h-10 w-10 rounded-full ${getIconColor()} flex items-center justify-center`}
          >
            <span className="material-icons">{icon}</span>
          </div>
        </div>
        <div className="ml-4">
          <h4 className={`text-sm font-medium ${getTextColor()}`}>{title}</h4>
          <p className={`mt-1 text-sm ${getDescriptionColor()}`}>
            {description}
          </p>
          <div className="mt-3">
            <Button
              variant="link"
              className={`px-0 py-0 h-auto text-xs font-medium ${getButtonColor()}`}
            >
              {actionText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
