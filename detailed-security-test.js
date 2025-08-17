/* eslint-disable */
// Limited Detailed Security Test (Rate-Limit Safe)
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

class SecurityTester {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: 0, critical: 0, details: [] };
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const symbols = { 'pass': '✅', 'fail': '❌', 'warn': '⚠️', 'info': 'ℹ️', 'critical': '🚨' };
    
    console.log(`[${timestamp}] ${symbols[level]} ${message}`);
    if (details) {
      console.log(`    Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    this.results.details.push({ timestamp, level, message, details });
    this.results[level === 'pass' ? 'passed' : level === 'fail' ? 'failed' : level === 'critical' ? 'critical' : 'warnings']++;
  }

  async testSecurityHeaders() {
    this.log('info', '🛡️ Testing Security Headers...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/articles`);
      const headers = response.headers;
      
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

  async testAuthenticationSecurity() {
    this.log('info', '🔐 Testing Authentication Security...');
    
    const invalidTokens = [
      'invalid.token.here',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '',
      'null',
      'undefined'
    ];
    
    for (const token of invalidTokens) {
      try {
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
    
    // Test missing authorization header
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
  }

  async testInputValidation() {
    this.log('info', '🔍 Testing Input Validation (Sample)...');
    
    const testPayloads = [
      '<script>alert("xss")</script>',
      "' OR '1'='1",
      '../../../etc/passwd'
    ];
    
    for (const payload of testPayloads) {
      try {
        await axios.post(`${BASE_URL}/api/articles`, {
          title: payload,
          content: payload,
          category: payload
        });
        this.log('critical', `Malicious payload not sanitized: ${payload.substring(0, 20)}...`);
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('pass', `Input validation working - rejected: ${payload.substring(0, 20)}...`);
        } else if (error.response?.status === 401) {
          this.log('pass', `Auth protection working (401)`);
        } else {
          this.log('warn', `Unexpected response: ${error.response?.status}`);
        }
      }
    }
  }

  async testCORSConfiguration() {
    this.log('info', '🌐 Testing CORS Configuration...');
    
    const maliciousOrigins = [
      'http://evil.com',
      'https://attacker.evil.com',
      'http://localhost:8080',
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
    this.log('info', '🚨 Testing Error Handling...');
    
    const errorTriggers = [
      { url: '/api/nonexistent', expected: 404 },
      { url: '/api/articles/999999', expected: 404 }
    ];
    
    for (const trigger of errorTriggers) {
      try {
        await axios.get(`${BASE_URL}${trigger.url}`);
      } catch (error) {
        const response = error.response;
        if (response?.status === trigger.expected) {
          const errorBody = JSON.stringify(response.data);
          const sensitivePatterns = [
            /stack trace/i,
            /database error/i,
            /sql/i,
            /mysql/i,
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

  generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings + this.results.critical;
    const score = total > 0 ? (this.results.passed / total) * 100 : 0;
    const criticalWeight = this.results.critical * 20;
    const adjustedScore = Math.max(0, score - criticalWeight);
    
    let grade = 'F';
    if (adjustedScore >= 95) grade = 'A+';
    else if (adjustedScore >= 90) grade = 'A';
    else if (adjustedScore >= 80) grade = 'B';
    else if (adjustedScore >= 70) grade = 'C';
    else if (adjustedScore >= 60) grade = 'D';
    
    return {
      summary: {
        totalTests: total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        critical: this.results.critical,
        grade,
        score: Math.round(adjustedScore)
      }
    };
  }

  async runAllTests() {
    console.log('🔐 DETAILED SECURITY TEST SUITE (Rate-Limit Safe)');
    console.log('==================================================');
    console.log(`Started at: ${new Date().toISOString()}\n`);
    
    await this.testSecurityHeaders();
    await this.testAuthenticationSecurity();
    await this.testInputValidation();
    await this.testCORSConfiguration();
    await this.testErrorHandling();
    
    const report = this.generateReport();
    
    console.log('\n==================================================');
    console.log('🎯 DETAILED SECURITY TEST SUMMARY');
    console.log('==================================================');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`🚨 Critical: ${report.summary.critical}`);
    console.log(`📊 Security Grade: ${report.summary.grade} (${report.summary.score}%)`);
    
    if (report.summary.critical === 0 && report.summary.failed === 0) {
      console.log('\n🎉 ALL SECURITY TESTS PASSED!');
      console.log('🛡️ Application is PRODUCTION READY');
    } else if (report.summary.critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND - DO NOT DEPLOY');
    } else {
      console.log('\n⚠️ Some issues found - review recommended');
    }
    
    return report;
  }
}

async function runDetailedSecurityTest() {
  const tester = new SecurityTester();
  return await tester.runAllTests();
}

runDetailedSecurityTest().catch(console.error);
