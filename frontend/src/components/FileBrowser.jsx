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
  const [uploadProgress, setUploadProgress] = useState(null);

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
      
      setUploadProgress(null);
      onNavigate(currentPath);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
      setUploadProgress(null);
    }
  };
          
  const handleDownload = async (file) => {
    try {
      const encodedPath = encodeURIComponent(file.path);
      const sasToken = azureConfig.sasToken.startsWith('?') 
        ? azureConfig.sasToken 
        : `?${azureConfig.sasToken}`;

      const url = `https://${azureConfig.accountName}.blob.core.windows.net/${azureConfig.containerName}/${encodedPath}${sasToken}`;
      
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
            <ChevronRight className="h-4 w-4" />
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => onNavigate(pathParts.slice(0, index + 1).join('/'))}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Actions Row */}
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
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <div className="col-span-6 flex items-center cursor-pointer" onClick={() => requestSort('name')}>
          <span className="mr-2">Name</span>
          <SortIcon column="name" />
        </div>
        <div className="col-span-3 flex items-center cursor-pointer" onClick={() => requestSort('size')}>
          <span className="mr-2">Size</span>
          <SortIcon column="size" />
        </div>
        <div className="col-span-3">Actions</div>
      </div>

      {/* File List */}
      <div className="border rounded-b-lg">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No files found</div>
        ) : (
          sortedFiles.map((file) => (
            <div key={file.name} className="grid grid-cols-12 gap-4 px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="col-span-6 flex items-center">
                {file.type === 'directory' ? (
                  <Folder className="h-5 w-5 mr-2 text-blue-600" />
                ) : (
                  <File className="h-5 w-5 mr-2 text-gray-400" />
                )}
                <span
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => file.type === 'directory' ? onNavigate(`${currentPath}/${file.name}`.replace(/^\//, '')) : handleDownload(file)}
                >
                  {file.name}
                </span>
              </div>
              <div className="col-span-3">{formatSize(file.size)}</div>
              <div className="col-span-3">
                <button
                  onClick={() => onDelete(file)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Area */}
      <div className="border-t border-gray-200 dark:border-dark-600 p-4 mt-4">
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {uploadProgress.progress}% complete
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
