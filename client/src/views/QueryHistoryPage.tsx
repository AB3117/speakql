import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Database,
  ChevronDown 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { API_URL } from '@/constants';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Database {
  id: number;
  name: string;
  description?: string;
}

interface QueryHistoryItem {
  id: number;
  user_id: number;
  db_id: number;
  prompt: string;
  raw_sql: string;
  status: string;
  result?: any;
  error?: string;
  timestamp: string;
}

interface GroupedQueries {
  [date: string]: QueryHistoryItem[];
}

export default function QueryHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dbIdParam = searchParams.get('dbId');
  
  const [selectedDbId, setSelectedDbId] = useState<number>(dbIdParam ? Number(dbIdParam) : 0);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchDatabases();
    } else {
      navigate('/login');
    }
  }, [token]);

  useEffect(() => {
    if (dbIdParam && Number(dbIdParam) !== selectedDbId) {
      setSelectedDbId(Number(dbIdParam));
    }
  }, [dbIdParam]);

  useEffect(() => {
    if (selectedDbId !== 0) {
      fetchQueryHistory();
      
      // Update URL with the selected database ID
      if (dbIdParam !== selectedDbId.toString()) {
        setSearchParams({ dbId: selectedDbId.toString() });
      }
    }
  }, [selectedDbId]);

  const fetchDatabases = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_databases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatabases(response.data);
      
      // If no database is selected but we have databases, select the first one
      if (selectedDbId === 0 && response.data.length > 0 && !dbIdParam) {
        setSelectedDbId(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
    }
  };

  const fetchQueryHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/query-history/${selectedDbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Sort by timestamp desc (newest first)
      const sortedHistory = response.data.sort((a: QueryHistoryItem, b: QueryHistoryItem) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setQueryHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching query history:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDatabaseChange = (value: string) => {
    setSelectedDbId(Number(value));
  };

  // Group queries by date for better organization
  const groupQueriesByDate = (): GroupedQueries => {
    const grouped: GroupedQueries = {};
    queryHistory.forEach(query => {
      const date = new Date(query.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(query);
    });
    return grouped;
  };

  // Format timestamp to human-readable format
  const formatTime = (timestamp: string): string => {
    try {
      const date = parseISO(timestamp);
      return format(date, 'h:mm a');
    } catch (e) {
      return timestamp;
    }
  };

  // Format date for section headers
  const formatDate = (dateStr: string): string => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    if (dateStr === today) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return dateStr;
  };

  // Build execution status badge
  const statusBadge = (status: string) => {
    const bgColor = status === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = status === 'success' ? 'text-green-700' : 'text-red-700';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-100 to-white">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold mr-4">Query History</h1>
          
          {/* Database Selector */}
          <div className="ml-auto">
            <Select 
              value={selectedDbId.toString()} 
              onValueChange={handleDatabaseChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id.toString()}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : databases.length === 0 ? (
          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No databases found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have access to any databases yet.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : queryHistory.length === 0 ? (
          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No query history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There's no query history for this database yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Queries</TabsTrigger>
                <TabsTrigger value="success">Successful</TabsTrigger>
                <TabsTrigger value="error">Failed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-6">
                {Object.entries(groupQueriesByDate()).map(([date, queries]) => (
                  <div key={date}>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar size={18} className="mr-2 text-indigo-500" />
                      {formatDate(date)}
                    </h2>
                    <div className="space-y-4">
                      {queries.map((query, idx) => (
                        <Card key={idx} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                          <CardHeader className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Clock size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-600">{formatTime(query.timestamp)}</span>
                                {query.status && statusBadge(query.status)}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-gray-200"
                                onClick={() => copyToClipboard(query.raw_sql, `all-${idx}`)}
                              >
                                {copiedIndex === `all-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <SyntaxHighlighter
                              language="sql"
                              style={oneDark}
                              customStyle={{
                                margin: '0',
                                padding: '1rem',
                                borderRadius: '0',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                              }}
                            >
                              {query.raw_sql}
                            </SyntaxHighlighter>
                            
                            {query.prompt && (
                              <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Prompt:</span> {query.prompt}
                                </p>
                              </div>
                            )}
                            
                            {query.error && (
                              <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Error:</span> {query.error}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="success" className="space-y-6">
                {Object.entries(groupQueriesByDate()).map(([date, queries]) => {
                  const successQueries = queries.filter(q => q.status === 'success');
                  if (successQueries.length === 0) return null;
                  
                  return (
                    <div key={date}>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <Calendar size={18} className="mr-2 text-indigo-500" />
                        {formatDate(date)}
                      </h2>
                      <div className="space-y-4">
                        {successQueries.map((query, idx) => (
                          <Card key={idx} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Clock size={16} className="text-gray-500" />
                                  <span className="text-sm text-gray-600">{formatTime(query.timestamp)}</span>
                                  {statusBadge('success')}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full hover:bg-gray-200"
                                  onClick={() => copyToClipboard(query.raw_sql, `success-${idx}`)}
                                >
                                  {copiedIndex === `success-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <SyntaxHighlighter
                                language="sql"
                                style={oneDark}
                                customStyle={{
                                  margin: '0',
                                  padding: '1rem',
                                  borderRadius: '0',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.5',
                                }}
                              >
                                {query.raw_sql}
                              </SyntaxHighlighter>
                              
                              {query.prompt && (
                                <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Prompt:</span> {query.prompt}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="error" className="space-y-6">
                {Object.entries(groupQueriesByDate()).map(([date, queries]) => {
                  const errorQueries = queries.filter(q => q.status === 'error');
                  if (errorQueries.length === 0) return null;
                  
                  return (
                    <div key={date}>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <Calendar size={18} className="mr-2 text-indigo-500" />
                        {formatDate(date)}
                      </h2>
                      <div className="space-y-4">
                        {errorQueries.map((query, idx) => (
                          <Card key={idx} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Clock size={16} className="text-gray-500" />
                                  <span className="text-sm text-gray-600">{formatTime(query.timestamp)}</span>
                                  {statusBadge('error')}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full hover:bg-gray-200"
                                  onClick={() => copyToClipboard(query.raw_sql, `error-${idx}`)}
                                >
                                  {copiedIndex === `error-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <SyntaxHighlighter
                                language="sql"
                                style={oneDark}
                                customStyle={{
                                  margin: '0',
                                  padding: '1rem',
                                  borderRadius: '0',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.5',
                                }}
                              >
                                {query.raw_sql}
                              </SyntaxHighlighter>
                              
                              {query.error && (
                                <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                                  <p className="text-sm text-red-700">
                                    <span className="font-medium">Error:</span> {query.error}
                                  </p>
                                </div>
                              )}
                              
                              {query.prompt && (
                                <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Prompt:</span> {query.prompt}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
