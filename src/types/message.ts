export interface FrontMessage {
  type: string;
  from: "frontend" | "server";
  to: "frontend" | "server";
  content: string;
  userId: string;
  timestamp: number;
}
