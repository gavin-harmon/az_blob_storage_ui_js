import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import ConnectionPanel from './components/ConnectionPanel';
import FileBrowser from './components/FileBrowser';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';

function App() {
  const [connected, setConnected] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  // Add Azure config state
  const [azureConfig, setAzureConfig] = useState({
    accountName: '',
    containerName: '',
    sasToken: ''
  });

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (connected) {
      loadFiles('');
    }
  }, [connected]);

  const handleConnect = async (credentials) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/connect`, {
        account_name: credentials.accountName,
        container_name: credentials.containerName,
        sas_token: credentials.sasToken,
        directory_path: credentials.directoryPath || ''  // Add the directory path
      });
      
      // Store Azure config for direct access
      setAzureConfig({
        accountName: credentials.accountName,
        containerName: credentials.containerName,
        sasToken: credentials.sasToken
      });
      
      setConnected(true);
      setError('');
      
      // If a directory path was provided, navigate to it
      if (credentials.directoryPath) {
        // Clean up directory path (remove leading/trailing slashes)
        const normalizedPath = credentials.directoryPath.trim().replace(/^\/+|\/+$/g, '');
        // Load files from the specified directory path
        await loadFiles(normalizedPath);
      } else {
        // Otherwise load files from root
        await loadFiles('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = useCallback(async (path) => {
    if (!connected) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/files`, {
        params: { path }
      });
      setFiles(response.data);
      setCurrentPath(path);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/delete`, {
        params: { path: file.path }
      });
      await loadFiles(currentPath);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async (path) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/create-directory`, null, {
        params: { path }
      });
      await loadFiles(currentPath);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setFiles([]);
    setCurrentPath('');
    setAzureConfig({
      accountName: '',
      containerName: '',
      sasToken: ''
    });
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Simplified Header */}
      <nav className="border-b border-gray-800 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-left items-center h-16">
            <span className="text-2xl font-bold text-white">Hamilton Beach</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Azure File Manager
          </h1>
          <p className="text-gray-400">
            Secure cloud storage
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg text-red-400 shadow-lg">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <ConnectionPanel
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={connected}
              isLoading={loading}
              darkMode={darkMode}
            />
          </div>
          
          <div className="col-span-3">
            {connected ? (
              <FileBrowser
                files={files}
                currentPath={currentPath}
                onNavigate={loadFiles}
                onDelete={handleDelete}
                onCreateDirectory={handleCreateDirectory}
                isLoading={loading}
                darkMode={darkMode}
                azureConfig={azureConfig}
              />
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8 text-center text-gray-400 shadow-lg">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-lg">Connect to start exploring your files</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
