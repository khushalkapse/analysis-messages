"use client";

import MessageBubble from "./MessageBubble";

interface Message {
  ts: string;
  role: "user" | "assistant";
  payload: any;
}

interface ChatViewProps {
  conversation: Message[];
  senderId: string | null;
  receiverId?: string | null;
}

export default function ChatView({
  conversation,
  senderId,
  receiverId,
}: ChatViewProps) {
  if (!senderId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg">
            Select a conversation to view messages
          </p>
        </div>
      </div>
    );
  }

  if (!conversation || conversation.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg">
            No messages in this conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
      <div className="w-full">
        <div className="mb-6 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Conversation</h2>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-gray-400">
              Sender ID: <span className="text-gray-300">{senderId}</span>
            </p>
            {receiverId && (
              <p className="text-sm text-gray-400">
                Receiver ID: <span className="text-gray-300">{receiverId}</span>
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {conversation.map((message, index) => (
            <MessageBubble key={index} message={message} senderId={senderId} />
          ))}
        </div>
      </div>
    </div>
  );
}
