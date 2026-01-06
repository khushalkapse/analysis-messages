"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatView from "@/components/ChatView";
import Filters from "@/components/Filters";

interface Message {
  ts: string;
  role: "user" | "assistant";
  payload: any;
}

interface Conversation {
  sender_id: string;
  receiver_id: string;
  conversation: Message[];
}

export default function Dashboard() {
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [receiverIdFilter, setReceiverIdFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableReceiverIds, setAvailableReceiverIds] = useState<string[]>(
    []
  );
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Fetch conversations with TanStack Query
  const {
    data: conversations = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchConversations,
    isRefetching,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - use cache if data is less than 5 minutes old
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cache for 5 minutes
  });

  // Refetch all queries when page changes
  useEffect(() => {
    const refetchAll = async () => {
      await queryClient.refetchQueries();
    };
    refetchAll();
  }, [pathname, queryClient]);

  const handleRefresh = async () => {
    // Invalidate cache to mark data as stale, then refetch
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    await refetchConversations();
  };

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
      ? "Unknown error occurred"
      : null;

  useEffect(() => {
    // Check for receiver_id and sender_id query parameters on mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const receiverIdFromUrl = params.get("receiver_id");
      const senderIdFromUrl = params.get("sender_id");

      if (receiverIdFromUrl) {
        setReceiverIdFilter(receiverIdFromUrl);
      }

      if (senderIdFromUrl) {
        setSelectedSenderId(senderIdFromUrl);
      }
    }
  }, []);

  useEffect(() => {
    // Auto-select first conversation when data loads
    if (conversations.length > 0 && !selectedSenderId) {
      setSelectedSenderId(conversations[0].sender_id);
    }

    // Extract unique receiver IDs for dropdown
    const uniqueReceiverIds = Array.from(
      new Set(conversations.map((conv) => conv.receiver_id))
    ).sort();
    setAvailableReceiverIds(uniqueReceiverIds);
  }, [conversations, selectedSenderId]);

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Filter by receiver_id
    if (receiverIdFilter.trim()) {
      filtered = filtered.filter((conv) =>
        conv.receiver_id
          .toLowerCase()
          .includes(receiverIdFilter.toLowerCase().trim())
      );
    }

    // Filter by search query (sender_id or message content)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((conv) => {
        // Check sender_id
        if (conv.sender_id.toLowerCase().includes(query)) {
          return true;
        }

        // Check message content
        if (conv.conversation && Array.isArray(conv.conversation)) {
          return conv.conversation.some((msg: Message) => {
            if (msg.role === "user" && msg.payload?.input_query) {
              return msg.payload.input_query.toLowerCase().includes(query);
            }
            if (msg.role === "assistant" && Array.isArray(msg.payload)) {
              return msg.payload.some((item: any) => {
                if (item.payload?.message) {
                  const message = item.payload.message;
                  // Handle simple text message
                  if (typeof message === "string") {
                    return message.toLowerCase().includes(query);
                  }
                  // Handle message.text (dm_text)
                  if (message.text && typeof message.text === "string") {
                    return message.text.toLowerCase().includes(query);
                  }
                  // Handle button template
                  if (message.attachment?.payload?.text) {
                    if (
                      message.attachment.payload.text
                        .toLowerCase()
                        .includes(query)
                    ) {
                      return true;
                    }
                  }
                  // Handle carousel elements
                  if (message.attachment?.payload?.elements) {
                    return message.attachment.payload.elements.some(
                      (el: any) => {
                        const title = el.title?.toLowerCase() || "";
                        const subtitle = el.subtitle?.toLowerCase() || "";
                        return (
                          title.includes(query) || subtitle.includes(query)
                        );
                      }
                    );
                  }
                }
                return false;
              });
            }
            return false;
          });
        }

        return false;
      });
    }

    // Sort by most recent message timestamp (descending order)
    filtered.sort((a, b) => {
      const getLatestTimestamp = (conv: Conversation): number => {
        if (
          !conv.conversation ||
          !Array.isArray(conv.conversation) ||
          conv.conversation.length === 0
        ) {
          return 0;
        }
        // Find the most recent timestamp in the conversation
        const timestamps = conv.conversation
          .map((msg: Message) => {
            if (msg.ts) {
              return new Date(msg.ts).getTime();
            }
            return 0;
          })
          .filter((ts) => ts > 0);

        return timestamps.length > 0 ? Math.max(...timestamps) : 0;
      };

      const timestampA = getLatestTimestamp(a);
      const timestampB = getLatestTimestamp(b);

      // Sort in descending order (most recent first)
      return timestampB - timestampA;
    });

    return filtered;
  }, [conversations, receiverIdFilter, searchQuery]);

  const selectedConversation = useMemo(() => {
    if (!selectedSenderId) return null;
    return filteredConversations.find(
      (conv) => conv.sender_id === selectedSenderId
    );
  }, [filteredConversations, selectedSenderId]);

  // Auto-select first conversation if current selection is filtered out
  useEffect(() => {
    // Check if sender_id is in URL and preserve it
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const senderIdFromUrl = params.get("sender_id");

      if (senderIdFromUrl && filteredConversations.length > 0) {
        // If sender_id from URL exists in filtered conversations, select it
        if (
          filteredConversations.find((c) => c.sender_id === senderIdFromUrl)
        ) {
          if (selectedSenderId !== senderIdFromUrl) {
            setSelectedSenderId(senderIdFromUrl);
          }
          return; // Don't auto-select another conversation
        }
      }
    }

    if (
      filteredConversations.length > 0 &&
      selectedSenderId &&
      !filteredConversations.find((c) => c.sender_id === selectedSenderId)
    ) {
      setSelectedSenderId(filteredConversations[0].sender_id);
    } else if (filteredConversations.length > 0 && !selectedSenderId) {
      setSelectedSenderId(filteredConversations[0].sender_id);
    } else if (filteredConversations.length === 0) {
      setSelectedSenderId(null);
    }
  }, [filteredConversations, selectedSenderId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">
          Instagram Conversations
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isRefetching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
          <a
            href="/analytics"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Analytics
          </a>
        </div>
      </div>
      <Filters
        receiverIdFilter={receiverIdFilter}
        searchQuery={searchQuery}
        onReceiverIdChange={setReceiverIdFilter}
        onSearchChange={setSearchQuery}
        availableReceiverIds={availableReceiverIds}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={filteredConversations}
          selectedSenderId={selectedSenderId}
          onSelectSender={setSelectedSenderId}
        />
        <ChatView
          conversation={selectedConversation?.conversation || []}
          senderId={selectedSenderId}
          receiverId={selectedConversation?.receiver_id || null}
        />
      </div>
    </div>
  );
}
