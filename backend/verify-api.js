const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vitEmail: 'browser.test.user@vitstudent.ac.in',
                password: 'Test@12345'
            })
        });

        console.log('Login Response Status:', loginRes.status);

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        console.log('Login successful:', loginData.user.vitEmail);

        // Debug headers
        // console.log('Headers type:', typeof loginRes.headers);
        // console.log('Headers keys:', Object.keys(loginRes.headers));

        let cookies;
        // Try standard API
        if (loginRes.headers && typeof loginRes.headers.get === 'function') {
            cookies = loginRes.headers.get('set-cookie');
        }
        // Try raw node-fetch v2 (if headers is an object with raw method)
        else if (loginRes.headers && typeof loginRes.headers.raw === 'function') {
            cookies = loginRes.headers.raw()['set-cookie'];
        }
        // Try plain object access
        else if (loginRes.headers) {
            cookies = loginRes.headers['set-cookie'];
        }

        console.log('Extracted Cookies:', cookies);

        if (!cookies) {
            throw new Error('No cookies received in headers');
        }

        // Handle array or string
        const cookieHeader = Array.isArray(cookies) ? cookies.map(c => c.split(';')[0]).join('; ') : cookies.split(';')[0];

        console.log('Using Cookie Header:', cookieHeader);

        console.log('2. Fetching Dashboard Stats...');
        const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
            headers: {
                'Cookie': cookieHeader
            }
        });

        if (!statsRes.ok) {
            const txt = await statsRes.text();
            throw new Error(`Stats failed: ${statsRes.status} ${txt}`);
        }

        const stats = await statsRes.json();
        console.log('Stats received:', stats);

        // Verification checks
        if (stats.generatedSchedules !== 1) console.warn('WARN: Expected 1 generated schedule, got ' + stats.generatedSchedules);

        console.log('3. Fetching Activity Logs...');
        const activityRes = await fetch(`${BASE_URL}/dashboard/activity`, {
            headers: {
                'Cookie': cookieHeader
            }
        });

        if (!activityRes.ok) throw new Error('Activity logs failed');

        const activities = await activityRes.json();
        console.log('Activities received:', activities.length);

        if (activities.length > 0) {
            console.log('Latest Activity:', activities[0]);
        } else {
            console.warn('WARN: No activities found');
        }

        console.log('✅ API Verification Successful');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        // Print stack if available
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

verify();
