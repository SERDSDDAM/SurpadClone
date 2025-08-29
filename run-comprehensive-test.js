// Comprehensive system test
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function runComprehensiveTest() {
  console.log('🧪 Starting comprehensive system test...\n');
  
  const tests = [
    {
      name: 'Server Status Test',
      command: 'curl -s "http://localhost:5000/api/gis/debug/layers"'
    },
    {
      name: 'Create Test Layer',
      command: 'curl -s "http://localhost:5000/api/gis/debug/create-test-layer" -X POST'
    },
    {
      name: 'File Upload Test',
      command: 'curl -X POST "http://localhost:5000/api/gis/upload" -F "file=@attached_assets/image_1756416108776.png" 2>/dev/null'
    },
    {
      name: 'Check Layer Count After Upload',
      command: 'curl -s "http://localhost:5000/api/gis/debug/layers"',
      delay: 3000
    },
    {
      name: 'Filesystem Check',
      command: 'curl -s "http://localhost:5000/api/gis/debug/filesystem"'
    }
  ];
  
  for (const test of tests) {
    console.log(`🔍 Running: ${test.name}`);
    
    if (test.delay) {
      console.log(`   ⏳ Waiting ${test.delay/1000}s for processing...`);
      await new Promise(resolve => setTimeout(resolve, test.delay));
    }
    
    try {
      const { stdout, stderr } = await execAsync(test.command);
      
      if (stderr) {
        console.log(`   ⚠️ Warning: ${stderr}`);
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log(`   ✅ SUCCESS: ${result.message || 'Test passed'}`);
          if (result.layersCount !== undefined) {
            console.log(`   📊 Layers: ${result.layersCount}`);
          }
          if (result.layerId) {
            console.log(`   🆔 Layer ID: ${result.layerId}`);
          }
        } else {
          console.log(`   ❌ FAILED: ${result.error || 'Unknown error'}`);
        }
      } catch (parseError) {
        if (stdout.includes('layerId') || stdout.includes('success')) {
          console.log(`   ✅ Response received:`, stdout.substring(0, 100) + '...');
        } else {
          console.log(`   ❌ Invalid JSON response: ${stdout.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 Comprehensive test completed!');
}

runComprehensiveTest().catch(console.error);