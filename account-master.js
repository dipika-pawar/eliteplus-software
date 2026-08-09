document.addEventListener('DOMContentLoaded', () => {

  // Auto Fetch Dr/Cr Logic based on Group Selection
  const setupAutoDrCr = (groupSelectId, balTypeSelectId) => {
    const groupElem = document.getElementById(groupSelectId);
    const balTypeElem = document.getElementById(balTypeSelectId);

    if (groupElem && balTypeElem) {
      groupElem.addEventListener('change', (e) => {
        const selectedGroup = e.target.value.toLowerCase().trim();
        if (selectedGroup.includes('debtors')) {
          balTypeElem.value = 'Dr';
        } else if (selectedGroup.includes('creditors')) {
          balTypeElem.value = 'Cr';
        }
      });
    }
  };

  setupAutoDrCr('accGroup', 'balType');
  setupAutoDrCr('editAccGroup', 'editBalType');

  // AUTO FETCH MOBILE NO TO WHATSAPP NO (WITH CUSTOM EDIT ALLOWED)
  const setupAutoWhatsapp = (mobileId, whatsappId) => {
    const mobileInput = document.getElementById(mobileId);
    const whatsappInput = document.getElementById(whatsappId);

    if (mobileInput && whatsappInput) {
      let isCustomWhatsapp = false;

      mobileInput.addEventListener('input', () => {
        if (!isCustomWhatsapp) {
          whatsappInput.value = mobileInput.value;
        }
      });

      whatsappInput.addEventListener('input', () => {
        // User enters a custom WhatsApp number
        isCustomWhatsapp = true;
        // If user clears WhatsApp input manually, sync it again with mobile number
        if (whatsappInput.value.trim() === '') {
          isCustomWhatsapp = false;
        }
      });
    }
  };

  setupAutoWhatsapp('mobileNo', 'whatsappNo');
  setupAutoWhatsapp('editMobileNo', 'editWhatsapp');

  // Enter Key Navigation & Auto File/Select Picker Logic
  const setupEnterNavigation = (container) => {
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.target.tagName.toLowerCase() === 'textarea' && e.shiftKey) {
          return;
        }

        const focusableElements = Array.from(
          container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]')
        );

        const index = focusableElements.indexOf(e.target);
        if (index > -1 && index < focusableElements.length - 1) {
          e.preventDefault();
          const nextElement = focusableElements[index + 1];
          nextElement.focus();

          if (nextElement.tagName.toLowerCase() === 'input' && nextElement.type === 'text') {
            nextElement.select();
          }

          // Dropdown Open Logic
          if (nextElement.tagName.toLowerCase() === 'select') {
            if (typeof nextElement.showPicker === 'function') {
              try {
                nextElement.showPicker();
              } catch (err) {
                console.log("Unable to auto-open select picker", err);
              }
            }
          }

          // File Input Open Logic (Folder Dialog Open)
          if (nextElement.tagName.toLowerCase() === 'input' && nextElement.type === 'file') {
            if (typeof nextElement.showPicker === 'function') {
              try {
                nextElement.showPicker();
              } catch (err) {
                nextElement.click();
              }
            } else {
              nextElement.click();
            }
          }
        }
      }
    });
  };

  const accountFormEl = document.getElementById('accountForm');
  const editAccountFormEl = document.getElementById('editAccountForm');
  if (accountFormEl) setupEnterNavigation(accountFormEl);
  if (editAccountFormEl) setupEnterNavigation(editAccountFormEl);

  // Mobile Menu Toggle logic
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // API URL Mapping
  const API_URL = 'http://localhost:5000/api/account';

  // Elements Setup
  const accountForm = document.getElementById('accountForm');
  const accountTableBody = document.getElementById('accountTableBody');
  const editAccountForm = document.getElementById('editAccountForm');
  const sameAsBillingCheckbox = document.getElementById('sameAsBilling');
  const searchInput = document.getElementById('searchInput');
  const resetBtn = document.getElementById('resetBtn');

  // Bootstrap Modal Reference
  const editModalEl = document.getElementById('editAccountModal');
  let editModal = null;
  if (editModalEl) {
    editModal = new bootstrap.Modal(editModalEl);
  }

  let accounts = JSON.parse(localStorage.getItem('myAccounts')) || [];

  function saveData() {
    localStorage.setItem('myAccounts', JSON.stringify(accounts));
  }

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

  async function fetchAccounts() {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const dbData = await response.json();
        accounts = mapDBtoLocal(dbData);
        saveData();
        renderTable();
      } else {
        renderTable();
      }
    } catch (error) {
      console.warn("Database is offline. Using local storage data.");
      renderTable();
    }
  }

  fetchAccounts();

  ['gstinNo', 'panNo', 'cinNo'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', function () { this.value = this.value.toUpperCase(); });
    }
  });

  if (sameAsBillingCheckbox) {
    sameAsBillingCheckbox.addEventListener('change', function () {
      if (this.checked) document.getElementById('shipAddr').value = document.getElementById('billAddr').value;
    });
    document.getElementById('billAddr').addEventListener('input', function () {
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

  // RESET BUTTON LOGIC
  if (resetBtn && accountForm) {
    resetBtn.addEventListener('click', () => {
      accountForm.reset();
      if (sameAsBillingCheckbox) sameAsBillingCheckbox.checked = false;
      clearAllErrors();
    });
  }

  // CUSTOM VALIDATION ENGINE (STRICT IMAGE ONLY VALIDATION)
  function validateAccountForm() {
    clearAllErrors();
    let isValid = true;

    const printName = document.getElementById('printName').value.trim();
    const accGroup = document.getElementById('accGroup').value;
    const mobileNo = document.getElementById('mobileNo').value.trim();
    const whatsappNo = document.getElementById('whatsappNo').value.trim();
    const pinCode = document.getElementById('pinCode').value.trim();
    const dealerType = document.getElementById('dealerType').value;
    const gstinNo = document.getElementById('gstinNo').value.trim().toUpperCase();
    const panNo = document.getElementById('panNo').value.trim().toUpperCase();
    const emailId = document.getElementById('emailId').value.trim();
    const opBal = document.getElementById('opBal').value.trim();
    const creditLimit = document.getElementById('creditLimit').value.trim();

    // Regex Patterns
    const mobileRegex = /^[6-9]\d{9}$/;
    const pinRegex = /^\d{6}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const numberRegex = /^\d*(\.\d+)?$/;

    // 1. Party Name Validation
    if (!printName) {
      showFieldError('printName', 'Party Name is required.');
      isValid = false;
    } else if (printName.length < 3) {
      showFieldError('printName', 'Party Name must be at least 3 characters long.');
      isValid = false;
    }

    // 2. Group Validation
    if (!accGroup) {
      showFieldError('accGroup', 'Group selection is required.');
      isValid = false;
    }

    // 3. Mobile Number Validation
    if (!mobileNo) {
      showFieldError('mobileNo', 'Mobile Number is required.');
      isValid = false;
    } else if (!mobileRegex.test(mobileNo)) {
      showFieldError('mobileNo', 'Enter a valid 10-digit Mobile Number starting with 6-9.');
      isValid = false;
    }

    // WhatsApp Number Validation (Optional but if entered)
    if (whatsappNo && !mobileRegex.test(whatsappNo)) {
      showFieldError('whatsappNo', 'Enter a valid 10-digit WhatsApp Number.');
      isValid = false;
    }

    // 4. Pin Code Validation
    if (!pinCode) {
      showFieldError('pinCode', 'Pin Code is required.');
      isValid = false;
    } else if (!pinRegex.test(pinCode)) {
      showFieldError('pinCode', 'Enter a valid 6-digit Pin Code.');
      isValid = false;
    }

    // 5. Dealer Type & GSTIN Validation
    if (!dealerType) {
      showFieldError('dealerType', 'Dealer Type selection is required.');
      isValid = false;
    } else if (dealerType === 'Registered') {
      if (!gstinNo) {
        showFieldError('gstinNo', 'GSTIN Number is required for Registered dealers.');
        isValid = false;
      } else if (!gstRegex.test(gstinNo)) {
        showFieldError('gstinNo', 'Enter a valid 15-digit GSTIN Number.');
        isValid = false;
      }
    } else if (gstinNo && !gstRegex.test(gstinNo)) {
      showFieldError('gstinNo', 'Enter a valid 15-digit GSTIN Number.');
      isValid = false;
    }

    // 6. PAN Number Validation
    if (panNo && !panRegex.test(panNo)) {
      showFieldError('panNo', 'Enter a valid 10-character PAN Number (e.g., ABCDE1234F).');
      isValid = false;
    }

    // 7. Email Validation
    if (emailId && !emailRegex.test(emailId)) {
      showFieldError('emailId', 'Enter a valid Email Address.');
      isValid = false;
    }

    // 8. Opening Bal & Credit Limit Numeric Validation
    if (opBal && (!numberRegex.test(opBal) || parseFloat(opBal) < 0)) {
      showFieldError('opBal', 'Enter a valid positive number for Opening Balance.');
      isValid = false;
    }

    if (creditLimit && (!numberRegex.test(creditLimit) || parseFloat(creditLimit) < 0)) {
      showFieldError('creditLimit', 'Enter a valid positive number for Credit Limit.');
      isValid = false;
    }

    // 9. File Upload Validations - STRICTLY IMAGES ONLY (.jpg, .jpeg, .png)
    const allowedImageExtensions = ['jpg', 'jpeg', 'png'];
    const validateImageFile = (fileInputId) => {
      const fileInput = document.getElementById(fileInputId);
      if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedImageExtensions.includes(ext) || !file.type.startsWith('image/')) {
          showFieldError(fileInputId, 'Only image files (.jpg, .jpeg, .png) are allowed. PDF or other documents are not accepted.');
          isValid = false;
        } else if (file.size > 2 * 1024 * 1024) {
          showFieldError(fileInputId, 'Image file size must be less than 2MB.');
          isValid = false;
        }
      }
    };

    validateImageFile('panFile');
    validateImageFile('gstFile');
    validateImageFile('msmeFile');

    return isValid;
  }

  // POST Submission Pipeline
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

    const newAccount = {
      id: generatedId,
      name: document.getElementById('printName').value.trim(),
      group: document.getElementById('accGroup').value,
      opBal: document.getElementById('opBal').value.trim() || '0',
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
      creditDays: document.getElementById('creditDays').value.trim(),
      creditLimitVal: document.getElementById('creditLimitVal').value.trim(),
      outAlert: document.getElementById('outAlert').value,
      blockSales: document.getElementById('blockSales').value,
      panFileName: panFile ? panFile.name : '-',
      gstFileName: gstFile ? gstFile.name : '-',
      msmeFileName: msmeFile ? msmeFile.name : '-'
    };

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

    if (panFile) formData.append('panFile', panFile);
    if (gstFile) formData.append('gstFile', gstFile);
    if (msmeFile) formData.append('msmeFile', msmeFile);

    try {
      const response = await fetch(API_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        accountForm.reset();
        if (sameAsBillingCheckbox) sameAsBillingCheckbox.checked = false;
        clearAllErrors();
        fetchAccounts();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      accounts.push(newAccount);
      saveData();
      renderTable();
      accountForm.reset();
      if (sameAsBillingCheckbox) sameAsBillingCheckbox.checked = false;
      clearAllErrors();
      alert("Database is not connected! Account temporarily saved to local storage.");
    }
  });

  // Render Table Body
  function renderTable(filter = '') {
    accountTableBody.innerHTML = '';

    const filteredAccounts = accounts.filter(acc =>
      acc.name && acc.name.toLowerCase().startsWith(filter.toLowerCase())
    );

    if (filteredAccounts.length === 0) {
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

  // Action Listeners
  accountTableBody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit-hook');
    const deleteBtn = e.target.closest('.btn-delete-hook');
    if (!editBtn && !deleteBtn) return;

    const row = e.target.closest('tr');
    const id = row.getAttribute('data-id');
    const index = accounts.findIndex(a => a.id.toString() === id.toString());

    if (deleteBtn) {
      if (confirm('Are you sure you want to delete this account?')) {
        try {
          const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
          if (response.ok) {
            alert("Account Deleted successfully!");
            fetchAccounts();
          }
        } catch (err) {
          accounts.splice(index, 1);
          saveData(); renderTable(searchInput ? searchInput.value : '');
          alert("Account deleted from local storage!");
        }
      }
    }

    if (editBtn) {
      const acc = accounts[index];
      if (!acc) return;

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

      if (editModal) editModal.show();
    }
  });

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
    formData.append('creditDays', document.getElementById('editCreditDays').value.trim());
    formData.append('creditLimitVal', document.getElementById('editCreditLimitVal').value.trim());
    formData.append('outAlert', document.getElementById('editOutAlert').value);
    formData.append('blockSales', document.getElementById('editBlockSales').value);

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'PUT', body: formData });
      if (response.ok) {
        alert("Account Master Updated successfully!");
        if (editModal) editModal.hide();
        fetchAccounts();
      }
    } catch (err) {
      if (index !== -1) {
        accounts[index] = {
          ...accounts[index],
          name: document.getElementById('editPrintName').value.trim(),
          group: document.getElementById('editAccGroup').value,
          opBal: document.getElementById('editOpBal').value.trim(),
          balType: document.getElementById('editBalType').value,
          creditLimit: document.getElementById('editCreditLimit').value.trim(),
          emailId: document.getElementById('editEmailId').value.trim(),
          mobileNo: document.getElementById('editMobileNo').value.trim(),
          whatsapp: document.getElementById('editWhatsapp').value.trim()
        };
        saveData(); renderTable(searchInput ? searchInput.value : '');
        if (editModal) editModal.hide();
        alert("Updated in local storage!");
      }
    }
  });

  document.getElementById('scrollListBtn')?.addEventListener('click', () => {
    document.getElementById('accountListCard').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('addAccountBtn')?.addEventListener('click', () => {
    document.getElementById('accountFormCard').scrollIntoView({ behavior: 'smooth' });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTable(searchInput.value);
    });
  }

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
          name: row['Party Name'] || row.Name || '',
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
        } catch (e) {
          // Saved locally below
        }

        accounts.push(newAccLocal);
      });

      saveData();
      renderTable();
      alert('Data Imported Successfully!');
      setTimeout(fetchAccounts, 2000);
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById('exportAccountBtn').addEventListener('click', () => {
    const wb = XLSX.utils.table_to_book(document.querySelector('.table-custom'), { sheet: "Accounts" });
    XLSX.writeFile(wb, 'Account_List.xlsx');
  });

});