import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface ChatResponse {
  role: 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I am EDO Assistant. How can I help you today?'
  }]);
  const [input, setInput] = useState<string>('');

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (newMessage: Message) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, newMessage] }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data]);
    },
    onError: (error) => {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }]);
    }
  });

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    sendMessage(userMessage);
  }, [input, sendMessage]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isPending
  };
} 