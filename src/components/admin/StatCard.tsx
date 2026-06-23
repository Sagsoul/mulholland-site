interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accent?: "navy" | "gold" | "green" | "red";
}

const accentMap = {
  navy: "border-navy text-navy",
  gold: "border-gold text-gold",
  green: "border-green-500 text-green-600",
  red: "border-red-500 text-red-600",
};

export default function StatCard({ title, value, subtitle, icon, accent = "navy" }: Props) {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${accentMap[accent]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${accentMap[accent].split(" ")[1]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}
