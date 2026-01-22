import React, { useState, useRef, useEffect } from 'react';
import { useAnimationState } from '../../hooks/use-animation-state';
import AIAvatar from '../ai-avatar/AIAvatar';
import { TypingAnimation } from '../ai-avatar/TypingAnimations';
import { ProcessingVisuals } from '../ai-avatar/ProcessingVisuals';
import { ResponseAnimation } from '../ai-avatar/ResponseAnimations';
import axios from 'axios';

interface ChatContainerProps {
  userId: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ userId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { updateAnimationState, updateAgentActivity } = useAnimationState();

  // Mock initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI-powered Todo assistant with animated responses. You can ask me to add, list, complete, update, or delete tasks. Try saying "Add a task to buy groceries"',
        timestamp: new Date().toISOString()
      }
    ]);

    // Update avatar to greeting expression
    updateAnimationState({
      avatarExpression: 'greeting',
      triggerEvent: 'welcome_message',
      intensity: 5,
    });
  }, [updateAnimationState]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Update avatar to listening state
    updateAnimationState({
      avatarExpression: 'listening',
      triggerEvent: 'user_message_start',
      intensity: 5,
    });

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Update avatar to processing state
      updateAnimationState({
        avatarExpression: 'processing',
        triggerEvent: 'processing_user_request',
        intensity: 7,
      });

      // Call the backend API
      const response = await axios.post(`http://localhost:8002/api/${userId}/chat`, {
        message: inputValue,
        conversation_id: conversationId
      });

      // Update avatar to thinking state during response
      updateAnimationState({
        avatarExpression: 'thinking',
        triggerEvent: 'generating_response',
        intensity: 6,
      });

      // Simulate a slight delay to show the thinking state
      await new Promise(resolve => setTimeout(resolve, 500));

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.data.response || 'I processed your request.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update avatar to happy/excited state for response
      updateAnimationState({
        avatarExpression: 'happy',
        triggerEvent: 'response_completed',
        intensity: 6,
      });

      if (response.data.conversation_id && !conversationId) {
        setConversationId(response.data.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Update avatar to confused state for error
      updateAnimationState({
        avatarExpression: 'confused',
        triggerEvent: 'error_occurred',
        intensity: 8,
      });
    } finally {
      setIsLoading(false);

      // After a delay, return to neutral state
      setTimeout(() => {
        updateAnimationState({
          avatarExpression: 'neutral',
          triggerEvent: 'idle_state',
          intensity: 1,
        });
      }, 3000);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">AI Todo Assistant</h2>

        {/* AI Avatar with animation */}
        <div className="flex flex-col items-center">
          <AIAvatar conversationId={conversationId} size="large" />
          <span className="mt-1 text-xs text-gray-500">AI Assistant</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => (
            <ResponseAnimation
              key={message.id}
              isVisible={true}
              variant={message.role === 'assistant' ? 'slideIn' : 'fadeIn'}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </ResponseAnimation>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <ResponseAnimation isVisible={true} variant="slideIn">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-600">Thinking...</span>
                    <TypingAnimation variant="dots" color="indigo" />
                  </div>
                  <ProcessingVisuals
                    isActive={true}
                    conversationId={conversationId}
                    className="mt-2"
                  />
                </div>
              </ResponseAnimation>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatContainer;