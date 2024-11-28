"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from "./hooks/useChat";

const queryClient = new QueryClient();

function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="px-4 w-full min-h-screen flex flex-col gap-5 items-center pb-5">
        <h1 className="text-4xl font-Kanit md:text-5xl font-bold text-white mt-10">
          Chat with EDO Assistant
        </h1>

        <section className="w-full max-w-3xl flex-1 flex flex-col overflow-hidden relative bg-gray-800 rounded-lg">
          <div className="messages-container flex-1 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
              >
                <div
                  className={`rounded-2xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  } p-3 max-w-[80%]`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 rounded-2xl p-3">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl flex gap-2"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            className="flex-1 rounded-lg p-4 bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Chat />
    </QueryClientProvider>
  );
}
