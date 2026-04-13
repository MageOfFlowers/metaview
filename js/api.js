export const API_BASE = "https://metaanalyse.onrender.com/api";

export async function request(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Lỗi gọi API:", error);
        return null;
    }
}