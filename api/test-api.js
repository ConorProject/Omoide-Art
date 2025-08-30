import fetch from 'node-fetch';

async function testAPI() {
  const testData = {
    location: "Kyoto",
    atmosphere: "golden",
    focus: "a small temple garden",
    detail: "cherry blossoms floating on a pond",
    feelings: ["peaceful", "nostalgic"]
  };

  try {
    console.log('Making request to API...');
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test error:', error);
  }
}

testAPI();