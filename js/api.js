// js/api.js
const API_BASE = "https://metaanalyse.onrender.com/api";

async function callAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
    return response.json();
}