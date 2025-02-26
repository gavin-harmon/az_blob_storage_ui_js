// Modify the handleUpload function in your FileBrowser.jsx to avoid directory path issues

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

      // Construct blob name ensuring proper path formatting
      // Make sure the path doesn't already contain the container name
      let blobName;
      if (currentPath) {
        // Normalize the currentPath by removing any leading/trailing slashes
        const normalizedPath = currentPath.replace(/^\/+|\/+$/g, '');
        
        // Check if path already starts with container name, remove if it does
        if (normalizedPath.startsWith(`${azureConfig.containerName}/`)) {
          const pathWithoutContainer = normalizedPath.substring(azureConfig.containerName.length + 1);
          blobName = `${pathWithoutContainer}/${file.name}`;
        } else {
          blobName = `${normalizedPath}/${file.name}`;
        }
      } else {
        blobName = file.name;
      }
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
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
