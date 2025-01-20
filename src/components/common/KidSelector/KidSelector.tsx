import { Kid } from "@/types/user";

// components/KidSelector.tsx
interface KidSelectorProps {
  kids: Kid[];
  selectedKid: string | null;
  onSelect: (kidId: string) => void;
}

export function KidSelector({ kids, selectedKid, onSelect }: KidSelectorProps) {
  return (
    <div className="flex gap-4 mb-6">
      {kids.map((kid) => (
        <button
          key={kid.id}
          onClick={() => onSelect(kid.id)}
          className={`px-6 py-3 rounded-lg font-medium ${
            selectedKid === kid.id
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {kid.name}
        </button>
      ))}
    </div>
  );
}
