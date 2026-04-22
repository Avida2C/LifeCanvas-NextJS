"use client";

import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { addMyQuote, saveAffirmation } from "@/lib/storage";

function InspireEditorInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [includeAuthor, setIncludeAuthor] = useState(
    searchParams.get("kind") === "quote",
  );
  const [textDraft, setTextDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const text = textDraft.trim();
    if (!text || loading) return;
    setLoading(true);
    if (includeAuthor) {
      await addMyQuote(text, authorDraft);
    } else {
      await saveAffirmation(text);
    }
    setLoading(false);
    router.back();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Inspiration"
        theme={theme}
        actions={[
          {
            icon: Save,
            label: "Save",
            onClick: () => void handleSave(),
            disabled: loading || !textDraft.trim(),
          },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label
            className="text-sm font-bold"
            style={{ color: theme.text }}
            htmlFor="inspire-editor-text"
          >
            {includeAuthor ? "Quote" : "Affirmation"}
          </label>
          <textarea
            id="inspire-editor-text"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholder={includeAuthor ? "The quote text..." : "I am capable..."}
            autoFocus
          />
        </div>

        <label
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <input
            type="checkbox"
            checked={includeAuthor}
            onChange={(e) => setIncludeAuthor(e.target.checked)}
            className="size-4"
          />
          Include author
        </label>

        {includeAuthor ? (
          <div>
            <label
              className="text-sm font-bold"
              style={{ color: theme.text }}
              htmlFor="inspire-editor-author"
            >
              Author
            </label>
            <input
              id="inspire-editor-author"
              value={authorDraft}
              onChange={(e) => setAuthorDraft(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 px-3 py-2"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
              placeholder="Who said it?"
            />
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border-2 py-3 font-semibold"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !textDraft.trim()}
            onClick={() => void handleSave()}
            className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            {includeAuthor ? "Save quote" : "Add affirmation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InspireEditorView() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <InspireEditorInner />
    </Suspense>
  );
}
