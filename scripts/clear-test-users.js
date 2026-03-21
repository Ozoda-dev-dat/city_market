#!/usr/bin/env node

// Simple script to clear test users
const { storage } = require('./server_dist/index.js');

async function clearTestUsers() {
  try {
    await storage.clearTestUsers();
    console.log('✅ Test users cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing test users:', error);
  }
}

clearTestUsers();
