import React, { useState, useEffect } from 'react';

const NewFolderDialog = ({ isOpen, onClose, onConfirm, currentPath }) => {
  const [folderName, setFolderName] = useState('');

  // Reset folder name when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      const newPath = currentPath 
        ? `${currentPath}${folderName}`
        : folderName;
      onConfirm(newPath);
      setFolderName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Folder
            </h2>
            
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400
                       bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-dark-800 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                       hover:bg-gray-100 dark:hover:bg-dark-600 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 
                       hover:bg-green-700 rounded-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFolderDialog;