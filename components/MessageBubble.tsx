"use client";

import { format } from "date-fns";
import ProductCarousel from "./ProductCarousel";

interface Message {
  ts: string;
  role: "user" | "assistant";
  payload: any;
}

interface MessageBubbleProps {
  message: Message;
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

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = message.ts ? new Date(message.ts) : new Date();

  if (isUser) {
    const inputQuery = message.payload?.input_query || "No message";
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[50%]">
          <div className="bg-blue-600 text-white rounded-lg px-4 py-2">
            <p className="text-sm">{inputQuery}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {format(timestamp, "MMM d, h:mm a")}
          </p>
        </div>
      </div>
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
