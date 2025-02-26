// Modify the handleConnect function in your App.jsx to handle directoryPath correctly
const handleConnect = async (credentials) => {
  try {
    setLoading(true);
    await axios.post(`${API_BASE}/connect`, {
      account_name: credentials.accountName,
      container_name: credentials.containerName,
      sas_token: credentials.sasToken
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
      // Load files from the specified directory path
      await loadFiles(credentials.directoryPath);
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
