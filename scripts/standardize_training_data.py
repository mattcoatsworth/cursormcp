import json
import os
import logging
from typing import Dict, List, Any
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EndpointStandardizer:
    def __init__(self):
        self.standardized_format = {
            "service": "",
            "resource": "",
            "action": "",
            "method": "",
            "path": "",
            "parameters": {},
            "auth_type": "",
            "auth_key": "",
            "rate_limit": ""
        }

    def extract_endpoint_from_url(self, url: str) -> Dict[str, str]:
        """Extract service, resource, and action from URL."""
        # Remove protocol and domain
        path = url.split("/api/")[-1] if "/api/" in url else url.split("/")[-1]
        
        # Split into components
        parts = path.split("/")
        
        # Determine service from domain
        service = url.split("//")[1].split(".")[0].capitalize() if "//" in url else "Unknown"
        
        # Extract resource and action
        resource = parts[0] if len(parts) > 0 else ""
        action = parts[-1] if len(parts) > 1 else "list"
        
        return {
            "service": service,
            "resource": resource,
            "action": action,
            "path": f"/api/{path}"
        }

    def standardize_endpoint(self, execution_details: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert various endpoint formats to standardized format."""
        standardized_endpoints = []
        
        # Case 1: Direct api_endpoint URL
        if "api_endpoint" in execution_details:
            url = execution_details["api_endpoint"]
            base_info = self.extract_endpoint_from_url(url)
            endpoint = self.standardized_format.copy()
            endpoint.update(base_info)
            endpoint.update({
                "method": execution_details.get("method", "GET"),
                "auth_type": execution_details.get("authentication", "api_key"),
                "auth_key": execution_details.get("auth_key", "private_api_key"),
                "rate_limit": execution_details.get("rate_limit", "Not specified")
            })
            standardized_endpoints.append(endpoint)
            
        # Case 2: Steps-based execution details
        elif "steps" in execution_details:
            for step in execution_details["steps"]:
                if "Execute" in step and "for" in step:
                    service = step.split("for")[-1].strip()
                    action = step.split("Execute")[-1].split("for")[0].strip().lower().replace(" ", "_")
                    endpoint = self.standardized_format.copy()
                    endpoint.update({
                        "service": service,
                        "resource": action.split("_")[0],
                        "action": action,
                        "method": "GET",
                        "path": f"/api/{action}",
                        "auth_type": "api_key",
                        "auth_key": "private_api_key",
                        "rate_limit": "Not specified"
                    })
                    standardized_endpoints.append(endpoint)
        
        return standardized_endpoints

    def process_training_file(self, file_path: str) -> None:
        """Process a single training data file."""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            modified = False
            for example in data:
                if "execution_details" in example:
                    standardized_endpoints = self.standardize_endpoint(example["execution_details"])
                    if standardized_endpoints:
                        example["execution_details"] = {"endpoints": standardized_endpoints}
                        modified = True
            
            if modified:
                # Create backup
                backup_path = file_path.replace('.json', '.json.bak')
                os.rename(file_path, backup_path)
                
                # Write standardized data
                with open(file_path, 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info(f"Standardized {file_path}")
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")

def main():
    standardizer = EndpointStandardizer()
    training_data_dir = Path("training_data_local")
    
    # Process all JSON files in the training data directory
    for file_path in training_data_dir.glob("*.json"):
        if not file_path.name.endswith('.bak'):
            logger.info(f"Processing {file_path}")
            standardizer.process_training_file(str(file_path))

if __name__ == "__main__":
    main() 