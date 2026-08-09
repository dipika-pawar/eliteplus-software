document.addEventListener("DOMContentLoaded", () => {
    
    // Backend API Main URL Mapping
    const API_URL = 'http://localhost:5000/api/item';
    const UNIT_API_URL = 'http://localhost:5000/api/unit'; // Dynamic Unit API
    const TAX_API_URL = 'http://localhost:5000/api/tax'; // Dynamic Tax Category API

    // --- 1. Sidebar Toggle ---
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const toggleIcon = menuToggle?.querySelector("i");

    if (menuToggle && sidebar && toggleIcon) {
        menuToggle.addEventListener("click", (e) => {
            sidebar.classList.toggle("open");
            e.stopPropagation();
            toggleIcon.className = sidebar.classList.contains("open") ? "fa-solid fa-xmark" : "fa-solid fa-bars";
        });
    }

    // --- 2. Element Selectors ---
    const itemForm = document.getElementById('itemMasterForm');
    const itemTableBody = document.querySelector('.professional-table tbody');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeModalBtn = document.getElementById('closeModal');

    // Form Inputs Elements
    const nameInp = document.getElementById('itemName');
    const codeInp = document.getElementById('itemCode');
    const printNameInp = document.getElementById('itemPrintName');
    const typeInp = document.getElementById('itemType');
    const groupInp = document.getElementById('itemGroup');
    const brandInp = document.getElementById('itemBrand');
    const unitInp = document.getElementById('itemUnit');
    const taxInp = document.getElementById('itemTaxCategory');
    const hsnInp = document.getElementById('itemHsnCode');
    const stockInp = document.getElementById('itemOpeningStock');
    const stockValInp = document.getElementById('itemOpeningStockValue');
    const purchaseInp = document.getElementById('itemPurchasePrice');
    const salesInp = document.getElementById('itemSalesPrice');
    const mrpInp = document.getElementById('itemMrp');
    const packingInp = document.getElementById('itemPacking');
    const videoInp = document.getElementById('itemVideoLink');
    const descInp = document.getElementById('itemDescription');
    const imgUrlInp = document.getElementById('itemImageUrl');

    // File Elements
    const itemImgInput = document.getElementById('itemImg');
    const imgLabel = document.querySelector('label[for="itemImg"]');
    const itemPdfInput = document.getElementById('itemPdf');
    const pdfLabel = document.querySelector('label[for="itemPdf"]');
    const editImgInput = document.getElementById('editImg');
    const editImgLabel = document.getElementById('editImgLabel');

    // Add Unit Modal Elements
    const addUnitModal = document.getElementById('addUnitModal');
    const openAddUnitModalBtn = document.getElementById('openAddUnitModalBtn');
    const openAddUnitModalEditBtn = document.getElementById('openAddUnitModalEditBtn');
    const btnCloseUnitModal = document.getElementById('btnCloseUnitModal');
    const btnSaveUnit = document.getElementById('btnSaveUnit');
    const newUnitNameInp = document.getElementById('newUnitName');
    const editUnitInp = document.getElementById('editUnit');

    // Add Tax Modal Elements
    const addTaxModal = document.getElementById('addTaxModal');
    const openAddTaxModalBtn = document.getElementById('openAddTaxModalBtn');
    const openAddTaxModalEditBtn = document.getElementById('openAddTaxModalEditBtn');
    const btnCloseTaxModal = document.getElementById('btnCloseTaxModal');
    const btnSaveTax = document.getElementById('btnSaveTax');
    const newTaxNameInp = document.getElementById('newTaxName');
    const editTaxInp = document.getElementById('editTaxCategory');

    let targetUnitDropdown = unitInp;
    let targetTaxDropdown = taxInp;

    // Global Items List Holder
    let items = [];

    // --- Dynamic Custom Units Management System ---
    async function loadSavedUnits() {
        try {
            const response = await fetch(UNIT_API_URL);
            if (response.ok) {
                const dbUnits = await response.json();
                dbUnits.forEach(u => {
                    const unitVal = u.unit_name;
                    addOptionToSelect(unitInp, unitVal);
                    addOptionToSelect(editUnitInp, unitVal);
                });
            } else {
                loadLocalUnitsFallback();
            }
        } catch (err) {
            console.warn("Unit API Offline. Loading fallback local units.");
            loadLocalUnitsFallback();
        }
    }

    function loadLocalUnitsFallback() {
        const savedUnits = JSON.parse(localStorage.getItem('customUnits')) || [];
        savedUnits.forEach(unitVal => {
            addOptionToSelect(unitInp, unitVal);
            addOptionToSelect(editUnitInp, unitVal);
        });
    }

    // --- Dynamic Custom Tax Categories Management System ---
    async function loadSavedTaxCategories() {
        try {
            const response = await fetch(TAX_API_URL);
            if (response.ok) {
                const dbTaxes = await response.json();
                dbTaxes.forEach(t => {
                    const taxVal = t.tax_name;
                    addOptionToSelect(taxInp, taxVal);
                    addOptionToSelect(editTaxInp, taxVal);
                });
            } else {
                loadLocalTaxesFallback();
            }
        } catch (err) {
            console.warn("Tax API Offline. Loading fallback local taxes.");
            loadLocalTaxesFallback();
        }
    }

    function loadLocalTaxesFallback() {
        const savedTaxes = JSON.parse(localStorage.getItem('customTaxes')) || [];
        savedTaxes.forEach(taxVal => {
            addOptionToSelect(taxInp, taxVal);
            addOptionToSelect(editTaxInp, taxVal);
        });
    }

    function addOptionToSelect(selectEl, val) {
        if (!selectEl) return;
        const exists = Array.from(selectEl.options).some(opt => opt.value.toLowerCase() === val.toLowerCase());
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            selectEl.appendChild(opt);
        }
    }

    loadSavedUnits();
    loadSavedTaxCategories();

    // Unit Modal Triggers
    if (openAddUnitModalBtn) {
        openAddUnitModalBtn.addEventListener('click', () => {
            targetUnitDropdown = unitInp;
            newUnitNameInp.value = '';
            clearError(newUnitNameInp, 'newUnitNameError');
            addUnitModal.style.display = 'flex';
            newUnitNameInp.focus();
        });
    }

    if (openAddUnitModalEditBtn) {
        openAddUnitModalEditBtn.addEventListener('click', () => {
            targetUnitDropdown = editUnitInp;
            newUnitNameInp.value = '';
            clearError(newUnitNameInp, 'newUnitNameError');
            addUnitModal.style.display = 'flex';
            newUnitNameInp.focus();
        });
    }

    if (btnCloseUnitModal) {
        btnCloseUnitModal.addEventListener('click', () => {
            addUnitModal.style.display = 'none';
        });
    }

    // Save Unit Button Handler
    if (btnSaveUnit) {
        btnSaveUnit.addEventListener('click', async () => {
            const unitVal = newUnitNameInp.value.trim();
            if (unitVal === '') {
                showError(newUnitNameInp, 'newUnitNameError', 'Please enter a unit name.');
                return;
            }

            try {
                const response = await fetch(UNIT_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unitName: unitVal })
                });

                const result = await response.json();

                if (response.ok || response.status === 201) {
                    addOptionToSelect(unitInp, unitVal);
                    addOptionToSelect(editUnitInp, unitVal);

                    if (targetUnitDropdown) {
                        targetUnitDropdown.value = unitVal;
                        clearError(targetUnitDropdown, targetUnitDropdown.id === 'itemUnit' ? 'itemUnitError' : 'editUnitError');
                    }

                    addUnitModal.style.display = 'none';
                    alert(result.message || 'Unit added successfully!');
                } else {
                    showError(newUnitNameInp, 'newUnitNameError', result.message || 'Error saving unit.');
                }
            } catch (err) {
                addOptionToSelect(unitInp, unitVal);
                addOptionToSelect(editUnitInp, unitVal);

                let savedUnits = JSON.parse(localStorage.getItem('customUnits')) || [];
                if (!savedUnits.some(u => u.toLowerCase() === unitVal.toLowerCase())) {
                    savedUnits.push(unitVal);
                    localStorage.setItem('customUnits', JSON.stringify(savedUnits));
                }

                if (targetUnitDropdown) {
                    targetUnitDropdown.value = unitVal;
                    clearError(targetUnitDropdown, targetUnitDropdown.id === 'itemUnit' ? 'itemUnitError' : 'editUnitError');
                }

                addUnitModal.style.display = 'none';
                alert('Server is offline. Unit added temporarily to local memory.');
            }
        });
    }

    // Tax Modal Triggers
    if (openAddTaxModalBtn) {
        openAddTaxModalBtn.addEventListener('click', () => {
            targetTaxDropdown = taxInp;
            newTaxNameInp.value = '';
            clearError(newTaxNameInp, 'newTaxNameError');
            addTaxModal.style.display = 'flex';
            newTaxNameInp.focus();
        });
    }

    if (openAddTaxModalEditBtn) {
        openAddTaxModalEditBtn.addEventListener('click', () => {
            targetTaxDropdown = editTaxInp;
            newTaxNameInp.value = '';
            clearError(newTaxNameInp, 'newTaxNameError');
            addTaxModal.style.display = 'flex';
            newTaxNameInp.focus();
        });
    }

    if (btnCloseTaxModal) {
        btnCloseTaxModal.addEventListener('click', () => {
            addTaxModal.style.display = 'none';
        });
    }

    // Save Tax Category Button Handler
    if (btnSaveTax) {
        btnSaveTax.addEventListener('click', async () => {
            const taxVal = newTaxNameInp.value.trim();
            if (taxVal === '') {
                showError(newTaxNameInp, 'newTaxNameError', 'Please enter a tax category name.');
                return;
            }

            try {
                const response = await fetch(TAX_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taxName: taxVal })
                });

                const result = await response.json();

                if (response.ok || response.status === 201) {
                    addOptionToSelect(taxInp, taxVal);
                    addOptionToSelect(editTaxInp, taxVal);

                    if (targetTaxDropdown) {
                        targetTaxDropdown.value = taxVal;
                        clearError(targetTaxDropdown, targetTaxDropdown.id === 'itemTaxCategory' ? 'itemTaxCategoryError' : 'editTaxCategoryError');
                    }

                    addTaxModal.style.display = 'none';
                    alert(result.message || 'Tax Category added successfully!');
                } else {
                    showError(newTaxNameInp, 'newTaxNameError', result.message || 'Error saving tax category.');
                }
            } catch (err) {
                addOptionToSelect(taxInp, taxVal);
                addOptionToSelect(editTaxInp, taxVal);

                let savedTaxes = JSON.parse(localStorage.getItem('customTaxes')) || [];
                if (!savedTaxes.some(t => t.toLowerCase() === taxVal.toLowerCase())) {
                    savedTaxes.push(taxVal);
                    localStorage.setItem('customTaxes', JSON.stringify(savedTaxes));
                }

                if (targetTaxDropdown) {
                    targetTaxDropdown.value = taxVal;
                    clearError(targetTaxDropdown, targetTaxDropdown.id === 'itemTaxCategory' ? 'itemTaxCategoryError' : 'editTaxCategoryError');
                }

                addTaxModal.style.display = 'none';
                alert('Server is offline. Tax Category added temporarily to local memory.');
            }
        });
    }

    // ★ GET: Fetch all items from database
    async function fetchItems() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                items = await response.json();
                renderTable(items);
            } else {
                renderTable(items);
            }
        } catch (error) {
            console.warn("Database not connected. Using local memory data.");
            renderTable(items);
        }
    }

    fetchItems();

    // --- Enter Key Navigation System ---
    const formFocusableElements = itemForm.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select, textarea, button[type="submit"]');
    formFocusableElements.forEach((element, index) => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (element.type === 'submit') return;
                e.preventDefault(); 
                
                const nextElement = formFocusableElements[index + 1];
                if (nextElement) {
                    nextElement.focus();
                    if (nextElement.tagName === 'INPUT' || nextElement.tagName === 'TEXTAREA') {
                        nextElement.select();
                    }
                }
            }
        });
    });

    // --- Validation UI Helpers ---
    function showError(inputEl, errorElId, message) {
        inputEl.classList.add('invalid-field');
        const errDiv = document.getElementById(errorElId);
        if (errDiv) { errDiv.textContent = message; errDiv.style.display = 'block'; }
    }

    function clearError(inputEl, errorElId) {
        inputEl.classList.remove('invalid-field');
        const errDiv = document.getElementById(errorElId);
        if (errDiv) { errDiv.textContent = ''; errDiv.style.display = 'none'; }
    }

    nameInp.addEventListener('input', () => {
        printNameInp.value = nameInp.value;
    });

    typeInp.addEventListener('change', () => {
        if (typeInp.value === 'Service') {
            stockInp.value = "0"; stockInp.disabled = true; stockValInp.value = "0.00";
            clearError(stockInp, 'itemOpeningStockError');
        } else {
            stockInp.disabled = false;
        }
    });

    function autoCalculateStockValue() {
        const qty = parseFloat(stockInp.value) || 0;
        const pPrice = parseFloat(purchaseInp.value) || 0;
        if (qty >= 0 && pPrice >= 0) stockValInp.value = (qty * pPrice).toFixed(2);
    }
    stockInp.addEventListener('input', autoCalculateStockValue);
    purchaseInp.addEventListener('input', autoCalculateStockValue);

    hsnInp.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') return; 
        if (e.which < 48 || e.target.value.length >= 10) e.preventDefault();
    });

    itemImgInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            imgLabel.innerHTML = `<i class="fa-solid fa-check"></i> ${this.files[0].name}`;
            imgLabel.style.borderColor = "#10b981";
        }
    });

    itemPdfInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            pdfLabel.innerHTML = `<i class="fa-solid fa-file-pdf"></i> ${this.files[0].name}`;
            pdfLabel.style.borderColor = "#ef4444";
        }
    });

    editImgInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            editImgLabel.innerHTML = `<i class="fa-solid fa-check"></i> ${this.files[0].name}`;
            editImgLabel.style.borderColor = "#10b981";
        }
    });

    // Validation logic for 6 mandatory fields
    function validateMainForm() {
        let isValid = true;
        
        if (nameInp.value.trim() === "") { showError(nameInp, 'itemNameError', 'Item Name is required.'); isValid = false; } else clearError(nameInp, 'itemNameError');
        if (typeInp.value === "") { showError(typeInp, 'itemTypeError', 'Item Type is required.'); isValid = false; } else clearError(typeInp, 'itemTypeError');
        if (groupInp.value === "") { showError(groupInp, 'itemGroupError', 'Group / Category is required.'); isValid = false; } else clearError(groupInp, 'itemGroupError');
        if (unitInp.value === "") { showError(unitInp, 'itemUnitError', 'Unit selection is required.'); isValid = false; } else clearError(unitInp, 'itemUnitError');
        if (taxInp.value === "") { showError(taxInp, 'itemTaxCategoryError', 'Tax Category is required.'); isValid = false; } else clearError(taxInp, 'itemTaxCategoryError');
        if (hsnInp.value.trim() === "") { showError(hsnInp, 'itemHsnCodeError', 'HSN / SAC Code is required.'); isValid = false; } else clearError(hsnInp, 'itemHsnCodeError');
        
        return isValid;
    }

    // ★ POST: Save new item
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateMainForm()) return;

        const generatedId = Date.now();
        const localItemObj = {
            id: generatedId,
            item_name: nameInp.value.trim(),
            item_code: codeInp.value.trim(),
            print_name: printNameInp.value.trim() || nameInp.value.trim(),
            item_type: typeInp.value,
            item_group: groupInp.value,
            brand: brandInp.value.trim(),
            unit: unitInp.value,
            tax_category: taxInp.value,
            hsn_sac_code: hsnInp.value.trim(),
            opening_stock_qty: stockInp.value.trim() || "0",
            opening_stock_value: stockValInp.value.trim() || "0.00",
            purchase_price: purchaseInp.value.trim() || "0.00",
            sales_price: salesInp.value.trim() || "0.00",
            mrp: mrpInp.value.trim() || "0.00",
            packing_dimension: packingInp.value.trim(),
            video_link: videoInp.value.trim(),
            item_specification: descInp.value.trim(),
            image_path: imgUrlInp.value.trim(),
            pdf_path: itemPdfInput.files[0] ? itemPdfInput.files[0].name : '',
            current_stock: stockInp.value.trim() || "0"
        };

        const formData = new FormData();
        formData.append('id', generatedId);
        formData.append('name', localItemObj.item_name);
        formData.append('code', localItemObj.item_code);
        formData.append('printName', localItemObj.print_name);
        formData.append('type', localItemObj.item_type);
        formData.append('group', localItemObj.item_group);
        formData.append('brand', localItemObj.brand);
        formData.append('unit', localItemObj.unit);
        formData.append('taxCategory', localItemObj.tax_category);
        formData.append('hsn', localItemObj.hsn_sac_code);
        formData.append('openingStock', localItemObj.opening_stock_qty);
        formData.append('purchasePrice', localItemObj.purchase_price);
        formData.append('price', localItemObj.sales_price);
        formData.append('mrp', localItemObj.mrp);
        formData.append('packing', localItemObj.packing_dimension);
        formData.append('videoLink', localItemObj.video_link);
        formData.append('description', localItemObj.item_specification);
        formData.append('image', localItemObj.image_path);

        if (itemImgInput.files[0]) formData.append('itemImg', itemImgInput.files[0]);
        if (itemPdfInput.files[0]) formData.append('itemPdf', itemPdfInput.files[0]);

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message || 'Item saved successfully!');
                itemForm.reset(); resetLabels(); fetchItems();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            console.error("Database not present. Saving to local table UI.");
            items.push(localItemObj);
            renderTable(items);
            alert('Server is offline! Item saved temporarily in table.');
            itemForm.reset(); resetLabels();
        }
    });

    // ★ PUT: Open edit item modal
    window.openEditModal = (id) => {
        const item = items.find(x => x.id.toString() === id.toString());
        if (!item) return;

        document.getElementById('editIndex').value = item.id;
        document.getElementById('editName').value = item.item_name;
        document.getElementById('editCode').value = item.item_code || '';
        document.getElementById('editPrintName').value = item.print_name || '';
        document.getElementById('editType').value = item.item_type || 'Product';
        document.getElementById('editGroup').value = item.item_group || 'General';
        document.getElementById('editBrand').value = item.brand || '';
        
        if (item.unit) {
            addOptionToSelect(editUnitInp, item.unit);
            editUnitInp.value = item.unit;
        } else {
            editUnitInp.value = 'Pcs';
        }

        if (item.tax_category) {
            addOptionToSelect(editTaxInp, item.tax_category);
            editTaxInp.value = item.tax_category;
        } else {
            editTaxInp.value = '';
        }

        document.getElementById('editHsnCode').value = item.hsn_sac_code || '';
        document.getElementById('editPurchasePrice').value = item.purchase_price || '0.00';
        document.getElementById('editPrice').value = item.sales_price || '0.00';
        document.getElementById('editMrp').value = item.mrp || '0.00';
        document.getElementById('editPacking').value = item.packing_dimension || '';
        document.getElementById('editVideoLink').value = item.video_link || '';
        document.getElementById('editStock').value = item.current_stock || '0';
        document.getElementById('editDescription').value = item.item_specification || '';
        
        if (item.image_path && item.image_path.startsWith('http')) {
            document.getElementById('editImageUrl').value = item.image_path;
        } else {
            document.getElementById('editImageUrl').value = '';
        }

        editImgLabel.innerHTML = '<i class="fa-solid fa-image"></i> Choose Image';
        editImgLabel.style.borderColor = "";
        editModal.style.display = 'flex';
    };

    // ★ PUT Submit: Data update pipeline
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editIndex').value;

        const name = document.getElementById('editName').value.trim();
        const code = document.getElementById('editCode').value.trim();
        const printName = document.getElementById('editPrintName').value.trim();
        const type = document.getElementById('editType').value;
        const group = document.getElementById('editGroup').value;
        const brand = document.getElementById('editBrand').value.trim();
        const unit = document.getElementById('editUnit').value;
        const taxCategory = document.getElementById('editTaxCategory').value;
        const hsn = document.getElementById('editHsnCode').value.trim();
        const purchasePrice = document.getElementById('editPurchasePrice').value.trim();
        const price = document.getElementById('editPrice').value.trim();
        const mrp = document.getElementById('editMrp').value.trim();
        const packing = document.getElementById('editPacking').value.trim();
        const videoLink = document.getElementById('editVideoLink').value.trim();
        const stock = document.getElementById('editStock').value.trim();
        const description = document.getElementById('editDescription').value.trim();
        const image = document.getElementById('editImageUrl').value.trim();

        if (!name || !type || !group || !unit || !taxCategory || !hsn) {
            alert('Please fill in all required fields marked with an asterisk (*).');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('code', code);
        formData.append('printName', printName);
        formData.append('type', type);
        formData.append('group', group);
        formData.append('brand', brand);
        formData.append('unit', unit);
        formData.append('taxCategory', taxCategory);
        formData.append('hsn', hsn);
        formData.append('purchasePrice', purchasePrice);
        formData.append('price', price);
        formData.append('mrp', mrp);
        formData.append('packing', packing);
        formData.append('videoLink', videoLink);
        formData.append('description', description);
        formData.append('image', image);

        if (editImgInput.files[0]) formData.append('itemImg', editImgInput.files[0]);

        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Updated successfully!');
                editModal.style.display = 'none'; fetchItems();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            const idx = items.findIndex(x => x.id.toString() === id.toString());
            if(idx !== -1) {
                items[idx] = { 
                    ...items[idx], 
                    item_name: name, item_code: code, print_name: printName, item_type: type, 
                    item_group: group, brand: brand, unit: unit, tax_category: taxCategory, 
                    hsn_sac_code: hsn, purchase_price: purchasePrice, sales_price: price, mrp: mrp, 
                    packing_dimension: packing, video_link: videoLink, 
                    item_specification: description, image_path: image 
                };
                renderTable(items);
                alert('Local changes updated temporarily!');
            }
            editModal.style.display = 'none';
        }
    });

    // ★ DELETE: Delete Item
    window.deleteItem = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    alert('Item deleted from database!'); fetchItems();
                }
            } catch (err) {
                items = items.filter(x => x.id.toString() !== id.toString());
                renderTable(items);
                alert('Item removed from local table!');
            }
        }
    };

    // Table UI Renderer Logic
    function renderTable(list) {
        itemTableBody.innerHTML = '';
        if(!list || list.length === 0) {
            itemTableBody.innerHTML = `<tr><td colspan="20" style="text-align:center; padding:20px; color:#64748b;">No items available.</td></tr>`;
            return;
        }

        list.forEach((item) => {
            let imgHtml = `<div class="table-item-icon-placeholder"><i class="fa-solid fa-box"></i></div>`;
            if (item.image_path && item.image_path.trim() !== "") {
                const srcPath = item.image_path.startsWith('http') || item.image_path.startsWith('data:') ? item.image_path : `http://localhost:5000${item.image_path}`;
                imgHtml = `<img src="${srcPath}" alt="${item.item_name}" class="table-item-img" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\'table-item-icon-placeholder\'><i class=\'fa-solid fa-image-broken\'></i></div>';">`;
            }

            let pdfHtml = '-';
            if (item.pdf_path && item.pdf_path.trim() !== "" && item.pdf_path !== "-") {
                const pdfUrl = item.pdf_path.startsWith('http') ? item.pdf_path : `http://localhost:5000${item.pdf_path}`;
                const pdfFileName = item.pdf_path.split('/').pop();
                pdfHtml = `<a href="${pdfUrl}" target="_blank" style="color:#ef4444; font-weight:600; text-decoration:none;" title="${pdfFileName}"><i class="fa-solid fa-file-pdf me-1"></i> View PDF</a>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${imgHtml}</td>
                <td class="item-name-bold">${item.item_name}</td>
                <td>${item.item_code || '-'}</td>
                <td>${item.print_name || '-'}</td>
                <td><span class="badge-type">${item.item_type || 'Product'}</span></td>
                <td>${item.item_group || '-'}</td>
                <td>${item.brand || '-'}</td>
                <td>${item.unit || '-'}</td>
                <td>${item.tax_category || '-'}</td>
                <td>${item.hsn_sac_code || '-'}</td>
                <td>${item.opening_stock_qty || '0'}</td>
                <td>₹${parseFloat(item.opening_stock_value || 0).toFixed(2)}</td>
                <td>₹${parseFloat(item.purchase_price || 0).toFixed(2)}</td>
                <td class="price-td">₹${parseFloat(item.sales_price || 0).toFixed(2)}</td>
                <td>₹${parseFloat(item.mrp || 0).toFixed(2)}</td>
                <td>${item.packing_dimension || '-'}</td>
                <td>${item.video_link ? `<a href="${item.video_link}" target="_blank" style="color:#2563eb; text-decoration:none;"><i class="fa-solid fa-video"></i> View</a>` : '-'}</td>
                <td title="${item.item_specification || ''}">${item.item_specification ? (item.item_specification.length > 15 ? item.item_specification.substring(0, 15) + '...' : item.item_specification) : '-'}</td>
                <td>${pdfHtml}</td>
                <td class="action-td-buttons">
                    <button class="t-btn btn-edit" onclick="openEditModal(${item.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="t-btn btn-delete" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            itemTableBody.appendChild(tr);
        });
    }

    function resetLabels() {
        imgLabel.innerHTML = '<i class="fa-solid fa-image"></i> Upload';
        pdfLabel.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Upload';
        imgLabel.style.borderColor = ""; pdfLabel.style.borderColor = "";
        stockInp.disabled = false; stockValInp.value = "0.00";
        document.querySelectorAll('.error-msg').forEach(err => { err.textContent = ''; err.style.display = 'none'; });
        document.querySelectorAll('.input-field-custom').forEach(x => x.classList.remove('invalid-field'));
    }

    closeModalBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
    document.getElementById('btnNewClear')?.addEventListener('click', (e) => { e.preventDefault(); itemForm.reset(); resetLabels(); nameInp.focus(); });
    document.getElementById('addNewDetailsBtn')?.addEventListener('click', () => { document.getElementById('formContainer').scrollIntoView({ behavior: 'smooth' }); });

    // --- Search Logic ---
    const searchInput = document.getElementById('itemSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.toLowerCase();
            const filtered = items.filter(item => item.item_name.toLowerCase().startsWith(filter));
            renderTable(filtered);
        });
    }

    // --- 9. Import / Export (SheetJS) ---
    const importBtn = document.getElementById('importItemBtn');
    const importInput = document.getElementById('importFileInput');
    const exportBtn = document.getElementById('exportItemBtn');

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const importedData = XLSX.utils.sheet_to_json(sheet);

                    if (importedData.length === 0) {
                        alert("No data found in file!"); return;
                    }

                    importedData.forEach(item => {
                        const nameVal = item["Item Name"] || item.name || item.Name || "N/A";
                        const codeVal = item.Code || item.code || "";
                        const printNameVal = item["Print Name"] || item.printName || nameVal;
                        const hsnValImport = item["HSN / SAC"] || item["HSN / SAC Code"] || item.hsn || item.HSN || "N/A";
                        const unitVal = item.Unit || item.unit || "Pcs";
                        const taxVal = item["Tax Category"] || item.taxCategory || "";
                        
                        if (unitVal) {
                            addOptionToSelect(unitInp, unitVal);
                            addOptionToSelect(editUnitInp, unitVal);
                        }

                        if (taxVal) {
                            addOptionToSelect(taxInp, taxVal);
                            addOptionToSelect(editTaxInp, taxVal);
                        }

                        const nameExists = items.some(x => x.item_name.toLowerCase() === nameVal.toLowerCase());
                        const codeExists = codeVal && items.some(x => x.item_code && x.item_code.toLowerCase() === codeVal.toString().toLowerCase());

                        if(!nameExists && !codeExists) {
                            items.push({
                                id: Date.now() + Math.random(),
                                item_name: nameVal,
                                item_code: codeVal.toString().trim(),
                                print_name: printNameVal,
                                hsn_sac_code: hsnValImport.toString().substring(0, 10), 
                                item_type: item.Type || item.type || "Product",
                                brand: item.Brand || item.brand || "",
                                item_group: item.Group || item.group || "",
                                unit: unitVal,
                                tax_category: taxVal,
                                opening_stock_qty: item["Opening Stock Qty"] || item.openingStock || "0",
                                opening_stock_value: item["Opening Stock Value"] || item.stockValue || "0.00",
                                purchase_price: item["Purchase Price"] || item.purchasePrice || "0",
                                sales_price: (item["Sales Price"] || item.price || item.Price || 0).toString(),
                                mrp: item.MRP || item.mrp || "0",
                                packing_dimension: item["Packing Dimension"] || item.packing || "",
                                video_link: item["Video Link"] || item.videoLink || "",
                                item_specification: item["Item Specification"] || item.description || "",
                                image_path: item.Image || item.image || item["Image URL"] || "",
                                pdf_path: item.Brochure || item["Brochure (PDF)"] || ""
                            });
                        }
                    });

                    localStorage.setItem('myItems', JSON.stringify(items));
                    renderTable(items);
                    alert('Excel data imported successfully to table!');
                } catch (error) {
                    console.error(error);
                    alert("An error occurred while reading the file.");
                } finally {
                    e.target.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (items.length === 0) return alert('No data available to export!');
            const exportCleanList = items.map(item => ({
                "Item Name": item.item_name, "Code": item.item_code, "Print Name": item.print_name,
                "Type": item.item_type, "Group": item.item_group, "Brand": item.brand, "Unit": item.unit,
                "Tax Category": item.tax_category, "HSN / SAC": item.hsn_sac_code,
                "Opening Stock Qty": item.opening_stock_qty, "Opening Stock Value": item.opening_stock_value,
                "Purchase Price": item.purchase_price, "Sales Price": item.sales_price, "MRP": item.mrp,
                "Packing Dimension": item.packing_dimension, "Video Link": item.video_link,
                "Item Specification": item.item_specification, "Image URL": item.image_path,
                "Brochure (PDF)": item.pdf_path
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportCleanList);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
            XLSX.writeFile(workbook, "ItemList.xlsx");
        });
    }
});