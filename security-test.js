/* eslint-disable */
// 🔐 ENTERPRISE SECURITY TEST SUITE
// Comprehensive security testing for production-grade applications
// Run with: node security-test.js [--detailed] [--skip-destructive]

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Security test configuration
const CONFIG = {
  detailed: process.argv.includes('--detailed'),
  skipDestructive: process.argv.includes('--skip-destructive'),
  maxConcurrentRequests: 10,
  rateLimitTestDuration: 5000, // 5 seconds
  vulnerabilityPatterns: [
    // XSS patterns
    '<script>alert("xss")</script>',
    '"><script>alert(1)</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert(1)>',
    '${alert("xss")}',
    
    // SQL injection patterns
    "' OR '1'='1",
    '; DROP TABLE users; --',
    "' UNION SELECT * FROM users --",
    '1; UPDATE users SET password="hacked"',
    
    // Path traversal patterns
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    
    // Command injection patterns
    '; ls -la',
    '| whoami',
    '$(cat /etc/passwd)',
    '`id`',
    
    // LDAP injection patterns
    '*)(uid=*',
    '*)|(objectClass=*',
    
    // XXE patterns
    '<!DOCTYPE foo [<!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "file:///etc/passwd" >]><foo>&xxe;</foo>',
    
    // Template injection patterns
    '{{7*7}}',
    '${7*7}',
    '<%=7*7%>',
    
    // Header injection patterns
    'test\r\nX-Injected: true',
    'test\nSet-Cookie: injected=true'
  ]
};

class SecurityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      critical: 0,
      details: []
    };
    this.testToken = null;
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const symbols = {
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'info': 'ℹ️',
      'critical': '🚨'
    };
    
    console.log(`[${timestamp}] ${symbols[level]} ${message}`);
    if (details && CONFIG.detailed) {
      console.log(`    Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    this.results.details.push({ timestamp, level, message, details });
    this.results[level === 'pass' ? 'passed' : level === 'fail' ? 'failed' : level === 'critical' ? 'critical' : 'warnings']++;
  }

  async setupTestEnvironment() {
    this.log('info', '🔧 Setting up test environment...');
    
    // Try to create a test user and get token for authenticated tests
    try {
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'SecureTestPassword123!@#'
      };
      
      await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      this.testToken = loginResponse.data.token;
      this.log('pass', 'Test user created and authenticated');
    } catch (error) {
      this.log('warn', 'Could not create test user - some tests will be limited', error.response?.data);
    }
  }

  async testSecurityHeaders() {
    this.log('info', '🛡️ Testing Security Headers...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/articles`);
      const headers = response.headers;
      
      // Critical security headers
      const criticalHeaders = {
        'strict-transport-security': 'HSTS',
        'x-content-type-options': 'X-Content-Type-Options',
        'x-frame-options': 'X-Frame-Options',
        'content-security-policy': 'CSP',
        'x-xss-protection': 'X-XSS-Protection'
      };
      
      let headerScore = 0;
      for (const [header, name] of Object.entries(criticalHeaders)) {
        if (headers[header]) {
          this.log('pass', `${name} header present: ${headers[header]}`);
          headerScore++;
        } else {
          this.log('critical', `${name} header missing - critical security vulnerability`);
        }
      }
      
      // Additional security headers
      const additionalHeaders = {
        'referrer-policy': 'Referrer-Policy',
        'permissions-policy': 'Permissions-Policy',
        'x-permitted-cross-domain-policies': 'X-Permitted-Cross-Domain-Policies'
      };
      
      for (const [header, name] of Object.entries(additionalHeaders)) {
        if (headers[header]) {
          this.log('pass', `${name} header present: ${headers[header]}`);
          headerScore++;
        } else {
          this.log('warn', `${name} header missing - recommended for enhanced security`);
        }
      }
      
      // Server information leakage
      if (headers['server']) {
        this.log('warn', `Server header exposes information: ${headers['server']}`);
      } else {
        this.log('pass', 'Server header properly hidden');
      }
      
      if (headers['x-powered-by']) {
        this.log('critical', `X-Powered-By header exposes technology stack: ${headers['x-powered-by']}`);
      } else {
        this.log('pass', 'X-Powered-By header properly hidden');
      }
      
      const headerGrade = headerScore >= 8 ? 'A+' : headerScore >= 6 ? 'A' : headerScore >= 4 ? 'B' : 'C';
      this.log('info', `Security Headers Grade: ${headerGrade} (${headerScore}/10)`);
      
    } catch (error) {
      this.log('fail', 'Security headers test failed', error.message);
    }
  }

  async testRateLimiting() {
    this.log('info', '🚦 Testing Rate Limiting...');
    
    if (CONFIG.skipDestructive) {
      this.log('info', 'Skipping rate limiting test (--skip-destructive flag)');
      return;
    }
    
    try {
      // Test general API rate limiting
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 15; i++) {
        promises.push(
          axios.get(`${BASE_URL}/api/articles`).catch(err => ({
            status: err.response?.status,
            headers: err.response?.headers
          }))
        );
      }
      
      const results = await Promise.all(promises);
      const rateLimited = results.filter(r => r.status === 429);
      
      if (rateLimited.length > 0) {
        this.log('pass', `Rate limiting active - ${rateLimited.length} requests blocked`);
        
        // Check rate limit headers
        const rateLimitHeaders = rateLimited[0].headers;
        if (rateLimitHeaders['x-ratelimit-limit']) {
          this.log('pass', `Rate limit headers present: ${rateLimitHeaders['x-ratelimit-limit']} requests allowed`);
        }
      } else {
        this.log('warn', 'Rate limiting may not be configured properly');
      }
      
      // Test authentication endpoint rate limiting (more strict)
      const authPromises = [];
      for (let i = 0; i < 8; i++) {
        authPromises.push(
          axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          }).catch(err => ({
            status: err.response?.status,
            attempt: i + 1
          }))
        );
      }
      
      const authResults = await Promise.all(authPromises);
      const authRateLimited = authResults.filter(r => r.status === 429);
      
      if (authRateLimited.length > 0) {
        this.log('pass', `Auth rate limiting active - blocked after ${authRateLimited[0].attempt} attempts`);
      } else {
        this.log('critical', 'Auth endpoints not rate limited - vulnerable to brute force attacks');
      }
      
    } catch (error) {
      this.log('fail', 'Rate limiting test failed', error.message);
    }
  }

  async testInputValidation() {
    this.log('info', '🔍 Testing Input Validation & Sanitization...');
    
    const endpoints = [
      { method: 'POST', url: '/api/articles', requiresAuth: true },
      { method: 'POST', url: '/api/auth/login', requiresAuth: false },
      { method: 'POST', url: '/api/auth/register', requiresAuth: false }
    ];
    
    for (const endpoint of endpoints) {
      this.log('info', `Testing ${endpoint.method} ${endpoint.url}`);
      
      for (const payload of CONFIG.vulnerabilityPatterns) {
        try {
          const headers = {};
          if (endpoint.requiresAuth && this.testToken) {
            headers.Authorization = `Bearer ${this.testToken}`;
          }
          
          const testData = {
            title: payload,
            content: payload,
            category: payload,
            username: payload,
            email: payload,
            password: payload
          };
          
          const response = await axios({
            method: endpoint.method,
            url: `${BASE_URL}${endpoint.url}`,
            data: testData,
            headers
          });
          
          // If request succeeds, check if payload was sanitized
          if (response.data && typeof response.data === 'string' && response.data.includes(payload)) {
            this.log('critical', `Potential vulnerability: payload not sanitized in ${endpoint.url}`, { payload });
          } else {
            this.log('pass', `Input properly handled for ${endpoint.url}`);
          }
          
        } catch (error) {
          if (error.response?.status === 400) {
            this.log('pass', `Input validation working - rejected malicious payload: ${payload.substring(0, 20)}...`);
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            this.log('pass', `Auth protection working for ${endpoint.url}`);
          } else {
            this.log('warn', `Unexpected response for ${endpoint.url}`, error.response?.status);
          }
        }
      }
    }
  }

  async testFileUploadSecurity() {
    this.log('info', '📁 Testing File Upload Security...');
    
    if (!this.testToken) {
      this.log('warn', 'Skipping file upload tests - no auth token');
      return;
    }
    
    const maliciousFiles = [
      { name: 'test.php', content: '<?php phpinfo(); ?>', type: 'application/x-php' },
      { name: 'test.js', content: 'console.log("executed");', type: 'application/javascript' },
      { name: 'test.exe', content: 'MZ\x90\x00\x03\x00\x00\x00', type: 'application/x-msdownload' },
      { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash', type: 'text/plain' },
      { name: 'huge-file.txt', content: 'A'.repeat(50 * 1024 * 1024), type: 'text/plain' } // 50MB
    ];
    
    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('cover', new Blob([file.content], { type: file.type }), file.name);
        formData.append('title', 'Test Article');
        formData.append('content', 'Test content');
        formData.append('category', 'test');
        
        const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
          headers: {
            'Authorization': `Bearer ${this.testToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        this.log('critical', `File upload vulnerability: ${file.name} was accepted`, response.data);
        
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('pass', `File upload security working - rejected ${file.name}`);
        } else {
          this.log('warn', `Unexpected response for file upload test`, error.response?.status);
        }
      }
    }
  }

  async testAuthenticationSecurity() {
    this.log('info', '🔐 Testing Authentication Security...');
    
    // Test JWT token validation on PROTECTED endpoints
    const invalidTokens = [
      'invalid.token.here',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '', // Empty token
      'null',
      'undefined'
    ];
    
    for (const token of invalidTokens) {
      try {
        // Test protected endpoint that requires authentication
        await axios.post(`${BASE_URL}/api/articles`, {
          title: 'Test Article',
          content: 'Test content',
          category: 'test'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.log('critical', `Invalid token accepted: ${token}`);
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.log('pass', `Invalid token properly rejected: ${token.substring(0, 20)}...`);
        } else {
          this.log('warn', `Unexpected response for invalid token: ${error.response?.status}`);
        }
      }
    }
    
    // Test with completely missing Authorization header
    try {
      await axios.post(`${BASE_URL}/api/articles`, {
        title: 'Test Article',
        content: 'Test content',
        category: 'test'
      });
      this.log('critical', 'Request without Authorization header was accepted');
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('pass', 'Missing Authorization header properly rejected');
      } else {
        this.log('warn', `Unexpected response for missing auth: ${error.response?.status}`);
      }
    }
    
    // Test session management
    if (this.testToken) {
      // Test token reuse after "logout" (if logout endpoint exists)
      try {
        await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${this.testToken}` }
        });
        
        // Try to use token after logout
        await axios.post(`${BASE_URL}/api/articles`, {
          title: 'Test Article',
          content: 'Test content',
          category: 'test'
        }, {
          headers: { Authorization: `Bearer ${this.testToken}` }
        });
        
        this.log('critical', 'Token still valid after logout - session not properly invalidated');
      } catch (logoutError) {
        // If logout endpoint doesn't exist, skip this test
        if (logoutError.response?.status === 404) {
          this.log('info', 'Logout endpoint not implemented - skipping session invalidation test');
        } else {
          try {
            // Try to use the token on a protected endpoint
            await axios.post(`${BASE_URL}/api/articles`, {
              title: 'Test Article',
              content: 'Test content',
              category: 'test'
            }, {
              headers: { Authorization: `Bearer ${this.testToken}` }
            });
            this.log('warn', 'Token still active - logout may not invalidate session');
          } catch (error) {
            if (error.response?.status === 401) {
              this.log('pass', 'Token properly invalidated after logout');
            }
          }
        }
      }
    }
  }

  async testCORSConfiguration() {
    this.log('info', '🌐 Testing CORS Configuration...');
    
    const maliciousOrigins = [
      'http://evil.com',
      'https://attacker.evil.com',
      'http://localhost:8080', // Should not be allowed
      'null',
      '*'
    ];
    
    for (const origin of maliciousOrigins) {
      try {
        const response = await axios.get(`${BASE_URL}/api/articles`, {
          headers: { Origin: origin }
        });
        
        const corsHeader = response.headers['access-control-allow-origin'];
        if (corsHeader === origin || corsHeader === '*') {
          this.log('critical', `CORS misconfiguration - allowing origin: ${origin}`);
        } else {
          this.log('pass', `CORS properly configured - rejecting origin: ${origin}`);
        }
      } catch (error) {
        this.log('pass', `CORS blocking malicious origin: ${origin}`);
      }
    }
  }

  async testErrorHandling() {
    this.log('info', '🚨 Testing Error Handling & Information Disclosure...');
    
    const errorTriggers = [
      { url: '/api/nonexistent', expected: 404 },
      { url: '/api/articles/999999', expected: 404 },
      { url: '/api/articles', method: 'DELETE', expected: 405 },
      { url: '/api/articles', data: 'invalid json', expected: 400 }
    ];
    
    for (const trigger of errorTriggers) {
      try {
        await axios({
          method: trigger.method || 'GET',
          url: `${BASE_URL}${trigger.url}`,
          data: trigger.data
        });
      } catch (error) {
        const response = error.response;
        if (response?.status === trigger.expected) {
          // Check for information disclosure in error messages
          const errorBody = JSON.stringify(response.data);
          const sensitivePatterns = [
            /stack trace/i,
            /database error/i,
            /sql/i,
            /mysql/i,
            /mongoose/i,
            /internal server error/i,
            /node_modules/i,
            /file not found.*\.js/i
          ];
          
          const hasInfoDisclosure = sensitivePatterns.some(pattern => pattern.test(errorBody));
          
          if (hasInfoDisclosure) {
            this.log('critical', `Information disclosure in error response for ${trigger.url}`, response.data);
          } else {
            this.log('pass', `Error handling secure for ${trigger.url}`);
          }
        }
      }
    }
  }

  async testSSLConfiguration() {
    this.log('info', '🔒 Testing SSL/TLS Configuration...');
    
    // Check if HTTPS is enforced
    try {
      const httpResponse = await axios.get(BASE_URL.replace('https:', 'http:'));
      this.log('critical', 'HTTP requests not redirected to HTTPS');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.log('pass', 'HTTP port not accessible - good practice');
      } else {
        this.log('warn', 'Could not test HTTP redirect', error.message);
      }
    }
    
    // Test HSTS header effectiveness
    try {
      const response = await axios.get(`${BASE_URL}/api/articles`);
      const hstsHeader = response.headers['strict-transport-security'];
      
      if (hstsHeader) {
        const maxAge = hstsHeader.match(/max-age=(\d+)/);
        const includeSubDomains = hstsHeader.includes('includeSubDomains');
        const preload = hstsHeader.includes('preload');
        
        if (maxAge && parseInt(maxAge[1]) >= 31536000) { // 1 year
          this.log('pass', `HSTS properly configured with max-age: ${maxAge[1]}`);
        } else {
          this.log('warn', 'HSTS max-age should be at least 31536000 (1 year)');
        }
        
        if (includeSubDomains) {
          this.log('pass', 'HSTS includes subdomains');
        } else {
          this.log('warn', 'HSTS should include subdomains');
        }
        
        if (preload) {
          this.log('pass', 'HSTS preload enabled');
        }
      }
    } catch (error) {
      this.log('warn', 'Could not test HSTS configuration', error.message);
    }
  }

  async generateSecurityReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalTests: this.results.passed + this.results.failed + this.results.warnings + this.results.critical,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        critical: this.results.critical,
        grade: this.calculateSecurityGrade()
      },
      details: this.results.details,
      recommendations: this.generateRecommendations()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('info', `📊 Security report saved to: ${reportPath}`);
    return report;
  }

  calculateSecurityGrade() {
    const total = this.results.passed + this.results.failed + this.results.warnings + this.results.critical;
    if (total === 0) return 'N/A';
    
    const score = (this.results.passed / total) * 100;
    const criticalWeight = this.results.critical * 20;
    const adjustedScore = Math.max(0, score - criticalWeight);
    
    if (adjustedScore >= 95) return 'A+';
    if (adjustedScore >= 90) return 'A';
    if (adjustedScore >= 80) return 'B';
    if (adjustedScore >= 70) return 'C';
    if (adjustedScore >= 60) return 'D';
    return 'F';
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.critical > 0) {
      recommendations.push('🚨 CRITICAL: Address all critical security vulnerabilities immediately');
    }
    
    if (this.results.failed > 0) {
      recommendations.push('❌ Fix all failed security tests before production deployment');
    }
    
    if (this.results.warnings > 0) {
      recommendations.push('⚠️ Review and address security warnings for enhanced protection');
    }
    
    recommendations.push('🔄 Run security tests regularly as part of CI/CD pipeline');
    recommendations.push('📚 Keep security dependencies up to date');
    recommendations.push('🛡️ Consider implementing Web Application Firewall (WAF)');
    recommendations.push('📋 Schedule regular penetration testing');
    
    return recommendations;
  }

  async runAllTests() {
    console.log('🔐 ENTERPRISE SECURITY TEST SUITE');
    console.log('=====================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log(`Configuration: ${JSON.stringify(CONFIG, null, 2)}\n`);
    
    await this.setupTestEnvironment();
    await this.testSecurityHeaders();
    await this.testRateLimiting();
    await this.testInputValidation();
    await this.testFileUploadSecurity();
    await this.testAuthenticationSecurity();
    await this.testCORSConfiguration();
    await this.testErrorHandling();
    await this.testSSLConfiguration();
    
    const report = await this.generateSecurityReport();
    
    console.log('\n=====================================');
    console.log('🎯 SECURITY TEST SUMMARY');
    console.log('=====================================');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🚨 Critical: ${report.summary.critical}`);
    console.log(`📊 Security Grade: ${report.summary.grade}`);
    
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    console.log(`\n📁 Detailed report: ${path.join(__dirname, `security-report-${Date.now()}.json`)}`);
    
    return report;
  }
}

async function runSecurityTests() {
  const tester = new SecurityTester();
  return await tester.runAllTests();
}

if (require.main === module) {
  runSecurityTests().then(report => {
    process.exit(report.summary.critical > 0 ? 1 : 0);
  }).catch(error => {
    console.error('💥 Security test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests, SecurityTester };
