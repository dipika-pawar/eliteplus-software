document.addEventListener('DOMContentLoaded', () => {
    
    // Backend User API main URL mapping
    const API_URL = 'http://localhost:5000/api/user';

    // --- 1. Mobile Sidebar Open/Close Toggle Mechanism ---
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && sidebar && toggleIcon) {
        menuToggle.addEventListener('click', (e) => {
            sidebar.classList.toggle('open');
            e.stopPropagation();
            toggleIcon.className = sidebar.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 991 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('open');
                    toggleIcon.className = 'fa-solid fa-bars';
                }
            }
        });
    }

    // --- 2. Elements & Core State Setup ---
    const userTableBody = document.getElementById('userTableBody');
    const searchInput = document.getElementById('userSearch');
    const addBtn = document.querySelector('.btn-add-user');
    const editAccountForm = document.getElementById('editAccountForm'); // Form reference according to HTML

    // Local memory backup (For fallback when the server is offline)
    let globalUsersList = JSON.parse(localStorage.getItem('myUsers')) || [];

    function saveLocalBackup() {
        localStorage.setItem('myUsers', JSON.stringify(globalUsersList));
    }

    // ★ GET: Fetch all users from the database
    async function fetchUsers() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                globalUsersList = await response.json();
                saveLocalBackup();
                renderTable(globalUsersList);
            } else {
                renderTable(globalUsersList); // Show local data if API fails
            }
        } catch (error) {
            console.warn("Backend server is offline. Using local backup data.");
            renderTable(globalUsersList); // Renders table without crashing during network error
        }
    }

    // Fetch users immediately on page load
    fetchUsers();

    // --- 3. Live Search Filter Functionality ---
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const filter = this.value.toLowerCase().trim();
            const filteredUsers = globalUsersList.filter(user => 
                (user.full_name && user.full_name.toLowerCase().includes(filter)) ||
                (user.username && user.username.toLowerCase().includes(filter)) ||
                (user.email && user.email.toLowerCase().includes(filter))
            );
            renderTable(filteredUsers);
        });
    }

    // --- 4. CRUD Operations & Dynamic Actions ---
    if (userTableBody) {
        userTableBody.addEventListener('click', function(e) {
            const row = e.target.closest('tr');
            if (!row) return;
            const userId = row.getAttribute('data-id');

            // ★ DELETE Action Handler
            if (e.target.closest('.btn-action-delete')) {
                if (confirm("Are you sure you want to delete this user?")) {
                    executeDeleteUser(userId);
                }
            }
            
            // ★ EDIT Action Window Handler
            if (e.target.closest('.btn-action-edit')) {
                openUserModal(row);
            }
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => openUserModal(null));
    }

    // --- 5. Delete Execution Logic (Hybrid) ---
    async function executeDeleteUser(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert("User deleted successfully!");
                fetchUsers();
            } else {
                const errData = await response.json();
                alert("Error: " + errData.message);
            }
        } catch (err) {
            // Server offline fallback
            globalUsersList = globalUsersList.filter(x => x.id.toString() !== id.toString());
            saveLocalBackup();
            renderTable(globalUsersList);
            alert("Server is offline! User has been removed from the local screen view.");
        }
    }

    // --- 6. UI Table Renderer Logic ---
    function renderTable(dataList) {
        userTableBody.innerHTML = '';
        if (!dataList || dataList.length === 0) {
            userTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No records found.</td></tr>`;
            return;
        }

        dataList.forEach((user) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', user.id);
            tr.innerHTML = `
                <td>${user.full_name || '-'}</td>
                <td>${user.username || '-'}</td>
                <td>${user.role || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <button class="btn-action-edit"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-action-delete"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            userTableBody.appendChild(tr);
        });
    }
});

// --- 7. Modal & Save Management Global Functions ---
let editingRow = null;

function openUserModal(row = null) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    modal.style.display = 'flex';
    
    if (row) {
        editingRow = row;
        document.getElementById('modalTitle').innerText = "Edit User";
        document.getElementById('editRowId').value = row.getAttribute('data-id');
        document.getElementById('fName').value = row.cells[0].innerText;
        document.getElementById('uName').value = row.cells[1].innerText;
        document.getElementById('role').value = row.cells[2].innerText;
        document.getElementById('email').value = row.cells[3].innerText;
        document.getElementById('phone').value = row.cells[4].innerText;
    } else {
        editingRow = null;
        document.getElementById('modalTitle').innerText = "Add New User";
        document.getElementById('editRowId').value = '';
        document.querySelectorAll('.modal-content input').forEach(i => {
            if (i.id !== 'editRowId') i.value = '';
        });
    }
}

function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'none';
}

// ★ POST / PUT: Main pipeline to save or update user data
async function saveUser() {
    const API_URL = 'http://localhost:5000/api/user';
    const id = document.getElementById('editRowId').value;
    const fName = document.getElementById('fName').value.trim();
    const uName = document.getElementById('uName').value.trim();
    const role = document.getElementById('role').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!fName || !uName || !email) { 
        alert("Please enter Name, Username and Email fields."); 
        return; 
    }

    // Prepare payload for backend storage
    const userPayload = { fName, uName, role, email, phone };

    // 1. Update Mode (PUT Request)
    if (id && editingRow) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userPayload)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message || "Updated successfully!");
                location.reload(); // Refresh to get fresh data
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            // Offline fallback modification when server is down
            editingRow.cells[0].innerText = fName;
            editingRow.cells[1].innerText = uName;
            editingRow.cells[2].innerText = role;
            editingRow.cells[3].innerText = email;
            editingRow.cells[4].innerText = phone;
            alert("Server is offline! Changes have been updated temporarily on the local screen.");
            closeModal();
        }
    } 
    // 2. New User Mode (POST Request)
    else {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userPayload)
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message || "Saved successfully!");
                location.reload();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            // Offline fallback storage when server is down
            const trBackup = document.createElement('tr');
            trBackup.setAttribute('data-id', Date.now());
            trBackup.innerHTML = `
                <td>${fName}</td><td>${uName}</td><td>${role}</td><td>${email}</td><td>${phone}</td>
                <td>
                    <button class="btn-action-edit"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-action-delete"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            document.getElementById('userTableBody').appendChild(trBackup);
            alert("Server is offline! User has been added temporarily to the screen table.");
            closeModal();
        }
    }
}