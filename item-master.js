document.addEventListener("DOMContentLoaded", () => {
    
    // बॅकएंड एपीआय मुख्य URL मॅपिंग
    const API_URL = 'http://localhost:5000/api/item';

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

    // ग्लोबल आयटम्स लिस्ट होल्डर
    let items = [];

    // ★ GET: डेटाबेसवरून सर्व आयटम फेच करा
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
            console.warn("डेटाबेस कनेक्ट नाही, लोकल मेमरी डेटा वापरत आहे.");
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
                    if (nextElement.tagName === 'SELECT') {
                        if (typeof nextElement.showPicker === 'function') {
                            try { nextElement.showPicker(); } catch (err) { console.log(err); }
                        }
                    }
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

    function validateMainForm() {
        let isValid = true;
        if (nameInp.value.trim() === "") { showError(nameInp, 'itemNameError', 'Item Name is required.'); isValid = false; } else clearError(nameInp, 'itemNameError');
        if (codeInp.value.trim() === "") { showError(codeInp, 'itemCodeError', 'Item Code is required.'); isValid = false; } else clearError(codeInp, 'itemCodeError');
        if (typeInp.value === "") { showError(typeInp, 'itemTypeError', 'Item Type is required.'); isValid = false; } else clearError(typeInp, 'itemTypeError');
        if (unitInp.value === "") { showError(unitInp, 'itemUnitError', 'Unit selection is required.'); isValid = false; } else clearError(unitInp, 'itemUnitError');
        if (taxInp.value === "") { showError(taxInp, 'itemTaxCategoryError', 'Tax Category is required.'); isValid = false; } else clearError(taxInp, 'itemTaxCategoryError');
        
        return isValid;
    }

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
            opening_stock_qty: stockInp.value.trim(),
            opening_stock_value: stockValInp.value.trim(),
            purchase_price: purchaseInp.value.trim(),
            sales_price: salesInp.value.trim(),
            mrp: mrpInp.value.trim(),
            packing_dimension: packingInp.value.trim(),
            video_link: videoInp.value.trim(),
            item_specification: descInp.value.trim(),
            image_path: imgUrlInp.value.trim(),
            current_stock: stockInp.value.trim()
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
        formData.append('stock', localItemObj.current_stock);

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
            alert('सर्व्हर बंद आहे! आयटम तात्पुरता स्क्रीन टेबलमध्ये सेव्ह केला गेला आहे.');
            itemForm.reset(); resetLabels();
        }
    });

    // ★ PUT: आयटम एडिट मॉडेल उघडणे (आता सर्व २० कॉलम्स व्हेरिएबल्स लोड होतील)
    window.openEditModal = (id) => {
        const item = items.find(x => x.id.toString() === id.toString());
        if (!item) return;

        document.getElementById('editIndex').value = item.id;
        document.getElementById('editName').value = item.item_name;
        document.getElementById('editCode').value = item.item_code;
        document.getElementById('editPrintName').value = item.print_name || '';
        document.getElementById('editType').value = item.item_type || 'Product';
        document.getElementById('editGroup').value = item.item_group || 'General';
        document.getElementById('editBrand').value = item.brand || '';
        document.getElementById('editUnit').value = item.unit || 'Pcs';
        document.getElementById('editTaxCategory').value = item.tax_category || '';
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

    // ★ PUT Submit: डेटा अपडेट करणे (सर्व फिल्ड्स समाविष्ट केल्या आहेत)
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
        formData.append('stock', stock);
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
                    packing_dimension: packing, video_link: videoLink, current_stock: stock, 
                    item_specification: description, image_path: image 
                };
                renderTable(items);
                alert('तात्पुरते लोकल चेंजेस अपडेट झाले!');
            }
            editModal.style.display = 'none';
        }
    });

    // ★ DELETE: आयटम डिलीट करणे
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
                alert('आयटम लोकल टेबलमधून काढून टाकला!');
            }
        }
    };

    // Table UI Renderer Logic (Displays all 20 layout values)
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
                <td><span class="stock-td highlight-stock">${item.current_stock || '0'}</span></td>
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
                        const codeVal = item.Code || item.code || "N/A";
                        const printNameVal = item["Print Name"] || item.printName || nameVal;
                        const hsnValImport = item["HSN / SAC"] || item["HSN / SAC Code"] || item.hsn || item.HSN || "N/A";
                        
                        const nameExists = items.some(x => x.item_name.toLowerCase() === nameVal.toLowerCase());
                        const codeExists = items.some(x => x.item_code && x.item_code.toLowerCase() === codeVal.toString().toLowerCase());

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
                                unit: item.Unit || item.unit || "Pcs",
                                tax_category: item["Tax Category"] || item.taxCategory || "",
                                opening_stock_qty: item["Opening Stock Qty"] || item.openingStock || "0",
                                opening_stock_value: item["Opening Stock Value"] || item.stockValue || "0.00",
                                purchase_price: item["Purchase Price"] || item.purchasePrice || "0",
                                sales_price: (item["Sales Price"] || item.price || item.Price || 0).toString(),
                                mrp: item.MRP || item.mrp || "0",
                                packing_dimension: item["Packing Dimension"] || item.packing || "",
                                video_link: item["Video Link"] || item.videoLink || "",
                                item_specification: item["Item Specification"] || item.description || "",
                                current_stock: (item.Stock || item.stock || 0).toString(),
                                image_path: item.Image || item.image || item["Image URL"] || ""
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
                "Item Specification": item.item_specification, "Stock": item.current_stock, "Image URL": item.image_path
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportCleanList);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
            XLSX.writeFile(workbook, "ItemList.xlsx");
        });
    }
});