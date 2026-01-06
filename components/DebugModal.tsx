"use client";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: any;
  output: any[];
  isLoading?: boolean;
  error?: string | null;
}

// Helper function to highlight specific fields in JSON string
function highlightJsonFields(
  jsonString: string,
  highlightKeys: string[]
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Create regex pattern to match the keys we want to highlight
  // This matches: "key": followed by either a string value or other JSON value
  const patterns = highlightKeys.map((key) => {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match: "key": "value" or "key": value (handles strings, numbers, booleans, null, objects, arrays)
    return new RegExp(
      `"${escapedKey}"\\s*:\\s*"([^"\\\\]|\\\\[\\s\\S])*"|"${escapedKey}"\\s*:\\s*[^,\\n\\}\\]]+`,
      "g"
    );
  });

  // Find all matches
  const matches: Array<{ index: number; length: number; key: string }> = [];
  patterns.forEach((pattern, idx) => {
    const key = highlightKeys[idx];
    // Reset regex lastIndex to avoid issues with multiple patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(jsonString)) !== null) {
      // Check if this match overlaps with a previous match
      const overlaps = matches.some(
        (m) =>
          (match.index >= m.index && match.index < m.index + m.length) ||
          (m.index >= match.index && m.index < match.index + match[0].length)
      );

      if (!overlaps) {
        matches.push({
          index: match.index,
          length: match[0].length,
          key: key,
        });
      }
    }
  });

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build the highlighted string
  matches.forEach((match, idx) => {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>
          {jsonString.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Add highlighted match
    const matchText = jsonString.substring(
      match.index,
      match.index + match.length
    );
    parts.push(
      <span
        key={`highlight-${idx}`}
        className="bg-yellow-600 bg-opacity-50 text-yellow-200 font-semibold"
      >
        {matchText}
      </span>
    );

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < jsonString.length) {
    parts.push(<span key="text-end">{jsonString.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : jsonString;
}

export default function DebugModal({
  isOpen,
  onClose,
  input,
  output,
  isLoading = false,
  error = null,
}: DebugModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg w-[90vw] h-[90vh] max-w-7xl flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Debug Data</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading debug data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Input Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2">Input</h3>
                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto border border-gray-700">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {highlightJsonFields(JSON.stringify(input, null, 2), [
                      "query",
                    ])}
                  </pre>
                </div>
              </div>

              {/* Output Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Output
                </h3>
                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto border border-gray-700">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {highlightJsonFields(JSON.stringify(output, null, 2), [
                      "success",
                      "llm_type",
                    ])}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
