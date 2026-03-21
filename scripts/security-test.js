#!/usr/bin/env node

// Security Test Script
// ===================

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const config = {
  target: 'http://localhost:5001',
  timeout: 5000,
  retries: 3
};

// Security test cases
const securityTests = [
  {
    name: 'SQL Injection Test',
    path: '/api/products/search',
    method: 'GET',
    params: { query: "'; DROP TABLE users; --" },
    expectedStatus: 400
  },
  {
    name: 'XSS Test',
    path: '/api/products/search',
    method: 'GET',
    params: { query: '<script>alert("xss")</script>' },
    expectedStatus: 400
  },
  {
    name: 'Path Traversal Test',
    path: '/api/../../../etc/passwd',
    method: 'GET',
    expectedStatus: 404
  },
  {
    name: 'Large Payload Test',
    path: '/api/auth/login',
    method: 'POST',
    data: { phone: 'A'.repeat(10000), password: 'test' },
    expectedStatus: 413
  },
  {
    name: 'Rate Limiting Test',
    path: '/api/auth/login',
    method: 'POST',
    data: { phone: '+998901234567', password: 'wrongpassword' },
    expectedStatus: 429,
    repeat: 10
  },
  {
    name: 'CORS Test',
    path: '/api/products',
    method: 'GET',
    headers: { Origin: 'https://malicious-site.com' },
    expectedStatus: 200,
    checkCORS: true
  },
  {
    name: 'Missing Authorization Test',
    path: '/api/user/profile',
    method: 'GET',
    expectedStatus: 401
  },
  {
    name: 'Invalid Token Test',
    path: '/api/user/profile',
    method: 'GET',
    headers: { Authorization: 'Bearer invalid-token' },
    expectedStatus: 401
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.path, config.target);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const postData = test.data ? JSON.stringify(test.data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + (test.params ? '?' + new URLSearchParams(test.params).toString() : ''),
      method: test.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test-Script/1.0',
        ...test.headers
      },
      timeout: config.timeout
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          test: test.name
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        error: err.message,
        test: test.name
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Request timeout',
        test: test.name
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runSecurityTests() {
  console.log('🔒 Running Security Tests');
  console.log('==========================\n');

  const results = [];

  for (const test of securityTests) {
    console.log(`🧪 Testing: ${test.name}`);
    
    try {
      const response = await makeRequest(test);
      
      if (response.error) {
        console.log(`❌ Failed: ${response.error}`);
        results.push({ test: test.name, status: 'FAILED', error: response.error });
      } else {
        const passed = response.statusCode === test.expectedStatus;
        
        if (test.checkCORS) {
          const corsHeader = response.headers['access-control-allow-origin'];
          const corsPassed = !corsHeader || corsHeader !== 'https://malicious-site.com';
          console.log(`📊 Status: ${response.statusCode}, CORS: ${corsHeader || 'not set'}`);
          console.log(`${corsPassed ? '✅' : '❌'} CORS security: ${corsPassed ? 'PASSED' : 'FAILED'}`);
          results.push({ 
            test: test.name, 
            status: corsPassed ? 'PASSED' : 'FAILED',
            statusCode: response.statusCode,
            corsHeader
          });
        } else {
          console.log(`📊 Status: ${response.statusCode} (Expected: ${test.expectedStatus})`);
          console.log(`${passed ? '✅' : '❌'} Result: ${passed ? 'PASSED' : 'FAILED'}`);
          results.push({ 
            test: test.name, 
            status: passed ? 'PASSED' : 'FAILED',
            statusCode: response.statusCode,
            expectedStatus: test.expectedStatus
          });
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ test: test.name, status: 'ERROR', error: error.message });
    }
    
    console.log('');
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

function checkDependencies() {
  console.log('📦 Checking Dependencies');
  console.log('========================\n');

  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditOutput);
    
    const vulnerabilities = audit.vulnerabilities || {};
    const totalVulns = Object.keys(vulnerabilities).length;
    const highVulns = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;
    const moderateVulns = Object.values(vulnerabilities).filter(v => v.severity === 'moderate').length;
    
    console.log(`🔍 Total vulnerabilities: ${totalVulns}`);
    console.log(`🚨 High severity: ${highVulns}`);
    console.log(`⚠️  Moderate severity: ${moderateVulns}`);
    
    if (totalVulns === 0) {
      console.log('✅ No security vulnerabilities found');
    } else {
      console.log('❌ Security vulnerabilities detected');
      console.log('💡 Run: npm audit fix');
    }
    
    return { totalVulns, highVulns, moderateVulns };
  } catch (error) {
    console.log(`❌ Error checking dependencies: ${error.message}`);
    return { error: error.message };
  }
}

function checkEnvironment() {
  console.log('\n🌍 Checking Environment');
  console.log('========================\n');

  const checks = [
    { name: 'NODE_ENV', expected: 'production', critical: false },
    { name: 'DATABASE_URL', expected: 'postgresql://', critical: true },
    { name: 'JWT_SECRET', expected: '56dbf3c5a97b6cd3e7ad089f599379f7bb361359fbac65b31b4594a84da747c48d0da94f28180149d270f92c8f6e63da8736e3fc0c1bd17cdfa5019d0565c7ec', critical: true },
    { name: 'ENCRYPTION_KEY', expected: '3aa3d9cd590251257a7c01601035dc34f19b95bc3268b4a833d82392810f35274e17253399b7d519c535f644e5bf1f4adcf829f4ae3c89af154252c574935002', critical: true }
  ];

  const fs = require('fs');
  let envConfig = {};
  
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envConfig[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (error) {
    console.log('❌ Could not read .env file');
  }

  let allPassed = true;

  checks.forEach(check => {
    const value = envConfig[check.name];
    const passed = value && (check.expected === 'production' ? value === check.expected : value.includes(check.expected));
    
    console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'SET' : 'MISSING/INCORRECT'}${check.critical ? ' (CRITICAL)' : ''}`);
    
    if (!passed) {
      allPassed = false;
    }
  });

  return { passed: allPassed };
}

async function main() {
  console.log('🛡️  Supermarket Go Security & Performance Test Suite');
  console.log('================================================\n');

  // Check if server is running
  console.log('🔍 Checking server availability...');
  try {
    await makeRequest({ path: '/health', method: 'GET' });
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('💡 Run: npm run server:dev');
    process.exit(1);
  }

  // Run security tests
  const securityResults = await runSecurityTests();
  
  // Check dependencies
  const dependencyResults = checkDependencies();
  
  // Check environment
  const environmentResults = checkEnvironment();

  // Generate report
  console.log('\n📊 Test Results Summary');
  console.log('========================\n');

  const passedTests = securityResults.filter(r => r.status === 'PASSED').length;
  const failedTests = securityResults.filter(r => r.status === 'FAILED').length;
  const errorTests = securityResults.filter(r => r.status === 'ERROR').length;

  console.log(`🔒 Security Tests: ${passedTests} passed, ${failedTests} failed, ${errorTests} errors`);
  
  if (dependencyResults.totalVulns !== undefined) {
    console.log(`📦 Dependencies: ${dependencyResults.totalVulns} vulnerabilities`);
  }
  
  console.log(`🌍 Environment: ${environmentResults.passed ? 'SECURE' : 'INSECURE'}`);

  // Overall status
  const overallStatus = 
    failedTests === 0 && 
    errorTests === 0 && 
    (dependencyResults.totalVulns === 0 || dependencyResults.totalVulns <= 2) && 
    environmentResults.passed;

  console.log(`\n🎯 Overall Status: ${overallStatus ? '✅ SECURE' : '❌ NEEDS ATTENTION'}`);

  if (!overallStatus) {
    console.log('\n📋 Action Items:');
    
    if (failedTests > 0) {
      console.log('- Fix failed security tests');
    }
    
    if (dependencyResults.totalVulns > 2) {
      console.log('- Update vulnerable dependencies: npm audit fix');
    }
    
    if (!environmentResults.passed) {
      console.log('- Configure environment variables properly');
    }
  }

  process.exit(overallStatus ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSecurityTests, checkDependencies, checkEnvironment };
