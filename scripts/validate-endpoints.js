#!/usr/bin/env node

// Endpoint Validation Script
// ==========================

const https = require('https');
const http = require('http');

const config = {
  baseUrl: 'http://localhost:5001',
  timeout: 5000,
  retries: 3
};

// Test endpoints to validate
const endpoints = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp']
  },
  {
    name: 'API Test',
    method: 'GET',
    path: '/api/test',
    expectedStatus: 200,
    expectedFields: ['message']
  },
  {
    name: 'Login Endpoint',
    method: 'POST',
    path: '/api/auth/login',
    data: { phone: '+998901234567', password: 'testpassword123' },
    expectedStatus: 200,
    expectedFields: ['message']
  },
  {
    name: 'Register Endpoint',
    method: 'POST',
    path: '/api/auth/register',
    data: { phone: '+998901234568', password: 'TestPassword123', name: 'Test User' },
    expectedStatus: 200,
    expectedFields: ['message']
  },
  {
    name: 'Products List',
    method: 'GET',
    path: '/api/products',
    expectedStatus: 200,
    expectedFields: ['products']
  },
  {
    name: 'Product Search',
    method: 'GET',
    path: '/api/products/search',
    query: { query: 'milk' },
    expectedStatus: 200,
    expectedFields: ['products']
  },
  {
    name: 'Categories',
    method: 'GET',
    path: '/api/categories',
    expectedStatus: 200,
    expectedFields: ['categories']
  },
  {
    name: 'Protected Profile (No Auth)',
    method: 'GET',
    path: '/api/user/profile',
    expectedStatus: 401,
    expectedFields: ['error']
  },
  {
    name: 'Protected Profile (Invalid Auth)',
    method: 'GET',
    path: '/api/user/profile',
    headers: { 'Authorization': 'Bearer invalid-token' },
    expectedStatus: 403,
    expectedFields: ['error']
  },
  {
    name: 'Protected Profile (Valid Auth)',
    method: 'GET',
    path: '/api/user/profile',
    headers: { 'Authorization': 'Bearer ' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, user: { id: 1, phone: '+998901234567' } })).toString('base64') },
    expectedStatus: 200,
    expectedFields: ['message', 'user']
  },
  {
    name: 'SQL Injection Test',
    method: 'POST',
    path: '/api/products/search',
    data: { query: "'; DROP TABLE users; --" },
    expectedStatus: 400,
    expectedFields: ['error']
  },
  {
    name: 'XSS Test',
    method: 'POST',
    path: '/api/products/search',
    data: { query: '<script>alert("xss")</script>' },
    expectedStatus: 400,
    expectedFields: ['error']
  },
  {
    name: 'Path Traversal Test',
    method: 'GET',
    path: '/api/../../../etc/passwd',
    expectedStatus: 404,
    expectedFields: ['error']
  },
  {
    name: 'Large Payload Test',
    method: 'POST',
    path: '/api/auth/login',
    data: { phone: 'A'.repeat(10000), password: 'test' },
    expectedStatus: 413,
    expectedFields: ['error']
  },
  {
    name: 'Rate Limiting Test',
    method: 'GET',
    path: '/api/test',
    expectedStatus: 429,
    runMultiple: true,
    iterations: 105
  },
  {
    name: 'CORS Test - Valid Origin',
    method: 'GET',
    path: '/api/products',
    headers: { 'Origin': 'http://localhost:8081' },
    expectedStatus: 200,
    expectedFields: ['products']
  },
  {
    name: 'CORS Test - Invalid Origin',
    method: 'GET',
    path: '/api/products',
    headers: { 'Origin': 'https://malicious-site.com' },
    expectedStatus: 403,
    expectedFields: ['error']
  }
];

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + (endpoint.query ? '?' + new URLSearchParams(endpoint.query).toString() : ''),
      method: endpoint.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Endpoint-Validator/1.0',
        ...endpoint.headers
      },
      timeout: config.timeout
    };

    if (endpoint.data) {
      const postData = JSON.stringify(endpoint.data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            endpoint: endpoint.name
          };
          
          // Validate response
          const validation = validateResponse(response, endpoint);
          response.validation = validation;
          
          resolve(response);
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            error: 'Parse error: ' + parseError.message,
            endpoint: endpoint.name
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        error: 'Request error: ' + err.message,
        endpoint: endpoint.name
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Request timeout',
        endpoint: endpoint.name
      });
    });

    if (endpoint.data) {
      req.write(JSON.stringify(endpoint.data));
    }
    
    req.end();
  });
}

