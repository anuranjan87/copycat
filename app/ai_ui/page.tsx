"use client";

import { useState, useRef, useCallback, useDeferredValue } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export default function AIPage() {
  const [code, setCode] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hold the Monaco editor instance
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Defer the code for the iframe preview
  const deferredCode = useDeferredValue(code);

  // Handle Monaco mount
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Apply a single find/replace edit to the editor
  const applyEdit = useCallback((find: string, replace: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const fullText = model.getValue();

    // Find the first occurrence of 'find'
    const index = fullText.indexOf(find);
    if (index === -1) {
      console.warn(`Could not find substring: "${find}"`);
      return;
    }

    const startPos = model.getPositionAt(index);
    const endPos = model.getPositionAt(index + find.length);

    // Execute the edit
    editor.executeEdits("ai-edit", [
      {
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        text: replace,
        forceMoveMarkers: true,
      },
    ]);

    // Update our local state to keep the iframe preview in sync
    // (we could also read the new value from the model, but we'll set it)
    setCode(model.getValue());
  }, []);

  // Generate function – now we stream and apply edits live
  const generateWebsite = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setError(null);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCode: code,
          prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by newline and process complete lines
        let lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line for next chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const patch = JSON.parse(trimmed);
            if (patch.find !== undefined && patch.replace !== undefined) {
              applyEdit(patch.find, patch.replace);
            }
          } catch (parseErr) {
            console.warn("Invalid JSON line:", trimmed);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const patch = JSON.parse(buffer.trim());
          if (patch.find !== undefined && patch.replace !== undefined) {
            applyEdit(patch.find, patch.replace);
          }
        } catch (_) { /* ignore */ }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Unknown error");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [code, prompt, applyEdit]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Website Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Monaco Editor */}
        <div className="flex flex-col h-[80vh]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Code Editor</h2>
            <span className="text-sm text-gray-400">{code.length} chars</span>
          </div>
          <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex flex-col h-[80vh]">
          <h2 className="text-lg font-semibold mb-2">Live Preview</h2>
          <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={deferredCode}
              title="Preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* Bottom: Prompt + Generate */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Describe your chang
          </label>
          <textarea
            id="prompt"
            rows={2}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Change the header to a gradient background and update the title"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          onClick={generateWebsite}
          disabled={isGenerating || !prompt.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors whitespace-nowrap"
        >
          {isGenerating ? "Applying edits..." : "Generate"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          ❌ {error}
        </div>
      )}
    </div>
  );
}