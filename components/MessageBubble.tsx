"use client";

import { useState } from "react";
import { format } from "date-fns";
import ProductCarousel from "./ProductCarousel";
import DebugModal from "./DebugModal";

interface Message {
  ts: string;
  role: "user" | "assistant";
  payload: any;
}

interface MessageBubbleProps {
  message: Message;
  senderId?: string | null;
}

function parseAssistantPayload(payload: any): {
  text?: string;
  carousel?: any;
  buttonTemplate?: {
    text: string;
    buttons: Array<{ title: string; url: string }>;
  };
} {
  if (!payload || !Array.isArray(payload)) {
    return {};
  }

  const result: {
    text?: string;
    carousel?: any;
    buttonTemplate?: {
      text: string;
      buttons: Array<{ title: string; url: string }>;
    };
  } = {};

  for (const item of payload) {
    // Handle comment_reply with simple text message
    if (item.channel === "comment_reply" && item.payload?.message) {
      result.text = item.payload.message;
    }

    // Handle dm_text with simple text message
    if (item.channel === "dm_text" && item.payload?.message?.text) {
      result.text = item.payload.message.text;
    }

    // Handle dm_text with button template
    if (
      item.channel === "dm_text" &&
      item.payload?.message?.attachment?.payload?.text &&
      item.payload?.message?.attachment?.payload?.buttons
    ) {
      result.buttonTemplate = {
        text: item.payload.message.attachment.payload.text,
        buttons: item.payload.message.attachment.payload.buttons.map(
          (btn: any) => ({
            title: btn.title,
            url: btn.url,
          })
        ),
      };
    }

    // Handle dm_carousel with product elements
    if (
      item.channel === "dm_carousel" &&
      item.payload?.message?.attachment?.payload?.elements
    ) {
      result.carousel = item.payload.message.attachment.payload.elements;
    }
  }

  return result;
}

export default function MessageBubble({ message, senderId }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = message.ts ? new Date(message.ts) : new Date();
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<{ input: any; output: any[] } | null>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  const handleDebugClick = async () => {
    if (!senderId) {
      setDebugError("Sender ID is required");
      setIsDebugModalOpen(true);
      return;
    }

    const inputQuery = message.payload?.input_query;
    if (!inputQuery) {
      setDebugError("Input query not found");
      setIsDebugModalOpen(true);
      return;
    }

    setIsLoadingDebug(true);
    setDebugError(null);
    setIsDebugModalOpen(true);

    try {
      const response = await fetch(
        `/api/debug?sender_id=${encodeURIComponent(senderId)}&input_query=${encodeURIComponent(inputQuery)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch debug data");
      }

      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugError(error instanceof Error ? error.message : "Unknown error occurred");
      setDebugData(null);
    } finally {
      setIsLoadingDebug(false);
    }
  };

  if (isUser) {
    const inputQuery = message.payload?.input_query || "Post / Image";
    return (
      <>
        <div className="flex justify-end mb-4">
          <div className="max-w-[50%]">
            <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
              <p className="text-sm">{inputQuery}</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={handleDebugClick}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Debug
              </button>
              <p className="text-xs text-gray-400">
                {format(timestamp, "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        </div>
        <DebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          input={debugData?.input || null}
          output={debugData?.output || []}
          isLoading={isLoadingDebug}
          error={debugError}
        />
      </>
    );
  }

  const { text, carousel, buttonTemplate } = parseAssistantPayload(
    message.payload
  );

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        {text && !buttonTemplate && (
          <div className="bg-gray-700 text-white rounded-lg px-4 py-2 mb-2">
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          </div>
        )}
        {buttonTemplate && (
          <div className="bg-gray-700 text-white rounded-lg px-4 py-2 mb-2">
            <p className="text-sm whitespace-pre-wrap mb-3">
              {buttonTemplate.text}
            </p>
            <div className="flex flex-col gap-2">
              {buttonTemplate.buttons.map((button, btnIndex) => (
                <a
                  key={btnIndex}
                  href={button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
                >
                  {button.title}
                </a>
              ))}
            </div>
          </div>
        )}
        {carousel && <ProductCarousel elements={carousel} />}
        {!text && !carousel && !buttonTemplate && (
          <div className="bg-gray-700 text-gray-400 rounded-lg px-4 py-2">
            <p className="text-sm">Response data (no displayable content)</p>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {format(timestamp, "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}
