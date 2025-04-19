import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '@/constants';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Download, RefreshCw, Copy, Edit2, Save, Database, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useAuth from '@/hooks/useAuth';

type QueryResponse = {
  raw_sql: string;
  confirmation_required: boolean;
  message: string;
  result?: any;
  status?: string;
  error?: any;
  timestamp?: string;
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

type QueryHistoryItem = {
  prompt: string;
  response: QueryResponse;
  timestamp: string;
};

const token = localStorage.getItem('token');

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
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<DatabasesType[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<number>(0);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isEditingSql, setIsEditingSql] = useState(false);
  const [editedSql, setEditedSql] = useState('');
  const [editingSqlIndex, setEditingSqlIndex] = useState<number | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatHeight, setChatHeight] = useState('500px');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { requestLogout } = useAuth();

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleChatSize = () => {
    setIsChatExpanded(!isChatExpanded);
    setChatHeight(isChatExpanded ? '500px' : '80vh');
  };

  const requestDeleteDatabase = async (id: number) => {
    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/databases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(res.data);

      await requestGetDatabases();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const requestGetDatabases = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/get_databases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDatabases(res.data);
      console.log(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const requestAddDatabase = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/databases`, dbConfig, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await requestGetDatabases();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
      setLoading(true);
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

      const response = {
        ...res.data,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, response]);

      // Add to query history
      setQueryHistory((prev) => [
        ...prev,
        {
          prompt: input,
          response: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setInput('');
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const requestExecuteSQL = async (sql = rawSQL) => {
    try {
      setLoading(true);
      setPrompts((prev) => [...prev, 'Execute SQL']);

      const res = await axios.post(
        `${API_URL}/agent/execute-sql`,
        {
          raw_sql: sql || rawSQL,
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
        raw_sql: sql || rawSQL,
        confirmation_required: false,
        message: 'Query executed successfully',
        result: res.data.result,
        status: res.data.status,
        error: res.data.error,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, successResponse]);

      // Add to query history
      setQueryHistory((prev) => [
        ...prev,
        {
          prompt: 'Execute SQL',
          response: successResponse,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error(error);
      // Handle failed execution
      const errorResponse: QueryResponse = {
        raw_sql: sql || rawSQL,
        confirmation_required: false,
        message: `Error executing query: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        status: 'error',
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, errorResponse]);
    } finally {
      setrawSQL('');
      setIsEditingSql(false);
      setEditingSqlIndex(null);
      setEditedSql('');
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  // Copy SQL to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Start editing SQL
  const startEditingSql = (sql: string, index: number) => {
    setEditedSql(sql);
    setIsEditingSql(true);
    setEditingSqlIndex(index);
  };

  // Save edited SQL changes
  const saveEditedSql = (index: number) => {
    // Update the response with edited SQL
    const updatedResponses = [...responses];
    if (index < updatedResponses.length) {
      updatedResponses[index] = {
        ...updatedResponses[index],
        raw_sql: editedSql,
      };
      setResponses(updatedResponses);
    }

    // Update rawSQL if this is the last SQL being edited
    if (index === responses.length - 1) {
      setrawSQL(editedSql);
    }

    // Exit edit mode
    setIsEditingSql(false);
    setEditingSqlIndex(null);
    setEditedSql('');
  };

  // Export results as CSV
  const exportResultsAsCSV = (result: any[]) => {
    if (!result || result.length === 0) return;

    const headers = Object.keys(result[0]);
    const csvRows = [
      headers.join(','),
      ...result.map((row) =>
        headers
          .map((header) => (typeof row[header] === 'string' ? `"${row[header]}"` : row[header]))
          .join(','),
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear conversation history
  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setPrompts([]);
      setResponses([]);
      setrawSQL('');
      setIsEditingSql(false);
      setEditingSqlIndex(null);
      setEditedSql('');
    }
  };

  // Helper function to render query results as a table
  const renderQueryResults = (result: any) => {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return <p className="text-gray-400 italic">No results returned</p>;
    }

    // Extract column headers from the first result object
    const headers = Object.keys(result[0]);

    return (
      <div className="mt-3 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
          <span className="font-medium text-gray-300">Query Results ({result.length} rows)</span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
            onClick={() => exportResultsAsCSV(result)}
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full bg-gray-900">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="py-2 px-4 border-b border-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row: any, rowIdx: number) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                  {headers.map((header, colIdx) => (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className="py-2 px-4 border-b border-gray-700 text-sm text-gray-300"
                    >
                      {String(row[header] !== null ? row[header] : 'null')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [prompts, responses]);

  useEffect(() => {
    requestGetDatabases();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900">
      <header className="px-6 py-4 shadow-md bg-gray-800 z-10 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-4xl font-bold text-indigo-300 flex items-center">
          <div className="bg-indigo-900 p-2 rounded-full mr-3">
            <Database className="text-indigo-300 w-6 h-6" />
          </div>
          SpeakQL
          <span className="text-lg text-gray-400 italic font-medium mx-4">
            {selectedDbId !== 0 && databases.find((db) => db.id === selectedDbId)?.db_name
              ? `(${databases.find((db) => db.id === selectedDbId)?.db_name})`
              : '(No database selected)'}
          </span>
        </h1>

        <div className="flex gap-4">
          {/* Main Dropdown Menu for Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="space-y-2 bg-gray-800 border-gray-700">
              {/* Configure DB Button */}
              <DropdownMenuItem onClick={(e) => e.preventDefault()} className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      Configure DB
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="space-y-4 bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-gray-200">Database Configuration</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Host"
                      value={dbConfig.host}
                      onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    />
                    <Input
                      placeholder="Port"
                      value={dbConfig.port}
                      onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    />
                    <Input
                      placeholder="User"
                      value={dbConfig.db_user}
                      onChange={(e) => setDbConfig({ ...dbConfig, db_user: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    />
                    <Input
                      placeholder="Password"
                      type="password"
                      value={dbConfig.db_password}
                      onChange={(e) => setDbConfig({ ...dbConfig, db_password: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    />
                    <Input
                      placeholder="Database Name"
                      value={dbConfig.db_name}
                      onChange={(e) => setDbConfig({ ...dbConfig, db_name: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    />

                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={requestAddDatabase}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add database'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>

              {/* View Databases Button */}
              <DropdownMenuItem onClick={(e) => e.preventDefault()} className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200">
                      View Databases
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="space-y-4 bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-gray-200">Connected Databases</DialogTitle>
                    </DialogHeader>
                    <ul className="space-y-2">
                      {databases.length === 0 ? (
                        <p className="text-gray-400">No databases found.</p>
                      ) : (
                        databases.map((db) => (
                          <li
                            key={db.id}
                            className="flex items-center justify-between bg-gray-700 px-4 py-2 rounded-lg shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-gray-200">
                                <strong>{db.db_name}</strong> — {db.host}:{db.port}
                              </div>
                              {selectedDbId === db.id && (
                                <span className="text-sm text-gray-400 italic">(selected)</span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white px-3"
                                onClick={() => {
                                  setSelectedDbId(db.id);
                                }}
                              >
                                Select
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white px-3"
                                onClick={() => requestDeleteDatabase(db.id)}
                                disabled={loading}
                              >
                                {loading ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>

              {/* Clear Chat Button */}
              <DropdownMenuItem onClick={(e) => e.preventDefault()} className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={clearConversation}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Clear Chat
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2"
            onClick={requestLogout}
          >
            Log Out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center p-6 relative">
        {/* Main content background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-indigo-500 rounded-full filter blur-3xl"></div>
            <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-blue-500 rounded-full filter blur-3xl"></div>
          </div>
        </div>

        {/* Floating Chat Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-3/4 bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 z-10"
          style={{ maxWidth: '1000px', height: chatHeight }}
        >
          {/* Chat Header */}
          <div className="flex justify-between items-center px-6 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Database className="text-indigo-300 w-5 h-5" />
              <span className="font-medium text-gray-200">SQL Assistant</span>
              {selectedDbId !== 0 && databases.find((db) => db.id === selectedDbId)?.db_name && (
                <span className="text-sm text-gray-400 italic">
                  ({databases.find((db) => db.id === selectedDbId)?.db_name})
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-200"
              onClick={toggleChatSize}
            >
              {isChatExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4" ref={scrollAreaRef} style={{ height: `calc(${chatHeight} - 120px)` }}>
            <div className="flex flex-col space-y-4">
              {prompts.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p className="mb-2">No conversation yet. Start by sending a message.</p>
                  <p className="text-sm">Example: "Show me all schema names in this database"</p>
                </div>
              ) : (
                prompts.map((prompt, index) => (
                  <div key={`conversation-${index}`} className="space-y-4">
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
                        className="max-w-[95%] px-5 py-3 rounded-3xl text-base shadow-md bg-gray-700 text-gray-200 self-start"
                      >
                        {responses[index].raw_sql && (
                          <div className="mb-3 relative group">
                            {isEditingSql && editingSqlIndex === index ? (
                              <div className="mb-2">
                                <Textarea
                                  value={editedSql}
                                  onChange={(e) => setEditedSql(e.target.value)}
                                  className="font-mono text-sm border-2 border-indigo-600 focus:border-indigo-500 rounded-md p-3 w-full h-48 bg-gray-700 text-gray-200"
                                  placeholder="Edit SQL here..."
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                                    onClick={() => {
                                      setIsEditingSql(false);
                                      setEditingSqlIndex(null);
                                      setEditedSql('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => saveEditedSql(index)}
                                  >
                                    <Save size={16} className="mr-1" /> Save Changes
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="absolute top-2 right-2 z-10 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full bg-gray-900 bg-opacity-50 hover:bg-opacity-70 text-white"
                                    onClick={() => startEditingSql(responses[index].raw_sql, index)}
                                  >
                                    <Edit2 size={16} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full bg-gray-900 bg-opacity-50 hover:bg-opacity-70 text-white"
                                    onClick={() => copyToClipboard(responses[index].raw_sql, index)}
                                  >
                                    {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                                  </Button>
                                </div>
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
                              </>
                            )}
                          </div>
                        )}

                        <p className="text-gray-300 mb-2">{responses[index].message}</p>

                        {/* Display result data as a table if available */}
                        {responses[index].result &&
                          Array.isArray(responses[index].result) &&
                          renderQueryResults(responses[index].result)}

                        {/* Display status if available */}
                        {responses[index].status && (
                          <p
                            className={`text-sm mt-2 ${
                              responses[index].status === 'success'
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            Status: {responses[index].status}
                          </p>
                        )}

                        {/* Add "Execute This SQL" button for edited SQL */}
                        {index === responses.length - 1 &&
                          responses[index].raw_sql &&
                          !isEditingSql && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => requestExecuteSQL(responses[index].raw_sql)}
                                disabled={loading}
                              >
                                Execute This SQL
                              </Button>
                            </div>
                          )}
                      </motion.div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2 p-3 border-t border-gray-700 bg-gray-800">
            <Input
              placeholder={selectedDbId === 0 ? 'Select a database first...' : 'Type a message...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  requestGenerateQuery();
                }
              }}
              disabled={selectedDbId === 0 || loading}
              className="flex-1 border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 rounded-full px-4 py-2 shadow-sm"
            />
            <Button
              onClick={requestGenerateQuery}
              className="rounded-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0 || !input.trim() || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
            <Button
              onClick={() => requestExecuteSQL()}
              className="rounded-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0 || !rawSQL || loading}
            >
              {loading ? '...' : 'Execute SQL'}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
