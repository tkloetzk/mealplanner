export const NutriScore = ({
  score,
  size = "normal",
}: {
  score: string;
  size?: "normal" | "medium" | "large";
}) => {
  const scoreConfig: Record<string, { color: string; text: string }> = {
    a: { color: "bg-green-500", text: "Excellent nutritional quality" },
    b: { color: "bg-lime-500", text: "Good nutritional quality" },
    c: { color: "bg-yellow-500", text: "Moderate nutritional quality" },
    d: { color: "bg-orange-500", text: "Low nutritional quality" },
    e: { color: "bg-red-500", text: "Poor nutritional quality" },
  };

  const config = scoreConfig[score.toLowerCase()] || {
    color: "bg-gray-500",
    text: "Score not available",
  };

  const sizeClasses = {
    normal: "w-6 h-6 text-sm",
    medium: "w-8 h-8 text-base",
    large: "w-10 h-10 text-lg",
  }[size];

  return (
    <div className="relative group">
      <div
        className={`${config.color} ${sizeClasses} rounded-full flex items-center justify-center text-white font-bold uppercase`}
      >
        {score}
      </div>
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {config.text}
        </div>
      </div>
    </div>
  );
};
