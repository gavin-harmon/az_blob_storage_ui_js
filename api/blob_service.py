from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContentSettings
from typing import List, Tuple
import os

class BlobService:
    def __init__(self, account_name: str, sas_token: str, container_name: str, directory_path: str = ""):
        account_url = f"https://{account_name}.blob.core.windows.net"
        self.blob_service_client = BlobServiceClient(account_url=account_url, credential=sas_token)
        self.container_client = self.blob_service_client.get_container_client(container_name)
        
        # Store the initial directory path - this is our actual starting point
        self.base_directory = directory_path.strip('/')
        if self.base_directory:
            self.base_directory += '/'

    async def list_files(self, prefix: str = "") -> List[dict]:
        try:
            files = []
            directories = set()
            
            # If prefix is empty, we list from base_directory
            # If prefix is provided, we append it to base_directory
            list_prefix = self.base_directory
            if prefix:
                list_prefix = os.path.join(self.base_directory, prefix.strip('/'))
                if not list_prefix.endswith('/'):
                    list_prefix += '/'
            
            # List all blobs
            blobs = self.container_client.list_blobs(name_starts_with=list_prefix)
            
            for blob in blobs:
                # Get path relative to our listing prefix
                path_within_listing = blob.name[len(list_prefix):] if list_prefix else blob.name
                if not path_within_listing:
                    continue
                
                # Handle directories
                if '/' in path_within_listing:
                    dir_name = path_within_listing.split('/')[0]
                    full_dir_path = f"{list_prefix}{dir_name}/"
                    if full_dir_path not in directories:
                        directories.add(full_dir_path)
                        files.append({
                            'name': dir_name,
                            'path': full_dir_path,
                            'type': 'directory'
                        })
                else:
                    # Handle files
                    files.append({
                        'name': path_within_listing,
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
            # Always upload relative to base_directory
            full_path = os.path.join(self.base_directory, path.lstrip('/'))
                
            blob_client = self.container_client.get_blob_client(full_path)
            blob_client.upload_blob(content, overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")

    async def download_file(self, path: str) -> Tuple[bytes, str]:
        try:
            # The path should already be correct as it comes from the file listing
            blob_client = self.container_client.get_blob_client(path)
            
            download_stream = blob_client.download_blob()
            content = download_stream.readall()
            
            properties = blob_client.get_blob_properties()
            content_type = properties.content_settings.content_type
            
            return content, content_type
        except Exception as e:
            raise Exception(f"Error downloading file: {str(e)}")

    async def delete_file(self, path: str) -> bool:
        try:
            # The path should already be correct as it comes from the file listing
            blob_client = self.container_client.get_blob_client(path)
            blob_client.delete_blob()
            return True
        except Exception as e:
            raise Exception(f"Error deleting file: {str(e)}")
            
    async def create_directory(self, path: str) -> bool:
        try:
            # Always create directories relative to base_directory
            full_path = os.path.join(self.base_directory, path.lstrip('/'))
            if not full_path.endswith('/'):
                full_path += '/'
                
            # Create an empty blob to represent the directory
            blob_client = self.container_client.get_blob_client(full_path + '.keep')
            blob_client.upload_blob(b'', overwrite=True)
            return True
        except Exception as e:
            raise Exception(f"Error creating directory: {str(e)}")
