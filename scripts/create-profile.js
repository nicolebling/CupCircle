
const fetch = require('node-fetch');

async function createProfile() {
  // Replace these with your actual registration details
  const email = 'your_email@example.com';
  const password = 'your_password';
  const username = 'your_username';
  
  console.log('Testing login with provided credentials...');
  
  // First, login to get authentication token
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!loginResponse.ok) {
    const errorData = await loginResponse.json();
    console.error('Login failed:', errorData.message || 'Unknown error');
    return;
  }
  
  const { token, user } = await loginResponse.json();
  console.log('Login successful, user ID:', user.id);
  
  // Create a profile with the obtained token
  const profileData = {
    name: 'Your Full Name',
    occupation: 'Your Occupation',
    bio: 'A short bio about yourself',
    interests: ['networking', 'coffee', 'technology'],
    // Add any other profile fields you want to set
  };
  
  console.log('Creating profile...');
  const profileResponse = await fetch('http://localhost:3001/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
  
  if (!profileResponse.ok) {
    const errorData = await profileResponse.json();
    console.error('Profile creation failed:', errorData.message || 'Unknown error');
    return;
  }
  
  const profile = await profileResponse.json();
  console.log('Profile created successfully:', profile);
}

createProfile()
  .catch(error => console.error('Error in script execution:', error));
