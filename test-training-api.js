// Test script for training data API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testTrainingEndpoints() {
  try {
    console.log('Testing /api/training endpoint...');
    const trainingResponse = await fetch(`${BASE_URL}/api/training`);
    
    if (!trainingResponse.ok) {
      throw new Error(`Failed to fetch training data: ${trainingResponse.status} ${trainingResponse.statusText}`);
    }
    
    const trainingData = await trainingResponse.json();
    console.log(`Successfully fetched ${trainingData.length} training data entries`);
    
    console.log('\nTesting /api/training/metadata endpoint...');
    const metadataResponse = await fetch(`${BASE_URL}/api/training/metadata`);
    
    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch training metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
    }
    
    const metadata = await metadataResponse.json();
    console.log('Metadata results:');
    console.log(`- Tools: ${metadata.tools.join(', ')}`);
    console.log(`- Total examples: ${metadata.totalExamples}`);
    
    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the tests
testTrainingEndpoints();