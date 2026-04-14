export const API_BASE = "https://metaanalyse.onrender.com/api";

export async function request(endpoint, method = 'GET', body = null) {
    try {
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
            console.error(`Server trả về lỗi: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối mạng hoặc Server:", error);
        return null;
    }
}