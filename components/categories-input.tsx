"use client";

import { KeyboardEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Job categories are free-form on the backend (Job.categories is just
// [String], no enum — see jobCreateSchema) — this is a tag input, not a
// resurrected fixed-option select like the old reading-platform genre
// list (deleted; see CLAUDE.md's Open items history).
export function CategoriesInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string[];
  onChange: (categories: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addCategory() {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCategory();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeCategory(category: string) {
    onChange(value.filter((c) => c !== category));
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addCategory}
        placeholder="Type a category and press Enter (e.g. Engineering)"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                aria-label={`Remove ${category}`}
                className="ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
