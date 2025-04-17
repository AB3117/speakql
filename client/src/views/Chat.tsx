import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '@/App';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type QueryResponse = {
  raw_sql: string;
  confirmation_required: boolean;
  message: string;
  result?: any;
  status?: string;
  error?: any;
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

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ0OTEyNjIwfQ.LR2OSDHQZ4orsd7zLY_f7RYu-HesjsVSboYS2KiH2vg';

export default function ChatbotPage() {
  const [input, setInput] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [rawSQL, setrawSQL] = useState('');
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [dbConfig, setDbConfig] = useState<UserDatabaseType>({
    host: '',
    port: '',
    db_user: '',
    db_password: '',
    db_name: '',
  });

  const [databases, setDatabases] = useState<DatabasesType[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const requestDeleteDatabase = async (id: number) => {
    try {
      const res = await axios.delete(`${API_URL}/databases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(res.data);

      await requestGetDatabases();
    } catch (error) {
      console.log(error);
    }
  };

  const requestGetDatabases = async () => {
    try {
      const res = await axios.get(`${API_URL}/get_databases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDatabases(res.data);
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const requestAddDatabase = async () => {
    try {
      await axios.post(`${API_URL}/databases`, dbConfig, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await requestGetDatabases();
    } catch (error) {
      console.log(error);
    } finally {
      setDbConfig({
        host: '',
        port: '',
        db_user: '',
        db_password: '',
        db_name: '',
      });
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
          db_id: selectedDbId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setrawSQL(res.data.raw_sql);
      setResponses((prev) => [...prev, res.data]);
    } catch (error) {
      console.error(error);
    } finally {
      setInput('');
    }
  };

  const requestExecuteSQL = async () => {
    try {
      setPrompts((prev) => [...prev, 'Yes']);

      const res = await axios.post(
        `${API_URL}/agent/execute-sql`,
        {
          raw_sql: rawSQL,
          db_id: selectedDbId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(res.data);

      // Create a successful response object with the query results
      const successResponse: QueryResponse = {
        raw_sql: rawSQL,
        confirmation_required: false,
        message: 'Query executed successfully',
        result: res.data.result,
        status: res.data.status,
        error: res.data.error,
      };

      setResponses((prev) => [...prev, successResponse]);
    } catch (error) {
      console.error(error);
      // Handle failed execution
      const errorResponse: QueryResponse = {
        raw_sql: rawSQL,
        confirmation_required: false,
        message: `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      };
      
      setResponses((prev) => [...prev, errorResponse]);
    } finally {
      setrawSQL('');
    }
  };

  // Helper function to render query results as a table
  const renderQueryResults = (result: any) => {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return <p className="text-gray-700 italic">No results returned</p>;
    }

    // Extract column headers from the first result object
    const headers = Object.keys(result[0]);

    return (
      <div className="overflow-x-auto mt-3 rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className="py-2 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.map((row: any, rowIdx: number) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header, colIdx) => (
                  <td 
                    key={`${rowIdx}-${colIdx}`} 
                    className="py-2 px-4 border-b border-gray-200 text-sm"
                  >
                    {String(row[header] !== null ? row[header] : 'null')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [prompts, responses]);

  useEffect(() => {
    requestGetDatabases();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-indigo-100 to-white">
      <header className="px-6 py-4 shadow-md bg-white z-10 flex justify-between items-center">
        <h1 className="text-4xl font-bold drop-shadow-sm">
          SpeakQL
          <span className="text-lg text-neutral-500 italic font-medium mx-4">
            ({selectedDbId !== 0 && databases.find((db) => db.id === selectedDbId)?.db_name})
          </span>
        </h1>

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
                onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
              />
              <Input
                placeholder="Port"
                value={dbConfig.port}
                onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
              />
              <Input
                placeholder="User"
                value={dbConfig.db_user}
                onChange={(e) => setDbConfig({ ...dbConfig, db_user: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={dbConfig.db_password}
                onChange={(e) => setDbConfig({ ...dbConfig, db_password: e.target.value })}
              />
              <Input
                placeholder="Database Name"
                value={dbConfig.db_name}
                onChange={(e) => setDbConfig({ ...dbConfig, db_name: e.target.value })}
              />

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={requestAddDatabase}
              >
                Add database
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
              <ul className="space-y-2">
                {databases.length === 0 ? (
                  <p>No databases found.</p>
                ) : (
                  databases.map((db) => (
                    <li
                      key={db.id}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <strong>{db.db_name}</strong> — {db.host}:{db.port}
                        </div>
                        {selectedDbId === db.id && (
                          <span className="text-sm text-gray-500 italic">(selected)</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white px-3"
                          onClick={() => {
                            setSelectedDbId(db.id);
                          }}
                        >
                          Select
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white px-3"
                          onClick={() => requestDeleteDatabase(db.id)}
                        >
                          Delete
                        </Button>
                      </div>
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
              <div key={`conversation-${index}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[75%] px-5 py-3 rounded-3xl text-base shadow-md bg-indigo-600 text-white self-end ml-auto"
                >
                  {prompt}
                </motion.div>

                {responses[index] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-[95%] px-5 py-3 rounded-3xl text-base shadow-md bg-gray-100 text-gray-800 self-start mt-4"
                  >
                    {responses[index].raw_sql && (
                      <div className="mb-3">
                        <SyntaxHighlighter
                          language="sql"
                          style={oneDark}
                          customStyle={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                          }}
                        >
                          {responses[index].raw_sql}
                        </SyntaxHighlighter>
                      </div>
                    )}
                    
                    <p className="text-gray-700 mb-2">{responses[index].message}</p>
                    
                    {/* Display result data as a table if available */}
                    {responses[index].result && Array.isArray(responses[index].result) && (
                      <>
                        <p className="font-medium text-gray-900 mt-3 mb-1">Query Results:</p>
                        {renderQueryResults(responses[index].result)}
                      </>
                    )}
                    
                    {/* Display status if available */}
                    {responses[index].status && (
                      <p className={`text-sm mt-2 ${responses[index].status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {responses[index].status}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
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
              onKeyDown={(e) => e.key === 'Enter' && requestGenerateQuery()}
              className="flex-1 border-gray-300 rounded-full px-4 py-2 shadow-sm"
            />
            <Button
              onClick={requestGenerateQuery}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0}
            >
              Send
            </Button>
            <Button
              onClick={requestExecuteSQL}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0 || !rawSQL}
            >
              Execute SQL
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
