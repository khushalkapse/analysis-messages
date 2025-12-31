'use client';

interface Conversation {
  sender_id: string;
  receiver_id: string;
  conversation: any[];
}

interface SidebarProps {
  conversations: Conversation[];
  selectedSenderId: string | null;
  onSelectSender: (senderId: string) => void;
}

export default function Sidebar({
  conversations,
  selectedSenderId,
  onSelectSender,
}: SidebarProps) {
  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Conversations</h2>
        <p className="text-sm text-gray-400 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No conversations found
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {conversations.map((conv) => (
              <button
                key={conv.sender_id}
                onClick={() => onSelectSender(conv.sender_id)}
                className={`w-full p-4 text-left hover:bg-gray-700 transition-colors ${
                  selectedSenderId === conv.sender_id
                    ? 'bg-gray-700 border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                    {conv.sender_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {conv.sender_id}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.conversation?.length || 0} message
                      {(conv.conversation?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

