"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
}

export default function AdminInboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'System',
      subject: 'Welcome to Exmony',
      preview: 'Your admin account has been set up successfully. You now have full access to the file management system.',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '2',
      from: 'User Support',
      subject: 'New user registration',
      preview: 'A new user has registered and is awaiting approval. Please review their account.',
      timestamp: '5 hours ago',
      read: false
    },
    {
      id: '3',
      from: 'Security',
      subject: 'System backup completed',
      preview: 'Your scheduled system backup has been completed successfully at 2:00 AM.',
      timestamp: '1 day ago',
      read: true
    }
  ]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  axios.defaults.withCredentials = true;

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const markAsRead = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Inbox</h1>
              <p className="text-gray-400 mt-1">{unreadCount} unread messages</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/profile')}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Profile"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
            <div className="space-y-2">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    markAsRead(message.id);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-colors duration-200 ${
                    selectedMessage?.id === message.id
                      ? 'bg-gray-700/50 border border-gray-600/30'
                      : 'bg-gray-800/20 hover:bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${message.read ? 'text-gray-400' : 'text-white'}`}>
                      {message.from}
                    </span>
                    {!message.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <div className={`text-sm mb-1 ${message.read ? 'text-gray-500' : 'text-gray-300'}`}>
                    {message.subject}
                  </div>
                  <div className="text-xs text-gray-500">{message.timestamp}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
            {selectedMessage ? (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/30">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedMessage.subject}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>From: {selectedMessage.from}</span>
                      <span>•</span>
                      <span>{selectedMessage.timestamp}</span>
                    </div>
                  </div>
                  <button
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">{selectedMessage.preview}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700/30 flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors duration-200">
                    Reply
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200">
                    Forward
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No message selected</h3>
                <p className="text-gray-400">Select a message from the list to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

