import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrainingDataValidator:
    def __init__(self):
        self.required_endpoint_fields = {
            "service", "resource", "action", "method", "path",
            "parameters", "auth_type", "auth_key", "rate_limit"
        }
        
    def validate_endpoint(self, endpoint: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate a single endpoint against the required format."""
        errors = []
        
        # Check for required fields
        missing_fields = self.required_endpoint_fields - set(endpoint.keys())
        if missing_fields:
            errors.append(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Validate field types
        if "parameters" in endpoint and not isinstance(endpoint["parameters"], dict):
            errors.append("Parameters must be a dictionary")
        
        # Validate path format
        if "path" in endpoint and not endpoint["path"].startswith("/api/"):
            errors.append("Path must start with /api/")
        
        # Validate method
        valid_methods = {"GET", "POST", "PUT", "DELETE", "PATCH"}
        if "method" in endpoint and endpoint["method"] not in valid_methods:
            errors.append(f"Invalid HTTP method: {endpoint['method']}")
        
        return len(errors) == 0, errors
    
    def validate_execution_details(self, execution_details: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate execution details structure."""
        errors = []
        
        if not isinstance(execution_details, dict):
            return False, ["Execution details must be a dictionary"]
        
        if "endpoints" not in execution_details:
            return False, ["Missing 'endpoints' field in execution details"]
        
        if not isinstance(execution_details["endpoints"], list):
            return False, ["'endpoints' must be a list"]
        
        # Validate each endpoint
        for i, endpoint in enumerate(execution_details["endpoints"]):
            is_valid, endpoint_errors = self.validate_endpoint(endpoint)
            if not is_valid:
                errors.extend([f"Endpoint {i}: {error}" for error in endpoint_errors])
        
        return len(errors) == 0, errors
    
    def validate_training_file(self, file_path: str) -> Tuple[bool, List[str]]:
        """Validate a single training data file."""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                return False, ["Training data must be a list of examples"]
            
            all_errors = []
            for i, example in enumerate(data):
                if "execution_details" not in example:
                    all_errors.append(f"Example {i}: Missing execution_details")
                    continue
                
                is_valid, errors = self.validate_execution_details(example["execution_details"])
                if not is_valid:
                    all_errors.extend([f"Example {i}: {error}" for error in errors])
            
            return len(all_errors) == 0, all_errors
            
        except Exception as e:
            return False, [f"Error processing file: {str(e)}"]
    
    def validate_all_training_data(self, training_data_dir: str) -> Dict[str, List[str]]:
        """Validate all training data files in the directory."""
        results = {
            "valid_files": [],
            "invalid_files": {}
        }
        
        training_data_path = Path(training_data_dir)
        for file_path in training_data_path.glob("*.json"):
            if file_path.name.endswith('.bak'):
                continue
                
            logger.info(f"Validating {file_path}")
            is_valid, errors = self.validate_training_file(str(file_path))
            
            if is_valid:
                results["valid_files"].append(str(file_path))
            else:
                results["invalid_files"][str(file_path)] = errors
        
        return results

def main():
    validator = TrainingDataValidator()
    results = validator.validate_all_training_data("training_data_local")
    
    # Print results
    logger.info("\nValidation Results:")
    logger.info(f"Valid files: {len(results['valid_files'])}")
    logger.info(f"Invalid files: {len(results['invalid_files'])}")
    
    if results["invalid_files"]:
        logger.info("\nInvalid files and their errors:")
        for file_path, errors in results["invalid_files"].items():
            logger.info(f"\n{file_path}:")
            for error in errors:
                logger.info(f"  - {error}")

if __name__ == "__main__":
    main() 