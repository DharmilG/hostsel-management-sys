// Register Users Script for Hostel Management System
// Run this file with: node register_users.js

// Using built-in fetch (Node 18+). If your Node is older, install `node-fetch`.
const API_URL = 'http://localhost:3000/api/auth';

async function postJSON(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    let data = null
    try { data = await res.json() } catch (e) { data = null }
    if (!res.ok) {
        const err = new Error((data && data.message) || res.statusText || 'Request failed')
        err.status = res.status
        err.data = data
        throw err
    }
    return data
}

const users = [
    {
        username: 'bruce',
        email: 'brucestudent@gmail.com',
        password: 'brucestudent',
        role: 'student'
    },
    {
        username: 'bruceadmin',
        email: 'bruceadmin@gmail.com',
        password: 'bruceadmin',
        role: 'admin'
    }
];

async function registerUsers() {
    console.log('Starting user registration...\n');

    for (const user of users) {
        try {
            const responseData = await postJSON(`${API_URL}/register`, user);
            console.log(`✅ Successfully registered: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Response:`, responseData);
            console.log('');
        } catch (error) {
            if (error && error.data && error.data.message) {
                console.log(`❌ Failed to register: ${user.email}`);
                console.log(`   Error: ${error.data.message}`);
                console.log('');
            } else {
                console.log(`❌ Network or unexpected error for: ${user.email}`);
                console.log(`   Error: ${error.message || error}`);
                console.log('');
            }
        }
    }

    console.log('Registration complete!');
}

registerUsers();
