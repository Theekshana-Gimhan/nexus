// Quick Frontend Integration Verification
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// Test the key endpoints the frontend will use
async function quickTest() {
    console.log('🔍 Testing Frontend Integration Points...\n');
    
    const tests = [
        {
            name: 'Gateway Health Check',
            url: `${API_BASE}/health`,
            method: 'GET'
        },
        {
            name: 'Tenant List (Debug Route)',
            url: `${API_BASE}/internal/debug/proxy-tenants`,
            method: 'GET'
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const response = await axios({
                method: test.method,
                url: test.url,
                timeout: 5000
            });
            
            console.log(`✅ ${test.name}: SUCCESS`);
            if (test.name.includes('Tenant')) {
                const data = response.data;
                console.log(`   📊 Found ${data.data?.length || 0} tenants`);
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        }
        console.log('');
    }
    
    console.log('📱 Frontend Test Instructions:');
    console.log('1. Open: http://localhost:3004');
    console.log('2. Login: admin@nexus.lk / admin123');
    console.log('3. Check Dashboard loads');
    console.log('4. Navigate to Tenants page');
    console.log('5. Verify tenant data appears');
}

quickTest();
