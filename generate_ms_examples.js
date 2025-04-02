/**
 * Script to generate multi-service training examples using direct database access
 */

import OpenAI from 'openai';
import pg from 'pg';

const { Pool } = pg;

// Initialize OpenAI - it will use the environment variable OPENAI_API_KEY
const openaiClient = new OpenAI();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// List of all available services
const ALL_SERVICES = [
  "Shopify",
  "Klaviyo",
  "Postscript",
  "Northbeam",
  "Slack",
  "Notion",
  "OpenAI",
  "Gorgias",
  "Prescient AI",
  "Recharm",
  "Triple Whale",
  "Elevar",
  "Google Calendar",
  "GitHub"
];

// Predefined complex scenarios that combine multiple services
const PREDEFINED_SCENARIOS = [
  {
    name: "E-commerce Analytics and Marketing",
    description: "Analyze store performance and send targeted marketing campaigns",
    services_required: ["Shopify", "Klaviyo", "Triple Whale"],
    complexity: "medium"
  },
  {
    name: "Customer Support Automation",
    description: "Generate AI responses to customer queries and update support tickets",
    services_required: ["Gorgias", "OpenAI", "Slack"],
    complexity: "high"
  },
  {
    name: "Product Development Workflow",
    description: "Coordinate product development across multiple tools",
    services_required: ["GitHub", "Notion", "Slack"],
    complexity: "medium"
  },
  {
    name: "Marketing Performance Analysis",
    description: "Analyze marketing performance across channels and create reports",
    services_required: ["Klaviyo", "Northbeam", "Notion", "OpenAI"],
    complexity: "high"
  },
  {
    name: "Customer Reengagement",
    description: "Identify and reengage churned customers",
    services_required: ["Shopify", "Klaviyo", "Postscript"],
    complexity: "medium"
  },
  {
    name: "Team Coordination",
    description: "Coordinate team activities across multiple tools",
    services_required: ["Slack", "Google Calendar", "Notion"],
    complexity: "low"
  },
  {
    name: "AI-Enhanced Marketing",
    description: "Generate and schedule marketing content using AI",
    services_required: ["OpenAI", "Klaviyo", "Slack"],
    complexity: "medium"
  },
  {
    name: "Advanced Analytics Dashboard",
    description: "Create comprehensive analytics dashboards",
    services_required: ["Triple Whale", "Northbeam", "Notion", "OpenAI"],
    complexity: "high"
  },
  {
    name: "Order and Inventory Management",
    description: "Manage orders and update inventory across systems",
    services_required: ["Shopify", "Slack", "Notion"],
    complexity: "medium"
  },
  {
    name: "Customer Journey Tracking",
    description: "Track and optimize customer journey across channels",
    services_required: ["Shopify", "Klaviyo", "Gorgias", "Triple Whale"],
    complexity: "high"
  }
];

// Model configuration
const LLAMA_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";  // Primary model for training data
const GPT_MODEL = "gpt-4";  // Used for quality comparison
const QUALITY_COMPARISON_RATIO = 0.05;  // 5% of examples will use GPT for quality comparison

/**
 * Generate a random scenario for multi-service examples
 */
function getRandomScenario() {
  if (Math.random() < 0.7) { // 70% chance of using predefined scenario
    return PREDEFINED_SCENARIOS[Math.floor(Math.random() * PREDEFINED_SCENARIOS.length)];
  } else {
    // Generate a random scenario with 2-4 services
    const numServices = Math.floor(Math.random() * 3) + 2; // 2-4 services
    const selectedServices = [];
    
    // Ensure we get unique services
    while (selectedServices.length < numServices) {
      const service = ALL_SERVICES[Math.floor(Math.random() * ALL_SERVICES.length)];
      if (!selectedServices.includes(service)) {
        selectedServices.push(service);
      }
    }
    
    return {
      name: `Custom Scenario ${Date.now().toString(36)}`,
      description: `Custom scenario involving ${selectedServices.join(', ')}`,
      services_required: selectedServices,
      complexity: ["low", "medium", "high"][Math.floor(Math.random() * 3)]
    };
  }
}

/**
 * Execute an SQL query using the database connection
 */
