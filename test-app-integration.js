// Test script for the application's API integration

import axios from 'axios';

// API endpoint URLs
const BASE_URL = 'http://localhost:5000';
const API_ENDPOINTS = {
  command: `${BASE_URL}/api/command`,
  intent: `${BASE_URL}/api/intent`,
  messages: `${BASE_URL}/api/messages`,
};

// Test command processing
async function testCommandProcessing() {
  try {
    console.log('Testing command processing...');
    
    // Test Shopify get_products command
    const shopifyProductsCommand = {
      command: '/shopify get_products'
    };
    
    console.log(`Sending command: ${shopifyProductsCommand.command}`);
    const response = await axios.post(API_ENDPOINTS.command, shopifyProductsCommand);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing command processing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Test intent processing
async function testIntentProcessing() {
  try {
    console.log('\nTesting intent processing...');
    
    // Test Shopify get_products intent
    const shopifyProductsIntent = {
      intent: 'shopify_get_products',
      query: 'get all shopify products'
    };
    
    console.log(`Sending intent: ${shopifyProductsIntent.intent}`);
    const response = await axios.post(API_ENDPOINTS.intent, shopifyProductsIntent);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing intent processing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Test messages retrieval
async function testMessagesRetrieval() {
  try {
    console.log('\nTesting messages retrieval...');
    
    const response = await axios.get(API_ENDPOINTS.messages);
    
    console.log('Response status:', response.status);
    console.log(`Retrieved ${response.data.length} messages`);
    console.log('Latest message:', JSON.stringify(response.data[response.data.length - 1], null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing messages retrieval:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('Starting application API integration tests...');
  
  await testCommandProcessing();
  await testIntentProcessing();
  await testMessagesRetrieval();
  
  console.log('\nAll tests completed!');
}

// Execute the tests
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
});