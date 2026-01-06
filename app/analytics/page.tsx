"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Static mapping of receiver_id to names
const RECEIVER_NAMES: Record<string, string> = {
  "17841463322932022": "anuwaytostyle",
};

interface Analytics {
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  responseTypes: {
    dm_text: number;
    dm_carousel: number;
    comment_reply: number;
    button_template: number;
  };
  receiverIds: Record<string, number>;
  senderIds: Record<string, number>;
  verificationCodes: number;
  productCarousels: number;
  topSenders: Array<{ sender_id: string; count: number }>;
  topReceivers: Array<{ receiver_id: string; count: number }>;
}

export default function AnalyticsPage() {
  const [receiverIdFilter, setReceiverIdFilter] = useState<string>("");
  const [availableReceiverIds, setAvailableReceiverIds] = useState<string[]>(
    []
  );
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Fetch all receiver IDs for the filter dropdown
  const { data: allConversations, refetch: refetchConversations } = useQuery({
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

  // Extract unique receiver IDs
  useEffect(() => {
    if (allConversations) {
      const uniqueReceiverIds = Array.from(
        new Set(allConversations.map((conv: any) => conv.receiver_id))
      ).sort() as string[];
      setAvailableReceiverIds(uniqueReceiverIds);
    }
  }, [allConversations]);

  // Fetch analytics with TanStack Query
  const {
    data: analytics,
    isLoading: loading,
    error: queryError,
    refetch: refetchAnalytics,
    isRefetching,
  } = useQuery<Analytics>({
    queryKey: ["analytics", receiverIdFilter],
    queryFn: async () => {
      const url = receiverIdFilter
        ? `/api/analytics?receiver_id=${encodeURIComponent(receiverIdFilter)}`
        : "/api/analytics";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - use cache if data is less than 5 minutes old
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cache for 5 minutes
  });

  const handleRefresh = async () => {
    // Invalidate cache to mark data as stale, then refetch
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    await queryClient.invalidateQueries({
      queryKey: ["analytics", receiverIdFilter],
    });
    await Promise.all([refetchConversations(), refetchAnalytics()]);
  };

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
      ? "Unknown error occurred"
      : null;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
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

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Instagram Webhook Analytics Overview
              {receiverIdFilter && (
                <span className="ml-2 text-blue-400">
                  (Filtered: {receiverIdFilter})
                </span>
              )}
            </p>
          </div>
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
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back to Conversations
            </Link>
          </div>
        </div>

        {/* Receiver ID Filter */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter by Receiver ID
          </label>
          <div className="flex items-center gap-3">
            <select
              value={receiverIdFilter}
              onChange={(e) => setReceiverIdFilter(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Receivers (Show All)</option>
              {availableReceiverIds.map((receiverId) => (
                <option key={receiverId} value={receiverId}>
                  {receiverId}
                </option>
              ))}
            </select>
            {receiverIdFilter && (
              <button
                onClick={() => setReceiverIdFilter("")}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors border border-gray-600"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Conversations"
            value={analytics.totalConversations.toLocaleString()}
            icon="💬"
          />
          <MetricCard
            title="Total Messages"
            value={analytics.totalMessages.toLocaleString()}
            icon="📨"
          />
          <MetricCard
            title="Verification Codes"
            value={analytics.verificationCodes.toLocaleString()}
            icon="🔐"
          />
          <MetricCard
            title="Product Carousels"
            value={analytics.productCarousels.toLocaleString()}
            icon="🛍️"
          />
        </div>

        {/* Response Types */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Response Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">DM Text</p>
              <p className="text-2xl font-bold text-white">
                {analytics.responseTypes.dm_text.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">DM Carousel</p>
              <p className="text-2xl font-bold text-white">
                {analytics.responseTypes.dm_carousel.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Comment Reply</p>
              <p className="text-2xl font-bold text-white">
                {analytics.responseTypes.comment_reply.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Button Template</p>
              <p className="text-2xl font-bold text-white">
                {analytics.responseTypes.button_template.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Top Senders and Receivers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Top 10 Senders (by Total Messages)
            </h2>
            <div className="space-y-2">
              {analytics.topSenders.map((sender, index) => (
                <Link
                  key={sender.sender_id}
                  href={`/?sender_id=${sender.sender_id}`}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className="text-white text-sm font-mono truncate">
                      {sender.sender_id}
                    </span>
                  </div>
                  <span className="text-blue-400 font-semibold">
                    {sender.count} message{sender.count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Top 10 Receivers
            </h2>
            <div className="space-y-2">
              {analytics.topReceivers.map((receiver, index) => (
                <Link
                  key={receiver.receiver_id}
                  href={`/?receiver_id=${receiver.receiver_id}`}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className="text-white text-sm font-mono truncate">
                      {receiver.receiver_id}
                    </span>
                  </div>
                  <span className="text-green-400 font-semibold">
                    {receiver.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Receiver Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Receiver Info</h2>
          <div className="space-y-2">
            {availableReceiverIds.length > 0 ? (
              availableReceiverIds.map((receiverId) => (
                <div
                  key={receiverId}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-white text-sm font-mono truncate">
                      {receiverId}
                    </span>
                    {RECEIVER_NAMES[receiverId] && (
                      <span className="text-blue-400 text-sm font-medium whitespace-nowrap">
                        ({RECEIVER_NAMES[receiverId]})
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/?receiver_id=${receiverId}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors whitespace-nowrap"
                  >
                    View Conversations
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                No receiver IDs found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
