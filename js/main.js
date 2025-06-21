// API Configuration
const API_URL = 'https://localhost:7077/api';

// Global Variables
let categories = [];
let products = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('btnAddCategory').addEventListener('click', addCategory);
    document.getElementById('btnAddProduct').addEventListener('click', addProduct);
}

// ===== UTILITY FUNCTIONS =====

// Show Alert Message
function showAlert(message, type = 'success') {
    alert(message); // Simple alert for now
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// API Call Helper
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (method === 'DELETE') return { success: true };
        return await response.json();
        
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== CATEGORY FUNCTIONS =====

// Load Categories
async function loadCategories() {
    try {
        categories = await apiCall('/CategoryApi');
        displayCategories();
        updateCategorySelect();
    } catch (error) {
        document.getElementById('categoriesList').innerHTML = 
            `<tr><td colspan="4" class="text-center text-danger">Lỗi: ${error.message}</td></tr>`;
    }
}

// Display Categories
function displayCategories() {
    const tbody = document.getElementById('categoriesList');
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có danh mục</td></tr>';
        return;
    }

    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${cat.id}</td>
            <td><strong>${cat.name}</strong></td>
            <td>${cat.description || ''}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${cat.id})">
                    Xóa
                </button>
            </td>
        </tr>
    `).join('');
}

// Update Category Select
function updateCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Chọn danh mục</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

// Add Category
async function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    
    if (!name) {
        showAlert('Vui lòng nhập tên danh mục!', 'warning');
        return;
    }

    try {
        await apiCall('/CategoryApi', 'POST', { name, description });
        document.getElementById('categoryForm').reset();
        loadCategories();
        showAlert('Thêm danh mục thành công!');
    } catch (error) {
        showAlert('Lỗi khi thêm danh mục: ' + error.message, 'danger');
    }
}

// Delete Category
async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
        await apiCall(`/CategoryApi/${id}`, 'DELETE');
        loadCategories();
        loadProducts(); // Reload products to update display
        showAlert('Xóa danh mục thành công!');
    } catch (error) {
        showAlert('Lỗi khi xóa danh mục: ' + error.message, 'danger');
    }
}

// ===== PRODUCT FUNCTIONS =====

// Load Products
async function loadProducts() {
    try {
        products = await apiCall('/ProductApi');
        displayProducts();
    } catch (error) {
        document.getElementById('productsList').innerHTML = 
            `<tr><td colspan="6" class="text-center text-danger">Lỗi: ${error.message}</td></tr>`;
    }
}

// Display Products
function displayProducts() {
    const tbody = document.getElementById('productsList');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có sản phẩm</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(prod => {
        const category = categories.find(c => c.id === prod.categoryId);
        return `
            <tr>
                <td>${prod.id}</td>
                <td><strong>${prod.name}</strong></td>
                <td class="text-end">${formatCurrency(prod.price)}</td>
                <td>${prod.description || ''}</td>
                <td><span class="badge bg-secondary">${category ? category.name : 'N/A'}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editProduct(${prod.id})">
                        Sửa
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${prod.id})">
                        Xóa
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Add Product
async function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value.trim();
    const categoryId = parseInt(document.getElementById('productCategory').value);
    
    if (!name || !price || !categoryId) {
        showAlert('Vui lòng nhập đầy đủ thông tin!', 'warning');
        return;
    }

    try {
        await apiCall('/ProductApi', 'POST', { name, price, description, categoryId });
        document.getElementById('productForm').reset();
        loadProducts();
        showAlert('Thêm sản phẩm thành công!');
    } catch (error) {
        showAlert('Lỗi khi thêm sản phẩm: ' + error.message, 'danger');
    }
}

// Edit Product (Simple version - populate form)
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.categoryId;
    
    // Change button to Update
    const btn = document.getElementById('btnAddProduct');
    btn.textContent = 'Cập nhật';
    btn.onclick = () => updateProduct(id);
    
    showAlert('Đang chỉnh sửa: ' + product.name, 'info');
}

// Update Product
async function updateProduct(id) {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value.trim();
    const categoryId = parseInt(document.getElementById('productCategory').value);
    
    if (!name || !price || !categoryId) {
        showAlert('Vui lòng nhập đầy đủ thông tin!', 'warning');
        return;
    }

    try {
        await apiCall(`/ProductApi/${id}`, 'PUT', { id, name, price, description, categoryId });
        
        // Reset form and button
        document.getElementById('productForm').reset();
        const btn = document.getElementById('btnAddProduct');
        btn.textContent = 'Thêm';
        btn.onclick = addProduct;
        
        loadProducts();
        showAlert('Cập nhật sản phẩm thành công!');
    } catch (error) {
        showAlert('Lỗi khi cập nhật sản phẩm: ' + error.message, 'danger');
    }
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
        await apiCall(`/ProductApi/${id}`, 'DELETE');
        loadProducts();
        showAlert('Xóa sản phẩm thành công!');
    } catch (error) {
        showAlert('Lỗi khi xóa sản phẩm: ' + error.message, 'danger');
    }
}

// ===== GLOBAL FUNCTIONS =====

// Make functions available globally
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addProduct = addProduct;
window.editProduct = editProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;