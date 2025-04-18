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
import { Check, Download, RefreshCw, Copy, Edit2, Save } from 'lucide-react';
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
  const [rawSQL, setrawSQL] = useState('npm i --save-dev @types/react-syntax-highlighte');
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { requestLogout } = useAuth();

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
      return <p className="text-gray-700 italic">No results returned</p>;
    }

    // Extract column headers from the first result object
    const headers = Object.keys(result[0]);

    return (
      <div className="mt-3 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
          <span className="font-medium text-gray-700">Query Results ({result.length} rows)</span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1"
            onClick={() => exportResultsAsCSV(result)}
          >
            <Download size={14} /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 sticky top-0">
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
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-indigo-100 to-white">
      <header className="px-6 py-4 shadow-md bg-white z-10 flex justify-between items-center">
        <h1 className="text-4xl font-bold drop-shadow-sm">
          SpeakQL
          <span className="text-lg text-neutral-500 italic font-medium mx-4">
            {selectedDbId !== 0 && databases.find((db) => db.id === selectedDbId)?.db_name
              ? `(${databases.find((db) => db.id === selectedDbId)?.db_name})`
              : '(No database selected)'}
          </span>
        </h1>

        <div className="flex gap-4">
          {/* Main Dropdown Menu for Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="space-y-2">
              {/* Configure DB Button */}
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white">
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
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add database'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>

              {/* View Databases Button */}
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800">
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
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <Button
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={clearConversation}
                >
                  <RefreshCw size={16} className="mr-2 test-white" />
                  Clear Chat
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2"
            onClick={requestLogout}
          >
            Log Out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" ref={scrollAreaRef}>
          <div className="flex flex-col space-y-4 max-w-4xl mx-auto pb-4">
            {prompts.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
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
                      className="max-w-[95%] px-5 py-3 rounded-3xl text-base shadow-md bg-gray-100 text-gray-800 self-start"
                    >
                      {responses[index].raw_sql && (
                        <div className="mb-3 relative group">
                          {isEditingSql && editingSqlIndex === index ? (
                            <div className="mb-2">
                              <Textarea
                                value={editedSql}
                                onChange={(e) => setEditedSql(e.target.value)}
                                className="font-mono text-sm border-2 border-indigo-300 focus:border-indigo-400 rounded-md p-3 w-full h-48"
                                placeholder="Edit SQL here..."
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600"
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
                                  className="bg-green-500 hover:bg-green-600 text-white"
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
                                  className="h-8 w-8 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-white"
                                  onClick={() => startEditingSql(responses[index].raw_sql, index)}
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-white"
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

                      <p className="text-gray-700 mb-2">{responses[index].message}</p>

                      {/* Display result data as a table if available */}
                      {responses[index].result &&
                        Array.isArray(responses[index].result) &&
                        renderQueryResults(responses[index].result)}

                      {/* Display status if available */}
                      {responses[index].status && (
                        <p
                          className={`text-sm mt-2 ${
                            responses[index].status === 'success'
                              ? 'text-green-600'
                              : 'text-red-600'
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
                              className="bg-indigo-500 hover:bg-indigo-600 text-white"
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

        <div className="flex items-center gap-3 px-6 py-4 border-t bg-white shadow-inner">
          <div className="flex w-full max-w-4xl mx-auto gap-3">
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
              className="flex-1 border-gray-300 rounded-full px-4 py-2 shadow-sm"
            />
            <Button
              onClick={requestGenerateQuery}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0 || !input.trim() || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
            <Button
              onClick={() => requestExecuteSQL()}
              className="rounded-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={selectedDbId === 0 || !rawSQL || loading}
            >
              {loading ? 'Executing...' : 'Execute SQL'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