function validateResponse(response, endpoint) {
  const validation = {
    passed: true,
    issues: []
  };

  // Check status code
  if (response.status !== endpoint.expectedStatus) {
    validation.passed = false;
    validation.issues.push(`Expected status ${endpoint.expectedStatus}, got ${response.status}`);
  }

  // Check if response exists
  if (!response.body) {
    validation.passed = false;
    validation.issues.push('No response body');
    return validation;
  }

  // Check expected fields
  if (endpoint.expectedFields) {
    for (const field of endpoint.expectedFields) {
      if (!(field in response.body)) {
        validation.passed = false;
        validation.issues.push(`Missing expected field: ${field}`);
      }
    }
  }

  // Check for error responses
  if (endpoint.expectedStatus >= 400 && response.body && !response.body.error) {
    validation.passed = false;
    validation.issues.push('Expected error field in response');
  }

  return validation;
}

async function runEndpointValidation() {
  console.log('🔍 Endpoint Validation Test Suite');
  console.log('=====================================\n');

  // Check if server is running
  try {
    const healthCheck = await makeRequest(endpoints[0]);
    if (healthCheck.error) {
      console.log('❌ Server is not running or not accessible');
      console.log(`Error: ${healthCheck.error}`);
      process.exit(1);
    }
    console.log('✅ Server is running and accessible');
  } catch (error) {
    console.log('❌ Failed to connect to server');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
    details: []
  };

  // Run rate limiting test first (multiple requests)
  const rateLimitEndpoint = endpoints.find(ep => ep.name === 'Rate Limiting Test');
  if (rateLimitEndpoint) {
    console.log('🚀 Running Rate Limiting Test...');
    
    for (let i = 0; i < rateLimitEndpoint.iterations; i++) {
      const response = await makeRequest(rateLimitEndpoint);
      
      if (i < rateLimitEndpoint.iterations - 1) {
        // First 104 requests should pass
        if (response.status !== 200) {
          console.log(`❌ Rate limiting activated too early (request ${i + 1})`);
          results.failed++;
          results.errors++;
        } else {
          console.log(`✅ Request ${i + 1}: OK`);
        }
      } else {
        // Last request should be rate limited
        if (response.status === 429) {
          console.log(`✅ Rate limiting activated correctly (request ${i + 1})`);
          results.passed++;
        } else {
          console.log(`❌ Rate limiting not activated (request ${i + 1}) - Status: ${response.status}`);
          results.failed++;
          results.errors++;
        }
      }
    }
  }

  // Run other tests
  const otherEndpoints = endpoints.filter(ep => ep.name !== 'Rate Limiting Test');
  
  for (const endpoint of otherEndpoints) {
    console.log(`🧪 Testing: ${endpoint.name}`);
    
    try {
      const response = await makeRequest(endpoint);
      const validation = validateResponse(response, endpoint);
      
      if (validation.passed) {
        console.log(`✅ ${endpoint.name}: PASSED`);
        console.log(`   Status: ${response.status}`);
        results.passed++;
      } else {
        console.log(`❌ ${endpoint.name}: FAILED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Issues: ${validation.issues.join(', ')}`);
        results.failed++;
        if (endpoint.expectedStatus >= 400) {
          results.errors++;
        }
      }
      
      results.details.push({
        endpoint: endpoint.name,
        status: response.status,
        passed: validation.passed,
        issues: validation.issues,
        response: response.body
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      results.failed++;
      results.errors++;
      
      results.details.push({
        endpoint: endpoint.name,
        error: error.message,
        passed: false
      });
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🚨 Errors: ${results.errors}`);
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (results.errors === 0 && results.failed === 0) {
    console.log('\n🎉 All endpoints are working correctly!');
    console.log('✅ Security features are properly implemented');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  Some endpoints have issues that need to be addressed');
    console.log('📋 Check the detailed results above');
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: results.passed,
      failed: results.failed,
      errors: results.errors,
      successRate: parseFloat(successRate)
    },
    details: results.details
  };

  require('fs').writeFileSync('endpoint-validation-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: endpoint-validation-report.json');

  return results.errors === 0;
}

// Run the validation
if (require.main === module) {
  runEndpointValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { runEndpointValidation, endpoints };
