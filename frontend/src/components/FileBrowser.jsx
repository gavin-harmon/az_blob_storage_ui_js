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

  const [uploadProgress, setUploadProgress] = useState(null); // null when not uploading, object with progress info when uploading

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

// Modified upload handler
const handleUpload = async (files) => {
  try {
    const sasToken = azureConfig.sasToken.startsWith('?') 
      ? azureConfig.sasToken 
      : `?${azureConfig.sasToken}`;

    const baseUrl = `https://${azureConfig.accountName}.blob.core.windows.net`;
    const blobServiceClient = new BlobServiceClient(`${baseUrl}${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(azureConfig.containerName);

    for (const file of files) {
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        totalSize: formatSize(file.size)
      });

      const blobPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

      await blockBlobClient.uploadData(file, {
        onProgress: (ev) => {
          const progress = (ev.loadedBytes / file.size) * 100;
          setUploadProgress(prev => ({
            ...prev,
            progress: progress.toFixed(1)
          }));
        },
        blockSize: 4 * 1024 * 1024,
        concurrency: 20,
        blobHTTPHeaders: {
          blobContentType: file.type || 'application/octet-stream'
        }
      });
    }
    
    setUploadProgress(null); // Clear progress after completion
    onNavigate(currentPath);
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed: ' + err.message);
    setUploadProgress(null); // Clear progress on error
  }
};

// Modify your upload area JSX to show the progress
<div className="border-t border-gray-200 dark:border-dark-600 p-4">
  <div className="border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-lg p-8">
    {uploadProgress ? (
      <div className="text-center">
        <div className="mb-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Uploading {uploadProgress.fileName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {uploadProgress.totalSize}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress.progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {uploadProgress.progress}%
        </div>
      </div>
    ) : (
      <>
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
          <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Drop files here or click to upload
          </span>
        </label>
      </>
    )}
  </div>
</div>

const handleDownload = async (file) => {
  try {
    // Make sure path is URI encoded to handle spaces and special characters
    const encodedPath = encodeURIComponent(file.path);
    
    // Add the ? before the SAS token if it doesn't already have one
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
    <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600">
      <div className="p-4 border-b border-gray-200 dark:border-dark-600">
        <div className="flex items-center text-sm">
          <button 
            onClick={() => onNavigate('')}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            Root
          </button>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
              <button
                onClick={() => onNavigate(pathParts.slice(0, index + 1).join('/'))}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex justify-end px-4 py-2 border-b border-gray-200 dark:border-dark-600">
        <button
          onClick={() => setIsNewFolderDialogOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-md"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-600">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-dark-800">
          <button 
            onClick={() => requestSort('name')}
            className="col-span-6 flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400"
          >
            <span>Name</span>
            <SortIcon column="name" />
          </button>
          <button
            onClick={() => requestSort('size')}
            className="col-span-3 flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400"
          >
            <span>Size</span>
            <SortIcon column="size" />
          </button>
          <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            Actions
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-300">Loading...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-300">No files found</div>
        ) : (
          sortedFiles.map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50/50 dark:hover:bg-dark-600/50 group"
            >
              <div className="col-span-6">
                <button
                  onClick={() => item.type === 'directory' && onNavigate(item.path)}
                  className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400"
                >
                  {item.type === 'directory' ? (
                    <Folder className="h-5 w-5 text-green-500 dark:text-green-400" />
                  ) : (
                    <File className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="truncate font-medium">{item.name}</span>
                </button>
              </div>
              
              <div className="col-span-3 text-sm text-gray-700 dark:text-gray-300">
                {item.type === 'directory' ? '-' : formatSize(item.size)}
              </div>
              
              <div className="col-span-3">
                <div className="flex space-x-2">
                  {item.type === 'file' && (
                    <>
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-md"
                        title="Download"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-dark-600 p-4">
        <div className="border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-lg p-8">
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
            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
