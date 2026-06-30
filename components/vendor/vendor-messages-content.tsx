"use client";

import { useState } from "react";
import { MessageSquare, Search, Send, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupportTicket } from "@/types";

interface Message {
  id: string;
  sender: string;
  avatar?: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  status: "open" | "resolved";
}



export function VendorMessagesContent({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [messages, setMessages] = useState<Message[]>(initialTickets.map(t => ({
    id: t.id,
    sender: "Customer", // Ideally we fetch user details or store it in ticket
    subject: t.subject,
    preview: t.messages[0]?.message || "No message",
    date: new Date(t.createdAt).toLocaleDateString("en-IN"),
    read: true,
    status: t.status === "resolved" ? "resolved" : "open"
  })));
  const [selectedId, setSelectedId] = useState<string | null>(messages.length > 0 ? messages[0].id : null);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");

  const selectedMessage = messages.find(m => m.id === selectedId);

  const filtered = messages.filter((m) => 
    m.sender.toLowerCase().includes(search.toLowerCase()) || 
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!reply.trim()) return;
    setReply("");
  };

  const markResolved = () => {
    if (!selectedId) return;
    setMessages(messages.map(m => m.id === selectedId ? { ...m, status: "resolved" } : m));
  };

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Messages</h1>
        <p className="mt-0.5 text-sm text-stone-500">Communicate with customers and support</p>
      </div>

      <div className="flex-1 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden flex min-h-0">
        {/* Left Sidebar - Message List */}
        <div className="w-1/3 border-r border-stone-200 flex flex-col bg-stone-50/50">
          <div className="p-4 border-b border-stone-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Search messages..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-stone-200 bg-stone-50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelectedId(msg.id);
                  setMessages(messages.map(m => m.id === msg.id ? { ...m, read: true } : m));
                }}
                className={`w-full text-left p-4 border-b border-stone-100 transition hover:bg-stone-50 ${selectedId === msg.id ? 'bg-white border-l-4 border-l-stone-900 shadow-sm' : ''} ${!msg.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${!msg.read ? 'text-stone-900' : 'text-stone-700'}`}>
                    {msg.sender}
                  </span>
                  <span className="text-xs text-stone-500">{msg.date}</span>
                </div>
                <p className={`text-sm mb-1 ${!msg.read ? 'font-medium text-stone-900' : 'text-stone-700'} truncate`}>
                  {msg.subject}
                </p>
                <p className="text-xs text-stone-500 truncate">{msg.preview}</p>
                <div className="mt-2 flex gap-1">
                  {msg.status === "open" ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Open</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>
                  )}
                  {!msg.read && (
                    <Badge className="text-[10px] bg-blue-600 text-white border-transparent">New</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Conversation */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-semibold shrink-0">
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">{selectedMessage.subject}</h2>
                    <p className="text-sm text-stone-500">{selectedMessage.sender} • {selectedMessage.date}</p>
                  </div>
                </div>
                <div>
                  {selectedMessage.status === "open" && (
                    <Button onClick={markResolved} variant="outline" size="sm" className="gap-2 rounded-xl text-stone-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50">
                      <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
                {/* Initial Message */}
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-semibold shrink-0">
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white border border-stone-200 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-stone-700">
                      <p>{selectedMessage.preview}</p>
                      <p className="mt-2">Could you please help me with this?</p>
                    </div>
                    <span className="text-xs text-stone-400 mt-1 block ml-1">{selectedMessage.date}</span>
                  </div>
                </div>

                {/* Example Reply (Mocked) */}
                <div className="flex gap-4 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    Me
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="bg-stone-900 text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[80%]">
                      <p>Hello {selectedMessage.sender.split(' ')[0]},</p>
                      <p className="mt-2">Thank you for reaching out. We are looking into this for you right now.</p>
                    </div>
                    <span className="text-xs text-stone-400 mt-1 block mr-1">Just now</span>
                  </div>
                </div>
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-stone-200 bg-white shrink-0">
                <div className="relative flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply here..."
                    className="flex-1 min-h-[80px] max-h-[150px] p-3 text-sm rounded-xl border border-stone-200 resize-y focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  />
                  <Button onClick={handleSend} disabled={!reply.trim() || selectedMessage.status === "resolved"} className="h-10 rounded-xl bg-stone-900 text-white hover:bg-stone-800 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {selectedMessage.status === "resolved" && (
                  <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> This conversation is marked as resolved.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-6">
              <MessageSquare className="h-12 w-12 text-stone-200 mb-4" />
              <p className="text-base font-medium text-stone-500">No message selected</p>
              <p className="text-sm">Select a conversation from the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
