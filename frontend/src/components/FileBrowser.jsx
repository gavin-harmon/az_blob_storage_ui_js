import React, { useState, useMemo } from 'react';
import { BlobServiceClient } from "@azure/storage-blob";
import { 
  Folder, 
  File, 
  Upload,
  Trash2, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderPlus
} from 'lucide-react';
import NewFolderDialog from './NewFolderDialog';

const FileBrowser = ({ 
  files = [], 
  currentPath = '',
  onNavigate,
  onDelete,
  onCreateDirectory,
  isLoading,
  azureConfig 
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);

  const sortedFiles = useMemo(() => {
    const sortedItems = [...files];
    
    return sortedItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      
      if (sortConfig.key === 'size') {
        return sortConfig.direction === 'asc' 
          ? (a.size || 0) - (b.size || 0)
          : (b.size || 0) - (a.size || 0);
      }
      
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortConfig.direction === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [files, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleUpload = async (files) => {
    try {
      const sasToken = azureConfig.sasToken.startsWith('?') 
        ? azureConfig.sasToken 
        : `?${azureConfig.sasToken}`;

      for (const file of files) {
        const blobPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        const encodedPath = encodeURIComponent(blobPath);
        
        const url = `https://${azureConfig.accountName}.blob.core.windows.net/${azureConfig.containerName}/${encodedPath}${sasToken}`;
        
        console.log('Uploading file:', file.name);

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type || 'application/octet-stream'
          },
          body: file
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
      }
      
      onNavigate(currentPath);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
    }
  };

  const handleDownload = async (file) => {
    try {
      const encodedPath = encodeURIComponent(file.path);
      
      const sasToken = azureConfig.sasToken.startsWith('?') 
        ? azureConfig.sasToken 
        : `?${azureConfig.sasToken}`;

      const url = `https://${azureConfig.accountName}.blob.core.windows.net/${azureConfig.containerName}/${encodedPath}${sasToken}`;
      
      console.log('Download URL (without SAS):', `https://${azureConfig.accountName}.blob.core.windows.net/${azureConfig.containerName}/${encodedPath}`);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed: ' + err.message);
    }
  };
  
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="w-full">
      {/* Path Navigation */}
      <div className="flex items-center space-x-1 mb-4 text-sm">
        <span
          className="cursor-pointer hover:text-blue-600"
          onClick={() => onNavigate('')}
        >
          Root
        </span>
        {pathParts.map((part, index) => (
          <React.Fragment key={part}>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => onNavigate(pathParts.slice(0, index + 1).join('/'))}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setIsNewFolderDialogOpen(true)}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </button>
      </div>

      {/* File List Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50">
        <button 
          onClick={() => requestSort('name')}
          className="col-span-6 flex items-center text-sm font-medium text-gray-700"
        >
          <span>Name</span>
          <SortIcon column="name" />
        </button>
        <button
          onClick={() => requestSort('size')}
          className="col-span-3 flex items-center text-sm font-medium text-gray-700"
        >
          <span>Size</span>
          <SortIcon column="size" />
        </button>
        <div className="col-span-3 text-sm font-medium text-gray-700">
          Actions
        </div>
      </div>

      {/* File List */}
      <div className="bg-white">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No files found</div>
        ) : (
          sortedFiles.map((item) => (
            <div 
              key={item.name}
              className="grid grid-cols-12 gap-4 px-4 py-2 hover:bg-gray-50 items-center"
            >
              <div className="col-span-6">
                <div 
                  onClick={() => item.type === 'directory' ? onNavigate(`${currentPath}/${item.name}`.replace(/^\//, '')) : handleDownload(item)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  {item.type === 'directory' ? (
                    <Folder className="h-5 w-5 text-blue-500" />
                  ) : (
                    <File className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="truncate hover:text-blue-600">{item.name}</span>
                </div>
              </div>
              
              <div className="col-span-3 text-sm text-gray-600">
                {item.type === 'directory' ? '-' : formatSize(item.size)}
              </div>
              
              <div className="col-span-3">
                <div className="flex space-x-2">
                  {item.type === 'file' && (
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Area */}
      <div className="border-t border-gray-200 p-4 mt-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <input
            type="file"
            multiple
            onChange={(e) => handleUpload(Array.from(e.target.files))}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Drop files here or click to upload
            </span>
          </label>
        </div>
      </div>

      <NewFolderDialog
        isOpen={isNewFolderDialogOpen}
        onClose={() => setIsNewFolderDialogOpen(false)}
        onConfirm={onCreateDirectory}
        currentPath={currentPath}
      />
    </div>
  );
};

const formatSize = (bytes) => {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export default FileBrowser;
