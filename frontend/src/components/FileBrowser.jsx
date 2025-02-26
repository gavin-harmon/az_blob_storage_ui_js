// Modify the handleDownload function in your FileBrowser.jsx to avoid directory path issues

const handleDownload = async (file) => {
  try {
    const accountUrl = `https://${azureConfig.accountName}.blob.core.windows.net`;
    const sasToken = azureConfig.sasToken.startsWith('?') 
      ? azureConfig.sasToken 
      : `?${azureConfig.sasToken}`;
    const blobServiceClient = new BlobServiceClient(`${accountUrl}${sasToken}`);
    const containerClient = blobServiceClient.getContainerClient(azureConfig.containerName);
    
    // Normalize the file path to ensure it doesn't contain the container name
    let blobPath = file.path;
    
    // Check if path already starts with container name, remove if it does
    if (blobPath.startsWith(`${azureConfig.containerName}/`)) {
      blobPath = blobPath.substring(azureConfig.containerName.length + 1);
    }
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    
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
