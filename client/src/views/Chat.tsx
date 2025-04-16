import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/App";

type QueryResponse = {
  raw_sql: string;
  confirmation_required: boolean;
  message: string;
};

type UserDatabaseType = {
  host: string;
  port: string;
  db_user: string;
  db_password: string;
  db_name: string;
};

type DatabasesType = {
  id: number;
  user_id: number;
  host: string;
  port: number;
  db_user: string;
  db_name: string;
  created_at: string;
};

export default function ChatbotPage() {
  const [input, setInput] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [rawSQL, setrawSQL] = useState("");
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [dbConfig, setDbConfig] = useState<UserDatabaseType>({
    host: "",
    port: "",
    db_user: "",
    db_password: "",
    db_name: "",
  });

  const [databases, setDatabases] = useState<DatabasesType[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const requestGetDatabases = async () => {
    try {
      const res = await axios.get(`${API_URL}/get_databases`, {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ0NzUxNTQ1fQ.I71RpkjH-KzQCVQL2LyO1tmFzscrF6GSirAS9gDWtpg",
        },
      });

      console.log(res.data);
      setDatabases(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const requestAddDatabase = async () => {
    try {
      const res = await axios.post(`${API_URL}/databases`, dbConfig, {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ0NzUxNTQ1fQ.I71RpkjH-KzQCVQL2LyO1tmFzscrF6GSirAS9gDWtpg",
        },
      });
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const requestGenerateQuery = async () => {
    try {
      if (!input.trim()) return;
      setPrompts((prev) => [...prev, input]);

      const res = await axios.post(
        `${API_URL}/agent/generate-sql`,
        {
          prompt: input,
          db_id: "2",
        },
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ0NzUxNTQ1fQ.I71RpkjH-KzQCVQL2LyO1tmFzscrF6GSirAS9gDWtpg",
          },
        }
      );

      setrawSQL(res.data.raw_sql);
      setResponses((prev) => [...prev, res.data]);
    } catch (error) {
      console.error(error);
    } finally {
      setInput("");
    }
  };

  const requestExecuteSQL = async () => {
    try {
      setPrompts((prev) => [...prev, "Yes"]);

      const res = await axios.post(
        `${API_URL}/agent/exectue-sql`,
        {
          raw_sql: rawSQL,
          db_id: "2",
        },
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ0NzUxNTQ1fQ.I71RpkjH-KzQCVQL2LyO1tmFzscrF6GSirAS9gDWtpg",
          },
        }
      );

      console.log(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setInput("");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prompts, responses]);

  useEffect(() => {
    requestGetDatabases();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-indigo-100 to-white">
      <header className="px-6 py-4 shadow-md bg-white z-10 flex justify-between items-center">
        <h1 className="text-4xl font-bold drop-shadow-sm">SpeakQL</h1>

        <div className="flex gap-4">
          {/* Configure DB Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2">
                Configure DB
              </Button>
            </DialogTrigger>
            <DialogContent className="space-y-4">
              <DialogHeader>
                <DialogTitle>Database Configuration</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Host"
                value={dbConfig.host}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, host: e.target.value })
                }
              />
              <Input
                placeholder="Port"
                value={dbConfig.port}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, port: e.target.value })
                }
              />
              <Input
                placeholder="User"
                value={dbConfig.db_user}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, db_user: e.target.value })
                }
              />
              <Input
                placeholder="Password"
                type="password"
                value={dbConfig.db_password}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, db_password: e.target.value })
                }
              />
              <Input
                placeholder="Database Name"
                value={dbConfig.db_name}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, db_name: e.target.value })
                }
              />

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={requestAddDatabase}>
                Connect
              </Button>
            </DialogContent>
          </Dialog>

          {/* View Databases Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-4 py-2">
                View Databases
              </Button>
            </DialogTrigger>
            <DialogContent className="space-y-4">
              <DialogHeader>
                <DialogTitle>Connected Databases</DialogTitle>
              </DialogHeader>
              <ul className="list-disc list-inside space-y-1">
                {databases.length === 0 ? (
                  <p>No databases found.</p>
                ) : (
                  databases.map((db) => (
                    <li key={db.id}>
                      <strong>{db.db_name}</strong> — {db.host}:{db.port}
                    </li>
                  ))
                )}
              </ul>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
            {prompts.map((prompt, index) => (
              <>
                <motion.div
                  key={`prompt-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[75%] px-5 py-3 rounded-3xl text-base shadow-md bg-indigo-600 text-white self-end">
                  {prompt}
                </motion.div>

                {responses[index] && (
                  <motion.div
                    key={`response-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-[75%] px-5 py-3 rounded-3xl text-base shadow-md bg-gray-100 text-gray-800 self-start whitespace-pre-wrap">
                    {responses[index].raw_sql}
                    <br />
                    {responses[index].message}
                  </motion.div>
                )}
              </>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex items-center gap-3 px-6 py-4 border-t bg-white shadow-inner">
          <div className="flex w-full max-w-4xl mx-auto gap-3">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && requestGenerateQuery()}
              className="flex-1 border-gray-300 rounded-full px-4 py-2 shadow-sm"
            />
            <Button
              onClick={requestGenerateQuery}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              Send
            </Button>
            <Button
              onClick={requestExecuteSQL}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              Execute SQL
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
