import React, { useState } from 'react';

const ConnectionPanel = ({ onConnect, isConnected, onDisconnect, isLoading, darkMode }) => {
  // State for handling connection errors
  const [error, setError] = useState(null);
  const [showDirectoryField, setShowDirectoryField] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Get values and trim whitespace
    let accountName = formData.get('accountName').trim();
    let containerName = formData.get('containerName').trim();
    let sasToken = formData.get('sasToken').trim();
    let directoryPath = showDirectoryField ? formData.get('directoryPath')?.trim() || '' : '';
    
    // Validate SAS token format
    if (!sasToken.startsWith('?') && !sasToken.startsWith('sv=')) {
      setError('SAS token should start with "?" or "sv="');
      return;
    }
    
    // Ensure SAS token has a leading '?' if it starts with 'sv='
    if (sasToken.startsWith('sv=')) {
      sasToken = `?${sasToken}`;
    }
    
    // Clean up directory path (remove leading/trailing slashes)
    directoryPath = directoryPath.trim().replace(/^\/+|\/+$/g, '');
    
    // Ensure we're not duplicating the container name in the directory path
    if (directoryPath.startsWith(`${containerName}/`)) {
      directoryPath = directoryPath.substring(containerName.length + 1);
      setError(`Warning: Container name '${containerName}' was removed from the directory path`);
    }
    
    // Clear any previous errors (after checking for duplicated container name)
    if (!error || !error.startsWith('Warning:')) {
      setError(null);
    }
    
    // Build connection data
    const connectionData = {
      accountName,
      containerName,
      sasToken
    };
    
    // Only add directory path if it's not empty
    if (directoryPath) {
      connectionData.directoryPath = directoryPath;
    }
    
    // Pass connection data to parent component
    onConnect(connectionData);
  };

  return (
    <div className={`rounded-lg shadow-sm p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Azure Storage Connection</h2>
      
      {!isConnected ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-sm font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Storage Account Name
            </label>
            <input
              type="text"
              name="accountName"
              required
              className={`w-full rounded-md border focus:ring-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="e.g., mystorageaccount"
            />
          </div>
          
          // Replace the separate container and directory fields with a single field
          <div>
            <label className={`text-sm font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Container Path
            </label>
            <input
              type="text"
              name="containerPath"
              required
              className={`w-full rounded-md border focus:ring-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="e.g., mycontainer or mycontainer/folder/subfolder"
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter container name or container/path
            </p>
          </div>
          
          {showDirectoryField && (
            <div>
              <label className={`text-sm font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Directory Path
              </label>
              <input
                type="text"
                name="directoryPath"
                className={`w-full rounded-md border focus:ring-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="e.g., folder/subfolder"
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter the path within the container (do not include the container name in the path)
              </p>
            </div>
          )}
          
          <div>
            <label className={`text-sm font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              SAS Token
            </label>
            <input
              type="password"
              name="sasToken"
              required
              className={`w-full rounded-md border focus:ring-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="?sv=2022-11-02&ss=b&srt=c&sp=rwdlacitfx&se=..."
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Include the full token starting with "?" or "sv="
            </p>
          </div>
          
          {error && (
            <div className={`p-3 border rounded-md text-sm ${
              error.startsWith('Warning:') 
                ? darkMode 
                  ? 'bg-yellow-900/30 border-yellow-800/30 text-yellow-200' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : darkMode 
                  ? 'bg-red-900/30 border-red-800/30 text-red-200' 
                  : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-800/50' 
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300'
            }`}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-center space-x-2 p-3 rounded-md ${
            darkMode 
              ? 'bg-green-900/30 text-green-200' 
              : 'bg-green-50 text-green-700'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Connected</span>
          </div>
          
          <button
            onClick={onDisconnect}
            className={`w-full py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              darkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
                : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
            }`}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;
