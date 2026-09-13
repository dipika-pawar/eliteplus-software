document.addEventListener('DOMContentLoaded', () => {

  const API_URL = 'http://localhost:5000/api/company';

  // --- 1. Sidebar Toggle Mechanics ---
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    const toggleIcon = menuToggle.querySelector('i');
    menuToggle.addEventListener('click', (e) => {
      sidebar.classList.toggle('active-mobile');
      e.stopPropagation();
      toggleIcon.className = sidebar.classList.contains('active-mobile') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
  }

  // --- 2. File Input Labels Update System ---
  const fileInputs = document.querySelectorAll('.file-input-detector');
  fileInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const wrapper = e.target.closest('.upload-box-wrapper');
      const previewText = wrapper.querySelector('.text-preview');
      const errDiv = document.getElementById('err-' + input.id);
      
      if(errDiv) {
        errDiv.textContent = "";
        errDiv.style.display = "none";
      }
      wrapper.classList.remove('is-invalid-custom');

      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!allowedExtensions.exec(file.name)) {
          if(errDiv) {
            errDiv.textContent = "Only JPG, JPEG or PNG images are allowed.";
            errDiv.style.display = "block";
          }
          wrapper.classList.add('is-invalid-custom');
          input.value = '';
          previewText.textContent = input.id === 'logoFile' ? 'Upload Logo' : input.id === 'qrFile' ? 'Upload QR' : input.id === 'stampFile' ? 'Upload Stamp' : 'Upload Signature';
          previewText.classList.remove('fw-bold', 'text-primary');
          return;
        }

        if (file.size > maxSize) {
          if(errDiv) {
            errDiv.textContent = "File size must be less than 2MB.";
            errDiv.style.display = "block";
          }
          wrapper.classList.add('is-invalid-custom');
          input.value = '';
          previewText.textContent = input.id === 'logoFile' ? 'Upload Logo' : input.id === 'qrFile' ? 'Upload QR' : input.id === 'stampFile' ? 'Upload Stamp' : 'Upload Signature';
          previewText.classList.remove('fw-bold', 'text-primary');
          return;
        }

        previewText.textContent = file.name;
        previewText.classList.add('fw-bold', 'text-primary');
      } else {
        const originalText = input.id === 'logoFile' ? 'Upload Logo' : input.id === 'qrFile' ? 'Upload QR' : input.id === 'stampFile' ? 'Upload Stamp' : 'Upload Signature';
        previewText.textContent = originalText;
        previewText.classList.remove('fw-bold', 'text-primary');
      }
    });
  });

  // --- 3. Core Company Profile Engine (CRUD Operations) ---
  const companyForm = document.getElementById('companyProfileForm');
  const tableBody = document.getElementById('companyTableBody');
  const editRowIdInput = document.getElementById('editRowId');
  const tableSearchInput = document.getElementById('tableSearchInput');

  function setFieldError(fieldId, isError, message = "") {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById('err-' + fieldId);
    const isFileField = ['logoFile', 'qrFile', 'stampFile', 'signFile'].includes(fieldId);
    const targetElement = isFileField ? document.getElementById('wrapper-' + fieldId) : field;

    if (isError) {
      targetElement.classList.add('is-invalid-custom');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
      }
    } else {
      targetElement.classList.remove('is-invalid-custom');
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
    }
  }

  async function fetchCompanies() {
    try {
      const response = await fetch(API_URL);
      const companies = await response.json();
      
      tableBody.innerHTML = ''; 

      if(companies.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="19" class="text-center text-muted py-4">No company profiles found. Create one above!</td></tr>`;
        return;
      }

      companies.forEach(company => {
        const badgeStyle = company.gst_status === "Active" ? "badge-active-status" : "badge-inactive-status";
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', company.id);
        
        // स्वल्पविराम ऐवजी '|' चा वापर करून बँक डिटेल मॅप करणे
        const formattedBankAccounts = company.bank_accounts ? company.bank_accounts.replaceAll(',', ' |') : '-';

        tr.innerHTML = `
          <td class="fw-semibold t-compName">${company.company_name}</td>
          <td class="t-printName">${company.print_name}</td>
          <td class="t-gstNumber">${company.gst_number}</td>
          <td><span class="${badgeStyle} t-gstStatus" data-status="${company.gst_status}">${company.gst_status}</span></td>
          <td class="t-panNumber">${company.pan_number}</td>
          <td class="t-cinNumber">${company.cin_number || '-'}</td>
          <td class="t-tanNumber">${company.tan_number || '-'}</td>
          <td class="t-udyamNumber">${company.udyam_number || '-'}</td>
          <td class="t-fyBeginning">${company.fy_beginning}</td>
          <td class="t-compEmail">${company.company_email}</td>
          <td class="t-compMobile">${company.company_mobile}</td>
          <td class="t-compWebsite">${company.company_website || '-'}</td>
          <td class="t-bankAccounts" title="${formattedBankAccounts}">${formattedBankAccounts}</td>
          <td class="t-regAddress" title="${company.registered_address}">${company.registered_address}</td>
          <td class="t-logoFile"><span class="table-file-badge" title="${company.logo_file}">${company.logo_file}</span></td>
          <td class="t-qrFile"><span class="table-file-badge" title="${company.qr_file}">${company.qr_file}</span></td>
          <td class="t-stampFile"><span class="table-file-badge" title="${company.stamp_file}">${company.stamp_file}</span></td>
          <td class="t-signFile"><span class="table-file-badge" title="${company.signature_file}">${company.signature_file}</span></td>
          <td class="text-end action-column">
            <button class="btn btn-table-edit btn-edit-trigger"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            <button class="btn btn-table-delete btn-delete-trigger"><i class="fa-solid fa-trash-can"></i> Delete</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }

  fetchCompanies();

  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', () => {
      const filterValue = tableSearchInput.value.trim().toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const compNameTd = row.querySelector('.t-compName');
        if (compNameTd) {
          const compNameText = compNameTd.innerText.trim().toLowerCase();
          row.style.display = (filterValue === "" || compNameText.startsWith(filterValue)) ? "" : "none";
        }
      });
    });
  }

  const btnAddNewCompany = document.getElementById('btnAddNewCompany');
  if (btnAddNewCompany) {
    btnAddNewCompany.addEventListener('click', () => {
      companyForm.reset();
      editRowIdInput.value = '';
      const customControls = companyForm.querySelectorAll('.form-control-custom, .upload-box-wrapper');
      customControls.forEach(ctrl => ctrl.classList.remove('is-invalid-custom'));
      document.querySelectorAll('.error-feedback').forEach(err => { err.textContent = ''; err.style.display = 'none'; });
      document.querySelectorAll('.text-preview').forEach(p => {
        p.textContent = p.textContent.includes('Logo') ? 'Upload Logo' : p.textContent.includes('QR') ? 'Upload QR' : p.textContent.includes('Stamp') ? 'Upload Stamp' : 'Upload Signature';
        p.classList.remove('fw-bold', 'text-primary');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  companyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const compName = document.getElementById('compName').value.trim();
    const printName = document.getElementById('printName').value.trim();
    const gstNumber = document.getElementById('gstNumber').value.trim().toUpperCase();
    const gstStatus = document.getElementById('gstStatus').value;
    const panNumber = document.getElementById('panNumber').value.trim().toUpperCase();
    const cinNumber = document.getElementById('cinNumber').value.trim().toUpperCase();
    const tanNumber = document.getElementById('tanNumber').value.trim().toUpperCase();
    const udyamNumber = document.getElementById('udyamNumber').value.trim().toUpperCase();
    const fyBeginning = document.getElementById('fyBeginning').value.trim();
    const compEmail = document.getElementById('compEmail').value.trim();
    const compMobile = document.getElementById('compMobile').value.trim();
    const compWebsite = document.getElementById('compWebsite').value.trim();
    
    // युझरने कॉमा टाकल्यास तो डेटा '|' ने सेपरेट होईल
    let bankAccounts = document.getElementById('bankAccounts').value.trim();
    bankAccounts = bankAccounts.replaceAll(',', ' |');

    const regAddress = document.getElementById('regAddress').value.trim();

    const isEditMode = editRowIdInput.value !== '';
    const logoInput = document.getElementById('logoFile');
    const qrInput = document.getElementById('qrFile');
    const stampInput = document.getElementById('stampFile');
    const signInput = document.getElementById('signFile');

    let isValidForm = true;
    let firstErrorElementId = null;

    function markInvalid(fieldId, message) {
      isValidForm = false;
      setFieldError(fieldId, true, message);
      if (!firstErrorElementId) firstErrorElementId = fieldId;
    }

    if (compName === "") markInvalid('compName', "Company Name is required."); else setFieldError('compName', false);
    if (printName === "") markInvalid('printName', "Print Name is required."); else setFieldError('printName', false);
    
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstNumber === "") markInvalid('gstNumber', "GST Number is required.");
    else if (!gstRegex.test(gstNumber)) markInvalid('gstNumber', "Invalid GST format.");
    else setFieldError('gstNumber', false);

    if (gstStatus === "") markInvalid('gstStatus', "GST Status is required."); else setFieldError('gstStatus', false);

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panNumber === "") markInvalid('panNumber', "PAN Number is required.");
    else if (!panRegex.test(panNumber)) markInvalid('panNumber', "Invalid PAN format.");
    else setFieldError('panNumber', false);

    if (fyBeginning === "") markInvalid('fyBeginning', "Financial Year is required."); else setFieldError('fyBeginning', false);
    if (compEmail === "") markInvalid('compEmail', "Email is required."); else setFieldError('compEmail', false);
    if (compMobile === "") markInvalid('compMobile', "Mobile is required."); else setFieldError('compMobile', false);
    if (regAddress === "") markInvalid('regAddress', "Address is required."); else setFieldError('regAddress', false);

    if (!isEditMode && logoInput.files.length === 0) markInvalid('logoFile', "Logo required."); else setFieldError('logoFile', false);
    if (!isEditMode && qrInput.files.length === 0) markInvalid('qrFile', "QR Code required."); else setFieldError('qrFile', false);
    if (!isEditMode && stampInput.files.length === 0) markInvalid('stampFile', "Stamp required."); else setFieldError('stampFile', false);
    if (!isEditMode && signInput.files.length === 0) markInvalid('signFile', "Signature required."); else setFieldError('signFile', false);

    if (!isValidForm) {
      if (firstErrorElementId) {
        const errElem = document.getElementById(firstErrorElementId);
        if(errElem) {
          errElem.focus();
          const scrollTarget = ['logoFile', 'qrFile', 'stampFile', 'signFile'].includes(firstErrorElementId) ? document.getElementById('wrapper-' + firstErrorElementId) : errElem;
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const formData = new FormData();
    formData.append('compName', compName);
    formData.append('printName', printName);
    formData.append('gstNumber', gstNumber);
    formData.append('gstStatus', gstStatus);
    formData.append('panNumber', panNumber);
    formData.append('cinNumber', cinNumber);
    formData.append('tanNumber', tanNumber);
    formData.append('udyamNumber', udyamNumber);
    formData.append('fyBeginning', fyBeginning);
    formData.append('compEmail', compEmail);
    formData.append('compMobile', compMobile);
    formData.append('compWebsite', compWebsite);
    formData.append('bankAccounts', bankAccounts);
    formData.append('regAddress', regAddress);

    if(logoInput.files[0]) formData.append('logoFile', logoInput.files[0]);
    if(qrInput.files[0]) formData.append('qrFile', qrInput.files[0]);
    if(stampInput.files[0]) formData.append('stampFile', stampInput.files[0]);
    if(signInput.files[0]) formData.append('signFile', signInput.files[0]);

    try {
      const targetRowId = editRowIdInput.value;
      let response;
      const submitBtn = document.getElementById('btnSaveCompany');
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      submitBtn.disabled = true;

      if (isEditMode) {
        response = await fetch(`${API_URL}/${targetRowId}`, { method: 'PUT', body: formData });
      } else {
        response = await fetch(API_URL, { method: 'POST', body: formData });
      }

      const result = await response.json();
      
      if (response.ok) {
        alert(result.message || "Saved successfully!");
        companyForm.reset();
        editRowIdInput.value = '';
        document.querySelectorAll('.text-preview').forEach(p => {
          p.textContent = p.textContent.includes('Logo') ? 'Upload Logo' : p.textContent.includes('QR') ? 'Upload QR' : p.textContent.includes('Stamp') ? 'Upload Stamp' : 'Upload Signature';
          p.classList.remove('fw-bold', 'text-primary');
        });
        fetchCompanies();
      } else {
        alert("Error: " + result.message);
      }

      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i> Save Company Profile';
      submitBtn.disabled = false;

    } catch (error) {
      console.error("API Error:", error);
      alert("Network Error!");
    }
  });

  tableBody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-edit-trigger');
    const deleteBtn = e.target.closest('.btn-delete-trigger');

    if (editBtn) {
      const row = editBtn.closest('tr');
      const customControls = companyForm.querySelectorAll('.form-control-custom, .upload-box-wrapper');
      customControls.forEach(ctrl => ctrl.classList.remove('is-invalid-custom'));
      document.querySelectorAll('.error-feedback').forEach(err => { err.textContent = ''; err.style.display = 'none'; });

      editRowIdInput.value = row.getAttribute('data-id');
      
      document.getElementById('compName').value = row.querySelector('.t-compName').innerText;
      document.getElementById('printName').value = row.querySelector('.t-printName').innerText;
      document.getElementById('gstNumber').value = row.querySelector('.t-gstNumber').innerText;
      document.getElementById('gstStatus').value = row.querySelector('.t-gstStatus').getAttribute('data-status');
      document.getElementById('panNumber').value = row.querySelector('.t-panNumber').innerText;
      
      const cinVal = row.querySelector('.t-cinNumber').innerText;
      document.getElementById('cinNumber').value = cinVal === '-' ? '' : cinVal;
      const tanVal = row.querySelector('.t-tanNumber').innerText;
      document.getElementById('tanNumber').value = tanVal === '-' ? '' : tanVal;
      const udyamVal = row.querySelector('.t-udyamNumber').innerText;
      document.getElementById('udyamNumber').value = udyamVal === '-' ? '' : udyamVal;
      
      document.getElementById('fyBeginning').value = row.querySelector('.t-fyBeginning').innerText;
      document.getElementById('compEmail').value = row.querySelector('.t-compEmail').innerText;
      document.getElementById('compMobile').value = row.querySelector('.t-compMobile').innerText;
      
      const webVal = row.querySelector('.t-compWebsite').innerText;
      document.getElementById('compWebsite').value = webVal === '-' ? '' : webVal;
      
      // एडिट करताना कॉमा असला तरी '|' ने रिप्लेस करणे
      const bankVal = row.querySelector('.t-bankAccounts').getAttribute('title');
      document.getElementById('bankAccounts').value = bankVal === '-' ? '' : bankVal.replaceAll(',', ' |');
      
      document.getElementById('regAddress').value = row.querySelector('.t-regAddress').getAttribute('title');

      const currentLogo = row.querySelector('.t-logoFile span').getAttribute('title');
      const currentQr = row.querySelector('.t-qrFile span').getAttribute('title');
      const currentStamp = row.querySelector('.t-stampFile span').getAttribute('title');
      const currentSign = row.querySelector('.t-signFile span').getAttribute('title');

      if(currentLogo && currentLogo !== "-") {
        const p = document.getElementById('wrapper-logoFile').querySelector('.text-preview');
        p.textContent = currentLogo; p.classList.add('fw-bold', 'text-primary');
      }
      if(currentQr && currentQr !== "-") {
        const p = document.getElementById('wrapper-qrFile').querySelector('.text-preview');
        p.textContent = currentQr; p.classList.add('fw-bold', 'text-primary');
      }
      if(currentStamp && currentStamp !== "-") {
        const p = document.getElementById('wrapper-stampFile').querySelector('.text-preview');
        p.textContent = currentStamp; p.classList.add('fw-bold', 'text-primary');
      }
      if(currentSign && currentSign !== "-") {
        const p = document.getElementById('wrapper-signFile').querySelector('.text-preview');
        p.textContent = currentSign; p.classList.add('fw-bold', 'text-primary');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } 
    else if (deleteBtn) {
      if (confirm('Are you sure?')) {
        const row = deleteBtn.closest('tr');
        const dbId = row.getAttribute('data-id');
        try {
          const response = await fetch(`${API_URL}/${dbId}`, { method: 'DELETE' });
          if(response.ok) { alert("Deleted successfully!"); fetchCompanies(); }
        } catch(error) { alert("Error deleting record"); }
      }
    }
  });

  // --- 4. ENTER KEY NAVIGATION SYSTEM ---
  const formFields = [
    { id: 'compName', type: 'input' }, { id: 'printName', type: 'input' },
    { id: 'gstNumber', type: 'input' }, { id: 'gstStatus', type: 'dropdown' },
    { id: 'panNumber', type: 'input' }, { id: 'cinNumber', type: 'input' },
    { id: 'tanNumber', type: 'input' }, { id: 'udyamNumber', type: 'input' },
    { id: 'fyBeginning', type: 'input' }, { id: 'compEmail', type: 'input' },
    { id: 'compMobile', type: 'input' }, { id: 'compWebsite', type: 'input' },
    { id: 'bankAccounts', type: 'input' }, { id: 'regAddress', type: 'input' },
    { id: 'wrapper-logoFile', fileId: 'logoFile', type: 'file' },
    { id: 'wrapper-qrFile', fileId: 'qrFile', type: 'file' },
    { id: 'wrapper-stampFile', fileId: 'stampFile', type: 'file' },
    { id: 'wrapper-signFile', fileId: 'signFile', type: 'file' }
  ];

  formFields.forEach((fieldObj, index) => {
    const element = document.getElementById(fieldObj.id);
    if (element) {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (fieldObj.id === 'gstStatus' && element.dataset.isOpened === 'true') {
            element.size = 1; element.dataset.isOpened = 'false'; element.style.position = ""; element.style.zIndex = "";
            const nextElement = document.getElementById(formFields[index + 1]?.id);
            if (nextElement) { e.preventDefault(); nextElement.focus(); nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            return;
          }
          if (fieldObj.type === 'file') {
            e.preventDefault();
            const actualFileInput = document.getElementById(fieldObj.fileId);
            if (actualFileInput) {
              actualFileInput.click();
              const handleNextFocus = () => {
                const nextElement = document.getElementById(formFields[index + 1]?.id);
                if (nextElement) { nextElement.focus(); nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); } 
                else document.getElementById('btnSaveCompany').focus();
                actualFileInput.removeEventListener('change', handleNextFocus);
                window.removeEventListener('focus', handleCancelFocus);
              };
              actualFileInput.addEventListener('change', handleNextFocus);
              const handleCancelFocus = () => setTimeout(() => handleNextFocus(), 300);
              window.addEventListener('focus', handleCancelFocus, { once: true });
            }
            return;
          }
          e.preventDefault(); 
          const nextObj = formFields[index + 1];
          if (nextObj) {
            const nextElement = document.getElementById(nextObj.id);
            if (nextElement) {
              nextElement.focus(); nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (nextObj.id === 'gstStatus') {
                if (typeof nextElement.showPicker === 'function') { nextElement.showPicker(); } 
                else { nextElement.size = nextElement.options.length; nextElement.dataset.isOpened = 'true'; nextElement.style.position = "relative"; nextElement.style.zIndex = "1050"; }
              }
            }
          } else {
            document.getElementById('btnSaveCompany').click();
          }
        }
      });
    }
  });

  const gstStatusDropdown = document.getElementById('gstStatus');
  if (gstStatusDropdown) {
    gstStatusDropdown.addEventListener('change', () => {
      gstStatusDropdown.size = 1; gstStatusDropdown.dataset.isOpened = 'false'; gstStatusDropdown.style.position = ""; gstStatusDropdown.style.zIndex = "";
    });
    gstStatusDropdown.addEventListener('blur', () => {
      gstStatusDropdown.size = 1; gstStatusDropdown.dataset.isOpened = 'false'; gstStatusDropdown.style.position = ""; gstStatusDropdown.style.zIndex = "";
    });
  }

});