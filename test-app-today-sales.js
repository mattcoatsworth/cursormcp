// Test script for getting today's sales through the app

import axios from 'axios';

// API endpoint URLs
const BASE_URL = 'http://localhost:5000';
const COMMAND_ENDPOINT = `${BASE_URL}/api/command`;

// Test command processing
async function testTodaySalesCommand() {
  try {
    console.log('Testing today sales command...');
    
    // Test Shopify get_sales today command
    const todaySalesCommand = {
      command: '/shopify get_sales today'
    };
    
    console.log(`Sending command: ${todaySalesCommand.command}`);
    const response = await axios.post(COMMAND_ENDPOINT, todaySalesCommand);
    
    console.log('Response status:', response.status);
    
    // Check if we got a successful response
    if (response.data && response.data.result && response.data.result.success) {
      const result = response.data.result;
      console.log('Success message:', result.message);
      
      // Extract orders and calculate total
      const orders = result.data.orders || [];
      console.log(`Retrieved ${orders.length} orders from today`);
      
      // Calculate total sales
      let totalSales = 0;
      orders.forEach(order => {
        totalSales += parseFloat(order.total_price);
      });
      
      console.log(`Total sales today: $${totalSales.toFixed(2)}`);
      
      if (orders.length > 0) {
        console.log('First order:', JSON.stringify(orders[0], null, 2).substring(0, 200) + '...');
      } else {
        console.log('No orders found for today.');
      }
    } else {
      console.log('Failed to get today sales:', JSON.stringify(response.data, null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error testing today sales command:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

// Run test
async function runTest() {
  console.log('Starting app today sales test...');
  
  await testTodaySalesCommand();
  
  console.log('\nTest completed!');
}

// Execute the test
runTest().catch(error => {
  console.error('Unhandled error during test:', error);
});