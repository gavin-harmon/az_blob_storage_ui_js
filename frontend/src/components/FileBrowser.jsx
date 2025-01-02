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
    // First find all directory names
    const directoryNames = new Set(
      files.filter(f => f.type === 'directory').map(f => f.name)
    );

    // Filter out files that have the same name as a directory
    const uniqueItems = files.filter(file => 
      !(file.type === 'file' && directoryNames.has(file.name))
    );
    
    return uniqueItems.sort((a, b) => {
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

onst [uploadProgress, setUploadProgress] = useState(null);

  const handleUpload = async (files) => {
    try {
      const accountUrl = `https://${azureConfig.accountName}.blob.core.windows.net`;
      const sasToken = azureConfig.sasToken.startsWith('?') 
        ? azureConfig.sasToken 
        : `?${azureConfig.sasToken}`;
      const blobServiceClient = new BlobServiceClient(`${accountUrl}${sasToken}`);
      const containerClient = blobServiceClient.getContainerClient(azureConfig.containerName);

      for (const file of files) {
        setUploadProgress({
          fileName: file.name,
          progress: 0,
          totalSize: formatSize(file.size)
        });

        const blobName = currentPath ? `${currentPath}/${file.name}` : file.name;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.uploadData(file, {
          onProgress: (ev) => {
            const progress = (ev.loadedBytes / file.size) * 100;
            setUploadProgress(prev => ({
              ...prev,
              progress: progress.toFixed(1)
            }));
          },
          blockSize: 4 * 1024 * 1024, // 4MB chunks
          concurrency: 20, // Number of parallel uploads
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

const handleDownload = async (file) => {
  try {
    // Fix: Ensure sasToken is attached to baseUrl correctly
    const accountUrl = `https://${azureConfig.accountName}.blob.core.windows.net`;
    const sasToken = azureConfig.sasToken.startsWith('?') 
      ? azureConfig.sasToken 
      : `?${azureConfig.sasToken}`;
    const blobServiceClient = new BlobServiceClient(`${accountUrl}${sasToken}`);

    const containerClient = blobServiceClient.getContainerClient(azureConfig.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(file.path);
    
    const response = await blockBlobClient.download();
    const blob = await response.blobBody;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('Download failed: ' + err.message);
  }
};

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="w-full bg-[#1a1f2e] text-gray-100 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center text-sm">
          <button 
            onClick={() => onNavigate('')}
            className="text-blue-400 hover:text-blue-300"
          >
            Root
          </button>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-500" />
              <button
                onClick={() => onNavigate(pathParts.slice(0, index + 1).join('/'))}
                className="text-blue-400 hover:text-blue-300"
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => setIsNewFolderDialogOpen(true)}
          className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </button>
      </div>

      <div className="px-4 py-2 bg-[#1a1f2e] border-y border-gray-700">
        <div className="grid grid-cols-12 gap-4">
          <button 
            onClick={() => requestSort('name')}
            className="col-span-6 flex items-center text-sm text-gray-300"
          >
            Name <SortIcon column="name" />
          </button>
          <button
            onClick={() => requestSort('size')}
            className="col-span-3 flex items-center text-sm text-gray-300"
          >
            Size <SortIcon column="size" />
          </button>
          <div className="col-span-3 text-sm text-gray-300">
            Actions
          </div>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No files found</div>
        ) : (
          sortedFiles.map((item) => (
            <div 
              key={item.name}
              className="px-4 py-2 hover:bg-gray-800 border-b border-gray-700 grid grid-cols-12 gap-4 items-center"
            >
              <div className="col-span-6">
                <button
                  onClick={() => item.type === 'directory' && onNavigate(item.path)}
                  className="flex items-center space-x-2 hover:text-blue-400"
                >
                  {item.type === 'directory' ? (
                    <Folder className="h-5 w-5 text-blue-400" />
                  ) : (
                    <File className="h-5 w-5 text-gray-400" />
                  )}
                  <span>{item.name}</span>
                </button>
              </div>
              <div className="col-span-3 text-sm text-gray-300">
                {item.type === 'directory' ? '-' : formatSize(item.size)}
              </div>
              <div className="col-span-3 flex space-x-2">
                {item.type !== 'directory' && (
                  <>
                    <button
                      onClick={() => handleDownload(item)}
                      className="text-gray-300 hover:text-blue-400 text-sm"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="text-gray-300 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8">
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
            <Upload className="h-8 w-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-400">
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
