// js/api.js
export const API_BASE = "https://metaanalyse.onrender.com/api";

export async function request(endpoint, method = 'GET', body = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return response.json();
}