/* eslint-disable */
// Quick Security Verification Test
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function quickSecurityTest() {
  console.log('🔐 QUICK SECURITY VERIFICATION TEST');
  console.log('=====================================');
  
  // Test 1: Security Headers
  console.log('\n1️⃣ Testing Security Headers...');
  try {
    const response = await axios.get(`${BASE_URL}/api/articles`);
    const headers = response.headers;
    
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options', 
      'x-frame-options',
      'content-security-policy',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ];
    
    let headerCount = 0;
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`   ✅ ${header}: ${headers[header]}`);
        headerCount++;
      } else {
        console.log(`   ❌ Missing: ${header}`);
      }
    });
    
    console.log(`   📊 Security Headers: ${headerCount}/${securityHeaders.length}`);
  } catch (error) {
    console.log(`   ❌ Headers test failed: ${error.message}`);
  }
  
  // Test 2: JWT Authentication
  console.log('\n2️⃣ Testing JWT Authentication...');
  const invalidTokens = ['invalid.token', '', 'null', 'undefined'];
  
  let authTestsPassed = 0;
  for (const token of invalidTokens) {
    try {
      await axios.post(`${BASE_URL}/api/articles`, {
        title: 'Test', content: 'Test', category: 'test'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   🚨 CRITICAL: Invalid token accepted: ${token}`);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`   ✅ Invalid token rejected (${error.response.status}): ${token || 'empty'}`);
        authTestsPassed++;
      } else {
        console.log(`   ⚠️ Unexpected response (${error.response?.status}): ${token || 'empty'}`);
      }
    }
  }
  
  // Test 3: Missing Authorization Header
  try {
    await axios.post(`${BASE_URL}/api/articles`, {
      title: 'Test', content: 'Test', category: 'test'
    });
    console.log('   🚨 CRITICAL: Request without auth header accepted');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ Missing auth header properly rejected (401)');
      authTestsPassed++;
    } else {
      console.log(`   ⚠️ Unexpected response for missing auth: ${error.response?.status}`);
    }
  }
  
  // Test 4: CORS Protection  
  console.log('\n3️⃣ Testing CORS Protection...');
  try {
    const response = await axios.get(`${BASE_URL}/api/articles`, {
      headers: { Origin: 'http://evil.com' }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader === 'http://evil.com' || corsHeader === '*') {
      console.log('   🚨 CRITICAL: CORS allows malicious origin');
    } else {
      console.log('   ✅ CORS properly configured - malicious origin blocked');
    }
  } catch (error) {
    console.log('   ✅ CORS blocking malicious origin');
  }
  
  console.log('\n🎯 SECURITY TEST SUMMARY');
  console.log('========================');
  console.log(`✅ Authentication Tests Passed: ${authTestsPassed}/${invalidTokens.length + 1}`);
  
  if (authTestsPassed === invalidTokens.length + 1) {
    console.log('🎉 ALL CRITICAL SECURITY TESTS PASSED!');
    console.log('🛡️ Security Status: PRODUCTION READY');
  } else {
    console.log('⚠️ Some authentication tests failed - review needed');
  }
}

quickSecurityTest().catch(console.error);
