from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContentSettings
from typing import List, Tuple
import os

class BlobService:
    def __init__(self, account_name: str, sas_token: str, container_name: str, directory_path: str = ""):
        account_url = f"https://{account_name}.blob.core.windows.net"
        self.blob_service_client = BlobServiceClient(account_url=account_url, credential=sas_token)
        self.container_client = self.blob_service_client.get_container_client(container_name)
        
        # Normalize directory path (remove leading/trailing slashes)
        self.base_directory = directory_path.strip('/')
        if self.base_directory and not self.base_directory.endswith('/'):
            self.base_directory += '/'

    async def list_files(self, prefix: str = "") -> List[dict]:
    try:
        files = []
        directories = set()
        
        # If we have a base directory, we should treat it as our root
        # and make all paths relative to it
        base_len = len(self.base_directory)
        
        # Combine paths for listing
        full_prefix = self.base_directory
        if prefix:
            normalized_prefix = prefix.strip('/')
            if normalized_prefix:
                full_prefix = os.path.join(self.base_directory, normalized_prefix)
                if not full_prefix.endswith('/'):
                    full_prefix += '/'
        
        # List all blobs with the prefix
        blobs = self.container_client.list_blobs(name_starts_with=full_prefix)
        
        for blob in blobs:
            # Always make paths relative to base_directory
            relative_path = blob.name[base_len:].lstrip('/')
            if not relative_path:
                continue
                
            # Handle directories
            if '/' in relative_path:
                dir_name = relative_path.split('/')[0]
                # Important: Keep paths relative to base_directory
                dir_path = os.path.join(self.base_directory, dir_name) + '/'
                if dir_path not in directories:
                    directories.add(dir_path)
                    files.append({
                        'name': dir_name,
                        'path': dir_path,
                        'type': 'directory'
                    })
            else:
                # Add files with proper paths
                files.append({
                    'name': os.path.basename(relative_path),
                    'path': blob.name,  # Keep the full path for operations
                    'size': blob.size,
                    'last_modified': blob.last_modified,
                    'type': 'file'
                })
                    
        return sorted(files, key=lambda x: (x['type'] != 'directory', x['name'].lower()))
    except Exception as e:
        raise Exception(f"Error listing files: {str(e)}")

    async def upload_file(self, path: str, content: bytes) -> bool:
        try:
            # Combine with base directory if needed
            full_path = path
            if self.base_directory and not path.startswith(self.base_directory):
                full_path = self.base_directory + path.lstrip('/')
                
            # Get blob client
            blob_client = self.container_client.get_blob_client(full_path)
            
            # Upload the file
            blob_client.upload_blob(content, overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    async def download_file(self, path: str) -> Tuple[bytes, str]:
        try:
            # No need to modify path if it's already the full path
            full_path = path
            
            # Get blob client
            blob_client = self.container_client.get_blob_client(full_path)
            
            # Download the blob
            download_stream = blob_client.download_blob()
            content = download_stream.readall()
            
            # Get content type
            properties = blob_client.get_blob_properties()
            content_type = properties.content_settings.content_type
            
            return content, content_type
        except Exception as e:
            raise Exception(f"Error downloading file: {str(e)}")

    async def delete_file(self, path: str) -> bool:
        try:
            # No need to modify path if it's already the full path
            full_path = path
            
            # Get blob client
            blob_client = self.container_client.get_blob_client(full_path)
            
            # Delete the blob
            blob_client.delete_blob()
            return True
        except Exception as e:
            raise Exception(f"Error deleting file: {str(e)}")
            
    async def create_directory(self, path: str) -> bool:
        try:
            # Azure Blob Storage doesn't have real directories
            # We create an empty blob with a trailing slash to simulate a directory
            full_path = path
            if self.base_directory and not path.startswith(self.base_directory):
                full_path = self.base_directory + path.lstrip('/')
                
            if not full_path.endswith('/'):
                full_path += '/'
                
            # Create an empty blob to represent the directory
            blob_client = self.container_client.get_blob_client(full_path + '.keep')
            blob_client.upload_blob(b'', overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error creating directory: {str(e)}")
