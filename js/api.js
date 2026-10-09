let lastRequestError = '';

export function getLastRequestError() {
    return lastRequestError;
}

export async function request(endpoint, method = 'GET', body = null) {
    lastRequestError = '';
    try {
        const API_BASE = "https://metaanalyse.onrender.com/api";
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        // Chỉ thêm body nếu phương thức không phải GET và có dữ liệu body thực sự
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            const errorBody = await response.text();
            lastRequestError = errorBody || response.statusText || `HTTP ${response.status}`;
            console.error(`Server trả về lỗi ${response.status}: ${lastRequestError}`);
            return null;
        }
        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : true;
    } catch (error) {
        lastRequestError = error instanceof Error ? error.message : String(error);
        console.error("Lỗi kết nối mạng hoặc Server:", error);
        return null;
    }
}