import { API_URL } from "@/App";
import { useState } from "react";

type StreamingResponseProps = {
  prompt: string;
  language?: string;
};

type UseChatReturns = {
  response: string;
  getStreamingResponse: (props: StreamingResponseProps) => void;
};

export default function useChat(): UseChatReturns {
  const [response, setResponse] = useState("");

  const getStreamingResponse = async ({
    prompt,
    language,
  }: StreamingResponseProps) => {
    const body = {
      prompt,
      language: language ? language : "en",
    };

    setResponse("");

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Error while streaming:", error);
    }
  };

  const hooks = {
    response,
    getStreamingResponse,
  };

  return hooks;
}
