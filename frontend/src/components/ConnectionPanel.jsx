import React, { useState } from 'react';

const ConnectionPanel = ({ onConnect, isConnected, onDisconnect, isLoading }) => {
  const [showFilePath, setShowFilePath] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const connectionData = {
      accountName: formData.get('accountName').trim(),
      containerName: formData.get('containerName').trim(),
      sasToken: formData.get('sasToken').trim()
    };
    
    // Only include filePath if it's enabled and has a value
    if (showFilePath && formData.get('filePath')) {
      connectionData.filePath = formData.get('filePath').trim();
    }
    
    onConnect(connectionData);
  };

  return (
    <div className="bg-grey rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-white-800 mb-4">Azure Storage Connection</h2>
      
      {!isConnected ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white-700 block mb-1">
              Storage Account Name
            </label>
            <input
              type="text"
              name="accountName"
              required
              className="w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-black"
              placeholder="e.g., mystorageaccount"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-white-700 block mb-1">
              Container Name
            </label>
            <input
              type="text"
              name="containerName"
              required
              className="w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-black"
              placeholder="e.g., mycontainer"
            />
          </div>
          
          <div className="flex items-center mb-2">
            <input
              id="showFilePath"
              type="checkbox"
              checked={showFilePath}
              onChange={() => setShowFilePath(!showFilePath)}
              className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="showFilePath" className="ml-2 text-sm text-white-700">
              Connect to specific file (optional)
            </label>
          </div>
          
          {showFilePath && (
            <div>
              <label className="text-sm font-medium text-white-700 block mb-1">
                File Path
              </label>
              <input
                type="text"
                name="filePath"
                className="w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-black"
                placeholder="e.g., folder/myfile.csv"
              />
              <p className="text-xs text-white-500 mt-1">
                Enter the path to the file within the container
              </p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-white-700 block mb-1">
              SAS Token
            </label>
            <input
              type="password"
              name="sasToken"
              required
              className="w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-black"
              placeholder="sv=2022-11-02&ss=b&srt=sco&sp=rwdlaciytfx&se=2023-..."
            />
            <p className="text-xs text-white-500 mt-1">
              Make sure to include the full token starting with "?" or "sv="
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-green-600 text-black rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">Connected</span>
          </div>
          
          <button
            onClick={onDisconnect}
            className="w-full py-2 px-4 bg-grey-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-grey-500 focus:ring-offset-2 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;
