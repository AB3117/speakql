import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { 
  Database, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Table, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Key,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ERDiagramView from './ERDiagram'; // Import the ERDiagram component
import { useNavigate } from 'react-router-dom';

export default function SchemaVisualizationPage() {
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDbId, setSelectedDbId] = useState(0);
  const [databases, setDatabases] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [expandedTables, setExpandedTables] = useState({});
  const [activeTab, setActiveTab] = useState('visualization'); // 'visualization', 'erdiagram', or 'raw'
  
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Toggle table expansion
  const toggleTableExpansion = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  // Expand all tables
  const expandAllTables = () => {
    const allExpanded = {};
    if (schemaData && schemaData.tables) {
      Object.keys(schemaData.tables).forEach(table => {
        allExpanded[table] = true;
      });
    }
    setExpandedTables(allExpanded);
  };

  // Collapse all tables
  const collapseAllTables = () => {
    setExpandedTables({});
  };

  // Fetch schema data from API
  const fetchSchemaData = useCallback(async (dbId) => {
    if (!dbId || dbId === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/agent/visualize-schema?db_id=${dbId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      let data = response.data;
      
      // Handle string response if needed
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse schema data:", e);
          setError('Invalid schema data format');
          return;
        }
      }
      
      if (!data || !data.tables) {
        setError('Invalid schema data structure');
        return;
      }
      
      setSchemaData(data);
      // Expand the first table by default
      const firstTable = Object.keys(data.tables)[0];
      if (firstTable) {
        setExpandedTables({ [firstTable]: true });
      }
    } catch (err) {
      console.error("Error fetching schema:", err);
      setError(`Failed to load schema data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch databases
  const fetchDatabases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/get_databases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDatabases(res.data);
        // Select first database by default if none selected
        if (selectedDbId === 0) {
          setSelectedDbId(res.data[0].id);
        }
      } else {
        setError('No databases available');
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
      setError(`Failed to load databases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDbId]);

  // Load databases on component mount
  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  // Fetch schema when selected database changes
  useEffect(() => {
    if (selectedDbId !== 0) {
      fetchSchemaData(selectedDbId);
    }
  }, [selectedDbId, fetchSchemaData]);

  // Handle database selection change
  const handleDbChange = (event) => {
    const dbId = Number(event.target.value);
    setSelectedDbId(dbId);
    // Clear previous schema data when changing databases
    setSchemaData(null);
    setExpandedTables({});
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 1.5));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.6));
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(1);
  };

  // Refresh schema data
  const handleRefresh = () => {
    if (selectedDbId !== 0) {
      fetchSchemaData(selectedDbId);
    }
  };

  // Organize tables by relationships to visualize hierarchy
  const getOrganizedTables = useCallback(() => {
    if (!schemaData || !schemaData.tables) return [];
    
    // Find tables with incoming foreign keys
    const tablesWithIncomingFKs = new Set();
    
    Object.entries(schemaData.tables).forEach(([_, tableData]) => {
      const foreignKeys = tableData.structure.foreign_keys || [];
      foreignKeys.forEach(fk => {
        tablesWithIncomingFKs.add(fk.referred_table);
      });
    });
    
    // Group tables by their relationship level
    const levels = [];
    
    // Top level - tables with no incoming foreign keys
    const topLevelTables = Object.keys(schemaData.tables).filter(
      tableName => !tablesWithIncomingFKs.has(tableName)
    );
    
    if (topLevelTables.length > 0) {
      levels.push(topLevelTables);
    }
    
    // Process remaining tables
    let remainingTables = Object.keys(schemaData.tables).filter(
      tableName => !topLevelTables.includes(tableName)
    );
    
    // Loop until all tables are processed or no progress is made
    while (remainingTables.length > 0) {
      const currentLevel = [];
      const stillRemaining = [];
      
      for (const tableName of remainingTables) {
        const tableData = schemaData.tables[tableName];
        // Check if all referred tables are in previous levels
        const allReferredTablesProcessed = (tableData.structure.foreign_keys || []).every(fk => {
          return levels.flat().includes(fk.referred_table);
        });
        
        if (allReferredTablesProcessed) {
          currentLevel.push(tableName);
        } else {
          stillRemaining.push(tableName);
        }
      }
      
      if (currentLevel.length > 0) {
        levels.push(currentLevel);
      } else {
        // If we can't resolve any more tables, just add the remaining ones
        levels.push(stillRemaining);
        break;
      }
      
      remainingTables = stillRemaining;
    }
    
    return levels;
  }, [schemaData]);

  // Get all relationships between tables for visualization
  const getRelationships = useCallback(() => {
    if (!schemaData || !schemaData.tables) return [];
    
    const relationships = [];
    
    Object.entries(schemaData.tables).forEach(([tableName, tableData]) => {
      const foreignKeys = tableData.structure.foreign_keys || [];
      
      foreignKeys.forEach(fk => {
        relationships.push({
          fromTable: tableName,
          fromColumn: fk.constrained_columns[0],
          toTable: fk.referred_table,
          toColumn: fk.referred_columns[0],
          name: fk.name
        });
      });
    });
    
    return relationships;
  }, [schemaData]);

  // Render a table with its structure and sample data
  const renderTable = (tableName) => {
    const tableData = schemaData.tables[tableName];
    const isExpanded = expandedTables[tableName] || false;
    
    // Check if column is part of a foreign key
    const isForeignKey = (columnName) => {
      return (tableData.structure.foreign_keys || []).some(
        fk => fk.constrained_columns.includes(columnName)
      );
    };
    
    // Get relationship details for a column if it's a foreign key
    const getRelationshipDetails = (columnName) => {
      const fk = (tableData.structure.foreign_keys || []).find(
        fk => fk.constrained_columns.includes(columnName)
      );
      
      if (fk) {
        return {
          referencedTable: fk.referred_table,
          referencedColumn: fk.referred_columns[0]
        };
      }
      
      return null;
    };

    return (
      <div 
        key={tableName}
        className={cn(
          "border rounded-lg shadow-lg transition-all duration-200",
          isExpanded ? "border-indigo-500 bg-gray-800" : "border-gray-600 bg-gray-750 hover:border-indigo-400"
        )}
      >
        {/* Table Header */}
        <div 
          className={cn(
            "flex items-center justify-between p-4 cursor-pointer",
            isExpanded ? "border-b border-gray-700" : ""
          )}
          onClick={() => toggleTableExpansion(tableName)}
        >
          <div className="flex items-center">
            <div className="bg-indigo-950 p-2 rounded-lg mr-3">
              <Table className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-200">{tableName}</h3>
              <p className="text-xs text-gray-400">
                {tableData.structure.columns.length} columns • {tableData.sample_data?.length || 0} sample rows
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-indigo-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Table Content - Only shown when expanded */}
        {isExpanded && (
          <div className="p-4">
            {/* Foreign Key Relationships */}
            {tableData.structure.foreign_keys?.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-950 bg-opacity-30 rounded-lg border border-indigo-900">
                <h4 className="text-sm font-semibold text-indigo-300 mb-2">Relationships</h4>
                <div className="space-y-2">
                  {tableData.structure.foreign_keys.map((fk, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <span className="text-indigo-400 font-medium">{fk.constrained_columns[0]}</span>
                      <ArrowRight className="w-4 h-4 mx-2 text-indigo-500" />
                      <span className="text-green-400">{fk.referred_table}.{fk.referred_columns[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Columns */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Columns</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {tableData.structure.columns.map((column) => (
                  <div 
                    key={column.name}
                    className={cn(
                      "flex items-center justify-between p-2 rounded",
                      column.primary_key ? "bg-green-900 bg-opacity-20 border-l-4 border-green-600" :
                      isForeignKey(column.name) ? "bg-indigo-900 bg-opacity-20 border-l-4 border-indigo-600" :
                      "bg-gray-750 border-l-4 border-gray-600"
                    )}
                  >
                    <div className="flex items-center">
                      {column.primary_key ? (
                        <Key className="w-4 h-4 mr-2 text-green-400" />
                      ) : isForeignKey(column.name) ? (
                        <Link className="w-4 h-4 mr-2 text-indigo-400" />
                      ) : null}
                      
                      <span className="font-medium text-gray-200">{column.name}</span>
                      
                      {column.primary_key && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-green-900 text-green-300">PK</span>
                      )}
                      
                      {isForeignKey(column.name) && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-indigo-900 text-indigo-300">FK</span>
                      )}
                      
                      {!column.nullable && !column.primary_key && !isForeignKey(column.name) && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-700 text-gray-300">NOT NULL</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400">{column.type}</span>
                      
                      {isForeignKey(column.name) && (
                        <div className="ml-3 flex items-center text-xs text-indigo-300">
                          <ArrowRight className="w-3 h-3 mx-1" />
                          {(() => {
                            const rel = getRelationshipDetails(column.name);
                            return rel ? `${rel.referencedTable}.${rel.referencedColumn}` : '';
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sample Data */}
            {tableData.sample_data && tableData.sample_data.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Sample Data</h4>
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-800">
                        {Object.keys(tableData.sample_data[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.sample_data.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-750' : 'bg-gray-800'}>
                          {Object.values(row).map((value, valIdx) => (
                            <td key={valIdx} className="px-3 py-2 text-sm whitespace-nowrap text-gray-300">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="px-6 py-4 shadow-md bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-indigo-900 p-2 rounded-full mr-3">
            <Database className="text-indigo-300 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-indigo-300">SpeakQL Schema Visualization</h1>
            {selectedDbId !== 0 && databases.find(db => db.id === selectedDbId) && (
              <p className="text-sm text-gray-400">
                Database: <span className="text-indigo-300">{databases.find(db => db.id === selectedDbId).db_name}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Database Selector */}
          <select
            value={selectedDbId}
            onChange={handleDbChange}
            className="bg-gray-700 border border-gray-600 text-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="0" disabled>Select Database</option>
            {databases.map(db => (
              <option key={db.id} value={db.id}>{db.db_name}</option>
            ))}
          </select>
          
          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={loading || selectedDbId === 0}
              className="bg-gray-700 hover:bg-gray-600"
              title="Refresh Schema"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            
            <Button 
              onClick={handleZoomIn}
              className="bg-gray-700 hover:bg-gray-600"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            
            <Button 
              onClick={handleResetZoom}
              className="bg-gray-700 hover:bg-gray-600 text-xs"
              title="Reset Zoom"
            >
              {zoom.toFixed(1)}x
            </Button>
            
            <Button 
              onClick={handleZoomOut}
              className="bg-gray-700 hover:bg-gray-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
             <Button
            size="sm" 
            className="bg-gray-700 hover:bg-indigo-500 text-gray-300"
            onClick={() => navigate('/chat')}

          >
             DB.Chat
          </Button>


          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-800 px-6 border-b border-gray-700">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'visualization' ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('visualization')}
          >
            Visual Schema
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'erdiagram' ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('erdiagram')}
          >
            ER Diagram
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'raw' ? 'text-indigo-300 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading schema data...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg text-red-300">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        ) : !schemaData ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
            <Database className="w-12 h-12 text-gray-500 mb-3" />
            <p className="text-gray-400 text-lg">
              {selectedDbId === 0 ? "Please select a database to visualize" : "Click refresh to load database schema"}
            </p>
          </div>
        ) : activeTab === 'visualization' ? (
          <div className="relative z-10">
            {/* Schema Info */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-200">Schema Information</h2>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300"
                    onClick={expandAllTables}
                    title="Expand All"
                    >
                    Expand All
                  </Button>

                  <Button 
                    size="sm" 
                    
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300"
                    onClick={collapseAllTables}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
              
              {/* Schema badges */}
              <div className="flex gap-2 flex-wrap mb-4">
                {schemaData.schemas?.map(schema => (
                  <span 
                    key={schema} 
                    className="px-3 py-1 bg-indigo-900 bg-opacity-40 text-indigo-300 rounded-full text-sm"
                  >
                    {schema}
                  </span>
                ))}
              </div>
              
              {/* Legend */}
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Legend</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-300">Primary Key (PK)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-300">Foreign Key (FK)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-300">FK</span>
                    <ArrowRight className="w-3 h-3 mx-1 text-indigo-400" />
                    <span className="text-xs text-gray-300">Referenced PK</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tables organized by relationship levels */}
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {getOrganizedTables().map((levelTables, levelIndex) => (
                <div key={levelIndex} className="mb-8">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                    {levelIndex === 0 ? 'Primary Tables' : `Level ${levelIndex + 1} Tables`}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {levelTables.map(tableName => renderTable(tableName))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'erdiagram' ? (
          // ER Diagram View
          <ERDiagramView 
            schemaData={schemaData}
            zoom={zoom}
            loading={loading}
            expandedTables={expandedTables}
            toggleTableExpansion={toggleTableExpansion}
          />
        ) : (
          // Raw JSON View
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-xl font-bold text-gray-200 mb-4">Raw Schema Data</h2>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-gray-300 text-sm max-h-[70vh]">
              {JSON.stringify(schemaData, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
