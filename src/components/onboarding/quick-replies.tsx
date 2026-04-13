"use client";
import { Button } from "@/components/ui/button";

export function QuickReplies({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <Button key={opt} variant="outline" size="sm" onClick={() => onPick(opt)}>
          {opt}
        </Button>
      ))}
    </div>
  );
}