async function executeSql(sql, params = []) {
  try {
    console.log('Executing SQL:', sql, params);
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

function standardizeMetadata(metadata, model) {
    return {
        source: metadata?.source || "multi_service_generator",
        generated_at: metadata?.generated_at || new Date().toISOString(),
        model: model,
        is_multi_service: metadata?.is_multi_service || true,
        services_required: metadata?.services_required || [],
        scenario: metadata?.scenario || "",
        description: metadata?.description || "",
        complexity: metadata?.complexity || "medium"
    };
}

/**
 * Generate multi-service examples using OpenAI
 */
async function generateExamples(batchSize = 5, totalCount = 10) {
  console.log(`Generating ${totalCount} examples in batches of ${batchSize}`);
  
  let generatedCount = 0;
  let insertedCount = 0;
  
  while (generatedCount < totalCount) {
    const currentBatchSize = Math.min(batchSize, totalCount - generatedCount);
    const scenario = getRandomScenario();
    
    console.log(`\nGenerating batch of ${currentBatchSize} examples for scenario: ${scenario.name}`);
    console.log(`Services: ${scenario.services_required.join(', ')}`);
    
    try {
      // Create a prompt for OpenAI
      const prompt = `Generate ${currentBatchSize} realistic user queries that would require using multiple services together to fulfill the request. 
        
Scenario: ${scenario.name}
Description: ${scenario.description}
Required Services: ${scenario.services_required.join(', ')}
Complexity: ${scenario.complexity}

For each query, also provide:
1. A comprehensive system response that explains exactly how the services would be used together
2. A breakdown of which specific actions would be performed in each service
3. Any data that would need to be transferred between services

Format each as a JSON object with these fields:
- "query": the user's question or command
- "response": a detailed system response explaining the multi-service solution
- "services_required": list of service names that would be needed
- "complexity": one of "low", "medium", or "high"

Return your answer as a JSON array of these objects.`;

      // Call OpenAI API
      const response = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are a specialist in multi-service business operations."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const responseText = response.choices[0].message.content;
      let examples = [];
      
      try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
          examples = parsed;
        } else if (parsed.examples && Array.isArray(parsed.examples)) {
          examples = parsed.examples;
        } else if (typeof parsed === 'object' && parsed.query && parsed.response) {
          // Single example returned as an object
          examples = [parsed];
        }
      } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        continue;
      }
      
      console.log(`Generated ${examples.length} examples for this batch`);
      
      // Insert each example into the database
      for (const example of examples) {
        const id = `ms-${new Date().toISOString().replace(/[-:T.Z]/g, '')}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Determine if this should be a quality comparison example
        const isQualityComparison = Math.random() < QUALITY_COMPARISON_RATIO;
        const model = isQualityComparison ? GPT_MODEL : LLAMA_MODEL;
        
        const metadata = standardizeMetadata(
            {
                is_multi_service: true,
                services_required: example.services_required || scenario.services_required,
                scenario: scenario.name,
                description: scenario.description,
                complexity: example.complexity || scenario.complexity,
                source: "auto-generated",
                is_quality_comparison: isQualityComparison
            },
            model
        );
        
        try {
          // Insert directly using pg
          const insertSql = `
            INSERT INTO training_data (
              id, tool, intent, query, response, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `;
          
          await pool.query(insertSql, [
            id,
            'Multi-Service',
            'Cross-Platform Integration',
            example.query,
            example.response,
            JSON.stringify(metadata)
          ]);
          
          insertedCount++;
          console.log(`Inserted example ${insertedCount}: ${example.query.substring(0, 50)}...`);
        } catch (error) {
          console.error(`Error inserting example ${id}:`, error);
        }
        
        // Pause briefly to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      generatedCount += examples.length;
      console.log(`Progress: ${generatedCount}/${totalCount} examples`);
      
      // Pause between batches to avoid rate limiting
      if (generatedCount < totalCount) {
        console.log('Pausing for 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error generating examples:", error);
      // Pause on error to avoid rapid retries
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`\nGeneration complete! Generated ${generatedCount} examples, inserted ${insertedCount}`);
  return { generatedCount, insertedCount };
}

// Main function to run the generation
async function main() {
  try {
    const batchSize = 5;
    const totalCount = process.argv[2] ? parseInt(process.argv[2]) : 50; // Default 50, override with command line arg
    
    console.log(`Starting multi-service training example generation (${totalCount} examples)...`);
    const result = await generateExamples(batchSize, totalCount);
    console.log(`Generation complete! Generated ${result.generatedCount} examples, inserted ${result.insertedCount}`);
  } catch (error) {
    console.error("Error in generation process:", error);
  } finally {
    // Close the database connection
    await pool.end();
    console.log("Database connection closed");
  }
}

// Run the main function
main();