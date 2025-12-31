"use client";

interface FiltersProps {
  receiverIdFilter: string;
  searchQuery: string;
  onReceiverIdChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  availableReceiverIds?: string[];
}

export default function Filters({
  receiverIdFilter,
  searchQuery,
  onReceiverIdChange,
  onSearchChange,
  availableReceiverIds = [],
}: FiltersProps) {
  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Receiver ID Filter
          </label>
          <select
            value={receiverIdFilter}
            onChange={(e) => onReceiverIdChange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Receivers</option>
            {availableReceiverIds.map((receiverId) => (
              <option key={receiverId} value={receiverId}>
                {receiverId}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by sender ID or message content..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
