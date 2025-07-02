
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Plus, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: { label: string; action: string }[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AIAssistant = ({ isOpen, onToggle }: AIAssistantProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage leads, assign tasks, and answer questions about your sales pipeline.',
      timestamp: new Date()
    }
  ]);

  const quickActions = [
    { label: 'Show hot leads from last 7 days', icon: Plus },
    { label: 'Assign this lead to Rajeev', icon: Users },
    { label: 'What\'s pending for today?', icon: Calendar },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    // Mock AI response
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `I understand you want to "${message}". Here are some relevant actions you can take:`,
      timestamp: new Date(),
      actions: [
        { label: 'View Hot Leads', action: 'view_hot_leads' },
        { label: 'Create Reminder', action: 'create_reminder' }
      ]
    };

    setMessages(prev => [...prev, userMessage, aiResponse]);
    setMessage('');
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-800 transition-all duration-300 z-40",
      isOpen ? "w-96" : "w-0 overflow-hidden"
    )}>
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <Button onClick={onToggle} variant="ghost" size="sm">
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Quick Actions:</p>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => handleQuickAction(action.label)}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex",
                  msg.type === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    msg.type === 'user' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-800 text-gray-200"
                  )}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.actions && (
                      <div className="mt-3 space-y-2">
                        {msg.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about your leads..."
                className="flex-1 bg-gray-800 border-gray-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
