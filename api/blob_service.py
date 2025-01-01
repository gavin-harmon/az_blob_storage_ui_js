from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContentSettings
from typing import List, Tuple
import os

class BlobService:
    def __init__(self, account_name: str, sas_token: str, container_name: str):
        account_url = f"https://{account_name}.blob.core.windows.net"
        self.blob_service_client = BlobServiceClient(account_url=account_url, credential=sas_token)
        self.container_client = self.blob_service_client.get_container_client(container_name)

    async def list_files(self, prefix: str = "") -> List[dict]:
        try:
            files = []
            directories = set()
            
            # Normalize prefix
            prefix = prefix if prefix.endswith('/') or prefix == '' else prefix + '/'
            
            # List all blobs with the prefix
            blobs = self.container_client.list_blobs(name_starts_with=prefix)
            
            for blob in blobs:
                relative_path = blob.name[len(prefix):] if prefix else blob.name
                if not relative_path:
                    continue
                    
                # Handle directories
                if '/' in relative_path:
                    dir_name = relative_path.split('/')[0]
                    dir_path = prefix + dir_name + '/'
                    if dir_path not in directories:
                        directories.add(dir_path)
                        files.append({
                            'name': dir_name,
                            'path': dir_path,
                            'type': 'directory'
                        })
                else:
                    # Add files
                    files.append({
                        'name': blob.name.split('/')[-1],
                        'path': blob.name,
                        'size': blob.size,
                        'last_modified': blob.last_modified,
                        'type': 'file'
                    })
                    
            return sorted(files, key=lambda x: (x['type'] != 'directory', x['name'].lower()))
        except Exception as e:
            raise Exception(f"Error listing files: {str(e)}")

    async def upload_file(self, path: str, content: bytes) -> bool:
        try:
            # Get blob client
            blob_client = self.container_client.get_blob_client(path)
            
            # Upload the file
            blob_client.upload_blob(content, overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    async def download_file(self, path: str) -> Tuple[bytes, str]:
        try:
            # Get blob client
            blob_client = self.container_client.get_blob_client(path)
            
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
            # Get blob client
            blob_client = self.container_client.get_blob_client(path)
            
            # Delete the blob
            blob_client.delete_blob()
            return True
        except Exception as e:
            raise Exception(f"Error deleting file: {str(e)}")
            
    async def create_directory(self, path: str) -> bool:
        try:
            # Azure Blob Storage doesn't have real directories
            # We create an empty blob with a trailing slash to simulate a directory
            if not path.endswith('/'):
                path += '/'
                
            # Create an empty blob to represent the directory
            blob_client = self.container_client.get_blob_client(path + '.keep')
            blob_client.upload_blob(b'', overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error creating directory: {str(e)}")