
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, SendIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Predefined responses for common hostel-related queries
const botResponses: Record<string, string> = {
  "how to book a room": "To book a room, go to the 'Book Room' section in your student dashboard. From there, you can request a room by clicking on the 'Request Room' button. The admin will be notified of your request and will allocate a room for you.",
  "when to pay fees": "Hostel fees are typically due at the beginning of each semester. You can check your fee status and payment due dates in the 'Fees' section of your dashboard. We recommend paying on time to avoid late payment penalties.",
  "how to submit a complaint": "To submit a complaint, go to the 'Complaints' section in your dashboard. Fill out the complaint form with details about your issue, select the priority level, and submit. The hostel admin will review and address your complaint.",
  "hostel rules": "Our hostel rules include: maintain silence during study hours (8PM-10PM), no visitors allowed after 8PM, keep your room clean, conserve water and electricity, and report any maintenance issues promptly. Violation of rules may result in disciplinary action.",
  "laundry services": "Laundry services are available from Monday to Saturday, 9AM to 5PM. You can drop your clothes at the laundry room and collect them the next day. There's a nominal fee for each load.",
  "wifi password": "For security reasons, I cannot provide the WiFi password here. Please contact the hostel reception or your floor supervisor to get the current WiFi password.",
  "meal timings": "Meal timings are as follows: Breakfast (7AM-9AM), Lunch (12PM-2PM), and Dinner (7PM-9PM). Please respect the timings as meals will not be served outside these hours.",
  "help": "I can help with information about room booking, fee payments, complaints, hostel rules, facilities, and more. Just ask me anything related to the hostel!"
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI hostel assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Generate bot response
    setTimeout(() => {
      let botResponse = "I'm sorry, I don't have information about that. Please contact the hostel administration for more details.";
      
      // Check for matches in predefined responses
      const lowercaseInput = input.toLowerCase();
      
      // Check for exact matches first
      if (botResponses[lowercaseInput]) {
        botResponse = botResponses[lowercaseInput];
      } else {
        // Check for partial matches
        for (const key of Object.keys(botResponses)) {
          if (lowercaseInput.includes(key)) {
            botResponse = botResponses[key];
            break;
          }
        }
        
        // Check for keyword matches
        if (lowercaseInput.includes("room")) {
          botResponse = "For room-related queries, please visit the 'Book Room' section. If you have specific issues with your room, you can submit a complaint through the 'Complaints' section.";
        } else if (lowercaseInput.includes("fee") || lowercaseInput.includes("payment")) {
          botResponse = "You can view your fee details and make payments in the 'Fees' section. We accept online payments through Razorpay. If you're facing financial difficulties, please contact the administration.";
        } else if (lowercaseInput.includes("complaint") || lowercaseInput.includes("issue") || lowercaseInput.includes("problem")) {
          botResponse = "For any complaints or issues, go to the 'Complaints' section and submit a detailed description. Our team will address it as soon as possible based on the priority level.";
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-6 right-6 w-80 h-96 z-50 flex flex-col shadow-lg rounded-lg overflow-hidden">
          <Card className="flex flex-col h-full">
            <CardHeader className="py-3 px-4 bg-primary text-white flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Hostel Assistant
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-white hover:bg-primary/90" 
                onClick={() => setIsOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-primary text-white">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-2 border-t">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="h-10 w-10">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-white z-50"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </>
  );
};

export default ChatBot;
