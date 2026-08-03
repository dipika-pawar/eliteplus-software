document.addEventListener('DOMContentLoaded', () => {
    
    // API URL Mapping
    const API_URL = 'http://localhost:5000/api/account';

    // Elements Setup
    const accountForm = document.getElementById('accountForm');
    const accountTableBody = document.getElementById('accountTableBody');
    const editAccountForm = document.getElementById('editAccountForm');
    const sameAsBillingCheckbox = document.getElementById('sameAsBilling');
    const searchInput = document.getElementById('searchInput');
    
    // Bootstrap Modal Reference
    const editModalEl = document.getElementById('editAccountModal');
    let editModal = null;
    if(editModalEl) {
        editModal = new bootstrap.Modal(editModalEl);
    }

    // लोकल स्टोरेज (डेटाबेस ऑफलाइन असल्यास बॅकअप)
    let accounts = JSON.parse(localStorage.getItem('myAccounts')) || [];

    // Save Data to LocalStorage
    function saveData() {
        localStorage.setItem('myAccounts', JSON.stringify(accounts));
    }

    // डेटाबेसमधील कॉलम्सला लोकल JS फॉरमॅटमध्ये मॅप करण्यासाठी फंक्शन
    function mapDBtoLocal(dbRows) {
        return dbRows.map(row => ({
            id: row.id,
            name: row.print_name,
            group: row.account_group,
            opBal: row.opening_bal,
            balType: row.bal_type,
            creditLimit: row.credit_limit,
            emailId: row.email_id,
            mobileNo: row.mobile_no,
            whatsapp: row.whatsapp_no,
            telNo: row.telephone_no,
            transport: row.transport,
            station: row.station,
            pinCode: row.pin_code,
            msmeType: row.msme_type,
            gstStatus: row.dealer_type,
            gstNo: row.gstin_no,
            panNo: row.pan_no,
            cinNo: row.cin_no,
            billAddr: row.billing_address,
            shipAddr: row.shipping_address,
            creditDays: row.credit_days,
            creditLimitVal: row.credit_limit_val,
            outAlert: row.outstanding_alert,
            blockSales: row.block_sales,
            panFileName: row.pan_file_name || '-',
            gstFileName: row.gst_file_name || '-',
            msmeFileName: row.msme_file_name || '-'
        }));
    }

    // ★ GET: डेटाबेसवरून डेटा आणून टेबल रेंडर करणे
    async function fetchAccounts() {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const dbData = await response.json();
                accounts = mapDBtoLocal(dbData); // डेटाबेस आणि लोकल मेमरी सिंक करणे
                saveData();
                renderTable();
            } else {
                renderTable(); // सर्व्हरने एरर दिल्यास लोकल डेटा दाखवा
            }
        } catch (error) {
            console.warn("Database is offline. Using local storage data.");
            renderTable(); // डेटाबेस बंद असेल तर लोकल डेटा दाखवा
        }
    }

    // पेज लोड झाल्यावर लगेच डेटा आणा
    fetchAccounts();

    // Live Uppercase Transformations
    ['gstinNo', 'panNo', 'cinNo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
        }
    });

    // Address Linking logic
    if (sameAsBillingCheckbox) {
        sameAsBillingCheckbox.addEventListener('change', function() {
            if (this.checked) document.getElementById('shipAddr').value = document.getElementById('billAddr').value;
        });
        document.getElementById('billAddr').addEventListener('input', function() {
            if (sameAsBillingCheckbox.checked) document.getElementById('shipAddr').value = this.value;
        });
    }

    function showFieldError(fieldId, message) {
        const element = document.getElementById(fieldId);
        if (!element) return;
        let errorContainer = element.parentNode.querySelector('.validation-error');
        if (!errorContainer) {
            errorContainer = document.createElement('small');
            errorContainer.className = 'validation-error';
            element.parentNode.appendChild(errorContainer);
        }
        errorContainer.innerText = message;
        errorContainer.style.display = 'block';
    }

    function clearAllErrors() {
        document.querySelectorAll('.validation-error').forEach(el => { el.style.display = 'none'; });
    }

    // Form Processing & Validation
    function validateAccountForm() {
        clearAllErrors();
        let isValid = true;
        const printName = document.getElementById('printName').value.trim();
        const accGroup = document.getElementById('accGroup').value;
        const opBal = document.getElementById('opBal').value.trim();
        const balType = document.getElementById('balType').value;
        const creditLimit = document.getElementById('creditLimit').value.trim();
        const emailId = document.getElementById('emailId').value.trim();
        const mobileNo = document.getElementById('mobileNo').value.trim();
        const whatsappNo = document.getElementById('whatsappNo').value.trim();
        const telNo = document.getElementById('telNo').value.trim();
        const transport = document.getElementById('transport').value.trim();
        const station = document.getElementById('station').value.trim();
        const pinCode = document.getElementById('pinCode').value.trim();
        const dealerType = document.getElementById('dealerType').value;
        const panNo = document.getElementById('panNo').value.trim();
        const billAddr = document.getElementById('billAddr').value.trim();
        const shipAddr = document.getElementById('shipAddr').value.trim();

        if (!printName) { showFieldError('printName', 'Print Name is required.'); isValid = false; }
        if (!accGroup) { showFieldError('accGroup', 'Group selection is required.'); isValid = false; }
        if (opBal === '') { showFieldError('opBal', 'Opening Bal is required.'); isValid = false; }
        if (!balType) { showFieldError('balType', 'Dr/Cr selection is required.'); isValid = false; }
        if (creditLimit === '') { showFieldError('creditLimit', 'Credit Limit is required.'); isValid = false; }
        if (!emailId) { showFieldError('emailId', 'Email ID is required.'); isValid = false; }
        if (!mobileNo) { showFieldError('mobileNo', 'Mobile No is required.'); isValid = false; }
        if (!whatsappNo) { showFieldError('whatsappNo', 'WhatsApp No is required.'); isValid = false; }
        if (!telNo) { showFieldError('telNo', 'Telephone No is required.'); isValid = false; }
        if (!transport) { showFieldError('transport', 'Transport is required.'); isValid = false; }
        if (!station) { showFieldError('station', 'Station is required.'); isValid = false; }
        if (!pinCode) { showFieldError('pinCode', 'Pin Code is required.'); isValid = false; }
        if (!dealerType) { showFieldError('dealerType', 'Dealer Type is required.'); isValid = false; }
        if (!panNo) { showFieldError('panNo', 'PAN No is required.'); isValid = false; }
        if (!billAddr) { showFieldError('billAddr', 'Billing Address is required.'); isValid = false; }
        if (!shipAddr) { showFieldError('shipAddr', 'Shipping Address is required.'); isValid = false; }

        if(!document.getElementById('panFile').files[0]) { showFieldError('panFile', 'PAN document upload is required.'); isValid = false; }

        return isValid;
    }

    // ★ POST: सेव्ह सबमिशन पाइपलाइन (Hybrid)
    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateAccountForm()) {
            document.getElementById('accountFormCard').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const generatedId = Date.now();
        const panFile = document.getElementById('panFile').files[0];
        const gstFile = document.getElementById('gstFile').files[0];
        const msmeFile = document.getElementById('msmeFile').files[0];

        // 1. स्थानिक मेमरीसाठी ऑब्जेक्ट तयार करा
        const newAccount = {
            id: generatedId,
            name: document.getElementById('printName').value.trim(),
            group: document.getElementById('accGroup').value,
            opBal: document.getElementById('opBal').value.trim(),
            balType: document.getElementById('balType').value,
            creditLimit: document.getElementById('creditLimit').value.trim() || '0',
            emailId: document.getElementById('emailId').value.trim(),
            mobileNo: document.getElementById('mobileNo').value.trim(),
            whatsapp: document.getElementById('whatsappNo').value.trim(),
            telNo: document.getElementById('telNo').value.trim(),
            transport: document.getElementById('transport').value.trim(),
            station: document.getElementById('station').value.trim(),
            pinCode: document.getElementById('pinCode').value.trim(),
            msmeType: document.getElementById('msmeType').value,
            gstStatus: document.getElementById('dealerType').value,
            gstNo: document.getElementById('gstinNo').value.trim().toUpperCase(),
            panNo: document.getElementById('panNo').value.trim().toUpperCase(),
            cinNo: document.getElementById('cinNo').value.trim().toUpperCase(),
            billAddr: document.getElementById('billAddr').value.trim(),
            shipAddr: document.getElementById('shipAddr').value.trim(),
            creditDays: document.getElementById('creditDays').value,
            creditLimitVal: document.getElementById('creditLimitVal').value,
            outAlert: document.getElementById('outAlert').value,
            blockSales: document.getElementById('blockSales').value,
            panFileName: panFile ? panFile.name : '-',
            gstFileName: gstFile ? gstFile.name : '-',
            msmeFileName: msmeFile ? msmeFile.name : '-'
        };

        // 2. बॅकएंडसाठी फॉर्म डेटा
        const formData = new FormData();
        formData.append('id', newAccount.id);
        formData.append('name', newAccount.name);
        formData.append('group', newAccount.group);
        formData.append('opBal', newAccount.opBal);
        formData.append('balType', newAccount.balType);
        formData.append('creditLimit', newAccount.creditLimit);
        formData.append('emailId', newAccount.emailId);
        formData.append('mobileNo', newAccount.mobileNo);
        formData.append('whatsapp', newAccount.whatsapp);
        formData.append('telNo', newAccount.telNo);
        formData.append('transport', newAccount.transport);
        formData.append('station', newAccount.station);
        formData.append('pinCode', newAccount.pinCode);
        formData.append('msmeType', newAccount.msmeType);
        formData.append('gstStatus', newAccount.gstStatus);
        formData.append('gstNo', newAccount.gstNo);
        formData.append('panNo', newAccount.panNo);
        formData.append('cinNo', newAccount.cinNo);
        formData.append('billAddr', newAccount.billAddr);
        formData.append('shipAddr', newAccount.shipAddr);
        formData.append('creditDays', newAccount.creditDays);
        formData.append('creditLimitVal', newAccount.creditLimitVal);
        formData.append('outAlert', newAccount.outAlert);
        formData.append('blockSales', newAccount.blockSales);

        if(panFile) formData.append('panFile', panFile);
        if(gstFile) formData.append('gstFile', gstFile);
        if(msmeFile) formData.append('msmeFile', msmeFile);

        try {
            // ३. डेटाबेसमध्ये सेव्ह करण्याचा प्रयत्न
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const data = await response.json();
            if(response.ok) {
                alert(data.message);
                accountForm.reset();
                if(sameAsBillingCheckbox) sameAsBillingCheckbox.checked = false;
                clearAllErrors();
                fetchAccounts(); 
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) {
            // ४. सर्व्हर बंद असल्यास स्थानिक मेमरीमध्ये सेव्ह करा
            accounts.push(newAccount);
            saveData();
            renderTable();
            accountForm.reset();
            if(sameAsBillingCheckbox) sameAsBillingCheckbox.checked = false;
            clearAllErrors();
            alert("डेटाबेस कनेक्ट नाही! अकाउंट तात्पुरते लोकल मेमरीमध्ये सेव्ह केले आहे.");
        }
    });

    // Render Table Body
    function renderTable(filter = '') {
        accountTableBody.innerHTML = '';
        
        const filteredAccounts = accounts.filter(acc => 
            acc.name && acc.name.toLowerCase().startsWith(filter.toLowerCase())
        );

        if(filteredAccounts.length === 0) {
            accountTableBody.innerHTML = `<tr><td colspan="28" class="text-center py-3 text-muted">No records found.</td></tr>`;
            return;
        }

        filteredAccounts.forEach((acc) => {
            const originalIndex = accounts.indexOf(acc);
            
            const tr = document.createElement('tr');
            tr.className = "table-row-hover";
            tr.setAttribute('data-id', acc.id);
            tr.innerHTML = `
                <td>${acc.name || '-'}</td>
                <td><span class="badge-group">${acc.group || '-'}</span></td>
                <td>${acc.opBal || '0'}</td>
                <td>${acc.balType || '-'}</td>
                <td>${acc.creditLimit || '0'}</td>
                <td>${acc.emailId || '-'}</td>
                <td>${acc.mobileNo || '-'}</td>
                <td>${acc.whatsapp || '-'}</td>
                <td>${acc.telNo || '-'}</td>
                <td>${acc.transport || '-'}</td>
                <td>${acc.station || '-'}</td>
                <td>${acc.pinCode || '-'}</td>
                <td>${acc.msmeType || '-'}</td>
                <td>${acc.gstStatus || '-'}</td>
                <td>${acc.gstNo || '-'}</td>
                <td>${acc.panNo || '-'}</td>
                <td>${acc.cinNo || '-'}</td>
                <td>${acc.billAddr || '-'}</td>
                <td>${acc.shipAddr || '-'}</td>
                <td>${acc.creditDays || '0'}</td>
                <td>${acc.creditLimitVal || '0'}</td>
                <td>${acc.outAlert || '-'}</td>
                <td>${acc.blockSales || '-'}</td>
                <td><i class="fa-solid fa-file-image text-muted me-1"></i> ${acc.panFileName || '-'}</td>
                <td><i class="fa-solid fa-file-image text-muted me-1"></i> ${acc.gstFileName || '-'}</td>
                <td><i class="fa-solid fa-file-image text-muted me-1"></i> ${acc.msmeFileName || '-'}</td>
                <td><span class="badge-active">Active</span></td>
                <td>
                    <div class="table-actions-btns">
                        <button class="btn btn-table-edit btn-edit-hook"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-table-delete btn-delete-hook"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            accountTableBody.appendChild(tr);
        });
    }

    // ★ PUT / DELETE Action Listeners (Click Delegation)
    accountTableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-hook');
        const deleteBtn = e.target.closest('.btn-delete-hook');
        if(!editBtn && !deleteBtn) return;

        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const index = accounts.findIndex(a => a.id.toString() === id.toString());

        // ★ DELETE Action
        if(deleteBtn) {
            if (confirm('Are you sure you want to delete this account?')) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if(response.ok) {
                        alert("Account Deleted successfully!");
                        fetchAccounts();
                    }
                } catch(err) { 
                    // Fallback
                    accounts.splice(index, 1);
                    saveData(); renderTable(searchInput ? searchInput.value : '');
                    alert("अकाउंट लोकल मेमरीमधून डिलीट झाले!"); 
                }
            }
        }

        // ★ EDIT Populate Window Action
        if(editBtn) {
            const acc = accounts[index];
            if(!acc) return;

            document.getElementById('editRowIndex').value = acc.id;
            document.getElementById('editPrintName').value = acc.name || '';
            document.getElementById('editAccGroup').value = acc.group || '';
            document.getElementById('editOpBal').value = acc.opBal || '0';
            document.getElementById('editBalType').value = acc.balType || '';
            document.getElementById('editCreditLimit').value = acc.creditLimit || '0';
            document.getElementById('editEmailId').value = acc.emailId || '';
            document.getElementById('editMobileNo').value = acc.mobileNo || '';
            document.getElementById('editWhatsapp').value = acc.whatsapp || '';
            document.getElementById('editTelNo').value = acc.telNo || '';
            document.getElementById('editTransport').value = acc.transport || '';
            document.getElementById('editStation').value = acc.station || '';
            document.getElementById('editPinCode').value = acc.pinCode || '';
            document.getElementById('editMsmeType').value = acc.msmeType || '';
            document.getElementById('editDealerType').value = acc.gstStatus || '';
            document.getElementById('editGstinNo').value = acc.gstNo || '';
            document.getElementById('editPanNo').value = acc.panNo || '';
            document.getElementById('editCinNo').value = acc.cinNo || '';
            document.getElementById('editBillAddr').value = acc.billAddr || '';
            document.getElementById('editShipAddr').value = acc.shipAddr || '';
            document.getElementById('editCreditDays').value = acc.creditDays || '0';
            document.getElementById('editCreditLimitVal').value = acc.creditLimitVal || '0';
            document.getElementById('editOutAlert').value = acc.outAlert || '';
            document.getElementById('editBlockSales').value = acc.blockSales || '';
            
            if(editModal) editModal.show();
        }
    });

    // ★ PUT Submit Form Action
    editAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editRowIndex').value;
        const index = accounts.findIndex(a => a.id.toString() === id.toString());
        
        const formData = new FormData();
        formData.append('name', document.getElementById('editPrintName').value.trim());
        formData.append('group', document.getElementById('editAccGroup').value);
        formData.append('opBal', document.getElementById('editOpBal').value.trim());
        formData.append('balType', document.getElementById('editBalType').value);
        formData.append('creditLimit', document.getElementById('editCreditLimit').value.trim());
        formData.append('emailId', document.getElementById('editEmailId').value.trim());
        formData.append('mobileNo', document.getElementById('editMobileNo').value.trim());
        formData.append('whatsapp', document.getElementById('editWhatsapp').value.trim());
        formData.append('telNo', document.getElementById('editTelNo').value.trim());
        formData.append('transport', document.getElementById('editTransport').value.trim());
        formData.append('station', document.getElementById('editStation').value.trim());
        formData.append('pinCode', document.getElementById('editPinCode').value.trim());
        formData.append('msmeType', document.getElementById('editMsmeType').value);
        formData.append('gstStatus', document.getElementById('editDealerType').value);
        formData.append('gstNo', document.getElementById('editGstinNo').value.trim());
        formData.append('panNo', document.getElementById('editPanNo').value.trim());
        formData.append('cinNo', document.getElementById('editCinNo').value.trim());
        formData.append('billAddr', document.getElementById('editBillAddr').value.trim());
        formData.append('shipAddr', document.getElementById('editShipAddr').value.trim());
        formData.append('creditDays', document.getElementById('editCreditDays').value);
        formData.append('creditLimitVal', document.getElementById('editCreditLimitVal').value);
        formData.append('outAlert', document.getElementById('editOutAlert').value);
        formData.append('blockSales', document.getElementById('editBlockSales').value);

        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
            if(response.ok) {
                alert("Account Master Updated successfully!");
                if(editModal) editModal.hide();
                fetchAccounts();
            }
        } catch(err) { 
            // Fallback
            if(index !== -1) {
                accounts[index] = { ...accounts[index], 
                    name: document.getElementById('editPrintName').value.trim(),
                    group: document.getElementById('editAccGroup').value,
                    opBal: document.getElementById('editOpBal').value.trim(),
                    balType: document.getElementById('editBalType').value,
                    creditLimit: document.getElementById('editCreditLimit').value.trim(),
                    emailId: document.getElementById('editEmailId').value.trim(),
                    mobileNo: document.getElementById('editMobileNo').value.trim()
                };
                saveData(); renderTable(searchInput ? searchInput.value : '');
                if(editModal) editModal.hide();
                alert("लोकल मेमरीमध्ये अपडेट झाले!");
            }
        }
    });

    // --- Tab / Buttons Scroll Navigations ---
    document.getElementById('scrollListBtn')?.addEventListener('click', () => {
        document.getElementById('accountListCard').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('addAccountBtn')?.addEventListener('click', () => {
        document.getElementById('accountFormCard').scrollIntoView({ behavior: 'smooth' });
    });

    // Live Search Filter
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTable(searchInput.value);
        });
    }

    // --- 5. Import / Export Functional Handlers (SheetJS Logic Maintained) ---
    document.getElementById('importAccountBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            
            rows.forEach(async row => {
                const generatedId = Date.now() + Math.random();
                const newAccLocal = {
                    id: generatedId,
                    name: row.Name || '',
                    group: row.Group || '',
                    opBal: row['Opening Bal'] || '0',
                    balType: row['Dr/Cr'] || '',
                    creditLimit: row['Credit Limit'] || '0',
                    emailId: row['Email ID'] || '',
                    mobileNo: row['Mobile No'] || '',
                    whatsapp: row.WhatsApp || '',
                    telNo: row.Telephone || '',
                    transport: row.Transport || '',
                    station: row.Station || '',
                    pinCode: row['Pin Code'] || '',
                    msmeType: row['MSME Type'] || '',
                    gstStatus: row['Dealer Type'] || '',
                    gstNo: row['GST No'] || '',
                    panNo: row['PAN No'] || '',
                    cinNo: row['CIN No'] || '',
                    billAddr: row['Billing Addr'] || '',
                    shipAddr: row['Shipping Addr'] || '',
                    creditDays: row['Credit Days'] || '0',
                    creditLimitVal: row['Credit Limit Val'] || '0',
                    outAlert: row['Out Alert'] || '',
                    blockSales: row['Block Sales'] || '',
                    panFileName: '-', gstFileName: '-', msmeFileName: '-'
                };

                // डेटाबेसमध्ये ढकलण्याचा प्रयत्न
                const formData = new FormData();
                formData.append('id', newAccLocal.id);
                formData.append('name', newAccLocal.name);
                formData.append('group', newAccLocal.group);
                formData.append('opBal', newAccLocal.opBal);
                formData.append('balType', newAccLocal.balType);
                formData.append('creditLimit', newAccLocal.creditLimit);
                formData.append('emailId', newAccLocal.emailId);
                formData.append('mobileNo', newAccLocal.mobileNo);
                formData.append('whatsapp', newAccLocal.whatsapp);
                formData.append('telNo', newAccLocal.telNo);
                formData.append('transport', newAccLocal.transport);
                formData.append('station', newAccLocal.station);
                formData.append('pinCode', newAccLocal.pinCode);
                formData.append('msmeType', newAccLocal.msmeType);
                formData.append('gstStatus', newAccLocal.gstStatus);
                formData.append('gstNo', newAccLocal.gstNo);
                formData.append('panNo', newAccLocal.panNo);
                formData.append('cinNo', newAccLocal.cinNo);
                formData.append('billAddr', newAccLocal.billAddr);
                formData.append('shipAddr', newAccLocal.shipAddr);
                
                try {
                    await fetch(API_URL, { method: 'POST', body: formData });
                } catch(e) {
                    // Ignore error - saved locally below
                }
                
                accounts.push(newAccLocal);
            });
            
            saveData();
            renderTable();
            alert('Data Imported Successfully!');
            setTimeout(fetchAccounts, 2000); // 2 सेकंदानी डेटाबेस सिंक तपासा
        };
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('exportAccountBtn').addEventListener('click', () => {
        const wb = XLSX.utils.table_to_book(document.querySelector('.table-custom'), { sheet: "Accounts" });
        XLSX.writeFile(wb, 'Account_List.xlsx');
    });

});