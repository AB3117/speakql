export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  isGroup?: boolean;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: "user" | "bot";
}
