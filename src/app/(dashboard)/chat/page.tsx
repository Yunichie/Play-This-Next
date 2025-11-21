import { AIChat } from "@/components/chat/ai-chat";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-4xl font-bold">AI Game Assistant</h1>
        <p className="text-muted-foreground mt-1">
          Ask me anything about what to play next from your library
        </p>
      </div>

      <AIChat />
    </div>
  );
}
