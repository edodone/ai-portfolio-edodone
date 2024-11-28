import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

export function useChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I am EDO Assistant. How can I help you today?'
  }]);
  const [input, setInput] = useState('');

  const { mutate: sendMessage, isLoading } = useMutation({
    mutationFn: async (newMessage) => {
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

      return response.json();
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

  console.log(messages);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    sendMessage(userMessage);
  }, [input, sendMessage]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  };
} 