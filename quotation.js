/**
 * ElitePlus ERP Voucher Calculation & Print Synchronization Engine
 * Full Stack System Integration Matrix - Quotation & Dynamic Catalog Print Pipeline
 */

document.addEventListener("DOMContentLoaded", () => {
  
  // API Endpoints Mappings
  const API_URL = 'http://localhost:5000/api/quotation';
  const ACCOUNT_API = 'http://localhost:5000/api/account';
  const ITEM_API = 'http://localhost:5000/api/item';
  const COMPANY_API = 'http://localhost:5000/api/company';

  // State Management Systems
  let voucherDatabase = [];
  let currentItemsList = [];
  let lastSavedItemsSnapshot = []; 
  let systemItemsMasterList = [];
  let systemCompanyProfile = null;

  // Mobile Sidebar Toggle Mechanism
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", (e) => {
      sidebar.classList.toggle("open");
      e.stopPropagation();
    });
  }

  // System Current Date Initialization (DD-MM-YYYY Layout)
  const dateField = document.getElementById("qDate");
  function initializeCurrentDate() {
    if (dateField) {
      const today = new Date();
      const yyyy = today.getFullYear();
      let mm = today.getMonth() + 1;
      let dd = today.getDate();
      if (dd < 10) dd = "0" + dd;
      if (mm < 10) mm = "0" + mm;
      dateField.value = `${dd}-${mm}-${yyyy}`;
    }
  }
  initializeCurrentDate();

  // --- 1. PARTY SEARCH AUTOCOMPLETE (ACCOUNT MASTER LINK) ---
  const partyInput = document.getElementById("qParty");
  const suggestionsBox = document.getElementById("partySuggestionsList");
  let currentFocusIndex = -1;

  if (partyInput && suggestionsBox) {
    partyInput.addEventListener("input", async () => {
      const inputValue = partyInput.value.trim().toLowerCase();
      suggestionsBox.innerHTML = "";
      currentFocusIndex = -1;

      if (inputValue.length === 0) {
        suggestionsBox.style.display = "none";
        return;
      }

      try {
        const response = await fetch(ACCOUNT_API);
        const accounts = await response.json();
        
        const filtered = accounts.filter(acc => 
          acc.print_name.toLowerCase().includes(inputValue)
        );

        if (filtered.length > 0) {
          filtered.forEach((partyObj) => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = partyObj.print_name;

            div.addEventListener("click", () => {
              partyInput.value = partyObj.print_name;
              suggestionsBox.style.display = "none";
              
              // Meta Data Binding for PDF Print Engine
              partyInput.dataset.location = partyObj.billing_address || partyObj.shipping_address || 'Pune, Maharashtra';
              partyInput.dataset.mobile = partyObj.mobile_no || 'N/A';
              partyInput.dataset.email = partyObj.email_id || 'N/A';
              partyInput.dataset.gst = partyObj.gstin_no || 'Unregistered';
              partyInput.dataset.sub = partyObj.account_group || 'Sundry Debtors Division';

              const nextField = document.getElementById("qMatCentre");
              if (nextField) nextField.focus();
            });
            suggestionsBox.appendChild(div);
          });
          suggestionsBox.style.display = "block";
        } else {
          suggestionsBox.style.display = "none";
        }
      } catch (err) {
        console.error("Autocomplete master pipeline error:", err);
      }
    });

    partyInput.addEventListener("keydown", (e) => {
      const items = suggestionsBox.getElementsByClassName("suggestion-item");
      if (suggestionsBox.style.display === "block" && items.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          currentFocusIndex++;
          if (currentFocusIndex >= items.length) currentFocusIndex = 0;
          updateActiveSuggestion(items);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          currentFocusIndex--;
          if (currentFocusIndex < 0) currentFocusIndex = items.length - 1;
          updateActiveSuggestion(items);
        } else if (e.key === "Enter" || e.key === "Tab") {
          if (currentFocusIndex > -1 && items[currentFocusIndex]) {
            e.preventDefault();
            items[currentFocusIndex].click();
          }
        }
      }
    });

    function updateActiveSuggestion(items) {
      Array.from(items).forEach((item, idx) => {
        if (idx === currentFocusIndex) {
          item.classList.add("selected");
          item.style.backgroundColor = "#f1f5f9";
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("selected");
          item.style.backgroundColor = "";
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target !== partyInput && e.target !== suggestionsBox) {
        suggestionsBox.style.display = "none";
      }
    });
  }

  // --- 2. LIVE ITEMS DATA LINK IN POPUP MODAL ---
  async function fetchItemMasterData() {
    try {
      const response = await fetch(ITEM_API);
      systemItemsMasterList = await response.json();
      
      const itemNameInp = document.getElementById("modalItemName");
      if(itemNameInp) {
         let dataList = document.getElementById("modalItemsDatalist");
         if(!dataList){
            dataList = document.createElement("datalist");
            dataList.id = "modalItemsDatalist";
            itemNameInp.parentNode.appendChild(dataList);
         }
         itemNameInp.setAttribute("list", "modalItemsDatalist");
         dataList.innerHTML = "";
         
         systemItemsMasterList.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.item_name;
            dataList.appendChild(opt);
         });

         itemNameInp.addEventListener("change", () => {
            const matchedItem = systemItemsMasterList.find(x => x.item_name === itemNameInp.value);
            if(matchedItem) {
                document.getElementById("modalItemUnit").value = matchedItem.unit;
                document.getElementById("modalItemPrice").value = matchedItem.sales_price;
                itemNameInp.dataset.hsn = matchedItem.hsn_sac_code;
                itemNameInp.dataset.brand = matchedItem.brand || '-';
                itemNameInp.dataset.code = matchedItem.item_code || '-';
                itemNameInp.dataset.image = matchedItem.image_path || '';
                itemNameInp.dataset.spec = matchedItem.item_specification || '';
                itemNameInp.dataset.taxRate = matchedItem.tax_category ? (matchedItem.tax_category.match(/\d+/)?.[0] || 18) : 18;
            }
         });
      }
    } catch (err) {
      console.error("Item Master link failed:", err);
    }
  }

  // --- 3. COMPANY MASTER DYNAMIC Letterhead, Logo, Scanner, Stamp & Signature Binding ---
  async function fetchActiveCompanyProfile() {
    try {
      const response = await fetch(COMPANY_API);
      const data = await response.json();
      if(data && data.length > 0) {
         systemCompanyProfile = data[0]; 
         
         const logoImages = document.querySelectorAll(".pdf-header-logo");
         logoImages.forEach(logoImg => {
            if(systemCompanyProfile.logo_file) {
               logoImg.src = `http://localhost:5000/uploads/${systemCompanyProfile.logo_file}`;
            }
         });
         
         const qrImages = document.querySelectorAll(".pdf-scanner-img");
         qrImages.forEach(img => {
            if(systemCompanyProfile.qr_file) {
               img.src = `http://localhost:5000/uploads/${systemCompanyProfile.qr_file}`;
            }
         });

         const signImg = document.querySelector(".pdf-signature-real-img");
         if(signImg && systemCompanyProfile.signature_file) {
            signImg.src = `http://localhost:5000/uploads/${systemCompanyProfile.signature_file}`;
         }

         const stampImg = document.querySelector(".pdf-stamp-real-img");
         if(stampImg && systemCompanyProfile.stamp_file) {
            stampImg.src = `http://localhost:5000/uploads/${systemCompanyProfile.stamp_file}`; 
         } else if (stampImg && systemCompanyProfile.logo_file) {
            stampImg.src = `http://localhost:5000/uploads/${systemCompanyProfile.logo_file}`; 
         }

         const companyTitleHeader = document.querySelector(".signature-stamp-frame .fw-bold");
         if(companyTitleHeader) {
            companyTitleHeader.textContent = `for ${systemCompanyProfile.company_name}`;
         }

         const addressDivs = document.querySelectorAll(".legal-address-column .opacity-90");
         addressDivs.forEach(div => {
            div.innerHTML = `<i class="fa-solid fa-location-dot me-1 text-info"></i> ${systemCompanyProfile.registered_address}`;
         });

         const contactDivs = document.querySelectorAll(".legal-address-column .fw-medium");
         contactDivs.forEach(div => {
            div.innerHTML = `
               <i class="fa-solid fa-phone me-1 text-info"></i> ${systemCompanyProfile.company_mobile}
               <span class="mx-1">|</span>
               <i class="fa-solid fa-envelope me-1 text-info"></i> ${systemCompanyProfile.company_email}
               <span class="mx-1">|</span>
               <i class="fa-solid fa-globe me-1 text-info"></i> ${systemCompanyProfile.company_website || '-'}
            `;
         });
         
         const bankBlock = document.querySelector(".pdf-bank-details-plain .font-monospace");
         if(bankBlock && systemCompanyProfile.bank_accounts) {
             bankBlock.innerHTML = `<div class="text-dark fw-semibold" style="font-size:11px">${systemCompanyProfile.bank_accounts}</div>`;
         }
      }
    } catch (err) {
       console.error("Company Profile loading fault:", err);
    }
  }

  // Key down layout bindings
  const interactiveFormFields = ["qSeries", "qVchNo", "qSaleType", "qParty", "qMatCentre", "qNarration"];
  interactiveFormFields.forEach((id, currentIndex) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "Tab") {
        if (id === "qParty" && suggestionsBox && suggestionsBox.style.display === "block") return;
        event.preventDefault(); 
        const nextIndex = currentIndex + 1;
        if (nextIndex < interactiveFormFields.length) {
          const nextField = document.getElementById(interactiveFormFields[nextIndex]);
          if (nextField) { nextField.focus(); nextField.select(); }
        } else {
          document.getElementById("openAddModalBtn")?.focus();
        }
      }
    });
  });

  const modalFields = ["modalItemName", "modalItemQty", "modalItemUnit", "modalItemPrice"];
  modalFields.forEach((id, currentIndex) => {
    const modalElement = document.getElementById(id);
    if (!modalElement) return;
    modalElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); 
        const nextModalIndex = currentIndex + 1;
        if (nextModalIndex < modalFields.length) {
          const nextModalField = document.getElementById(modalFields[nextModalIndex]);
          if (nextModalField) { nextModalField.focus(); nextModalField.select(); }
        } else {
          document.getElementById("modalItemForm")?.requestSubmit();
        }
      }
    });
  });

  // DOM Caching Elements Setup
  const itemTableBody = document.getElementById("itemTableBody");
  const voucherMasterTableBody = document.getElementById("voucherMasterTableBody");
  const modalItemForm = document.getElementById("modalItemForm");
  const modalEditIndex = document.getElementById("modalEditIndex");
  const modalFormMode = document.getElementById("modalFormMode");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");
  const manualDiscountInput = document.getElementById("manualDiscountPercentage");
  const manualDiscountAmountDisplay = document.getElementById("manualDiscountAmountDisplay");
  const grandTotalDisplay = document.getElementById("grandTotalDisplay");

  const bootstrapItemModal = new bootstrap.Modal(document.getElementById("addItemModal"));
  const printPreviewModal = new bootstrap.Modal(document.getElementById("printPreviewModal"));
  const catalogPreviewModal = new bootstrap.Modal(document.getElementById("catalogPreviewModal"));

  // --- 4. BACKEND INTEGRATION: READ DIRECTORY (GET) ---
  async function fetchSavedVouchers() {
     try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if(result.status === 'Success') {
           voucherDatabase = result.data.map(vch => ({
               id: vch.id,
               series: vch.series,
               date: formatDateToLocal(vch.quotation_date),
               vchNo: vch.voucher_no,
               saleType: vch.sale_type,
               partyName: vch.party_name,
               matCentre: vch.material_centre,
               narration: vch.narration,
               discountPercent: vch.discount_percentage,
               subtotal: vch.subtotal,
               taxableAmount: vch.taxable_amount,
               gstTotal: vch.gst_total,
               discountAmount: vch.discount_amount,
               roundOff: vch.round_off,
               grandTotal: vch.grand_total,
               amountInWords: vch.amount_in_words,
               items: []
           }));
           renderVoucherMasterDirectory();
        }
     } catch (err) {
        console.error("Voucher Directory loading failed:", err);
     }
  }

  function formatDateToLocal(isoStr) {
     const d = new Date(isoStr);
     let dd = d.getDate();
     let mm = d.getMonth() + 1;
     if(dd < 10) dd = '0' + dd;
     if(mm < 10) mm = '0' + mm;
     return `${dd}-${mm}-${d.getFullYear()}`;
  }

  // --- 5. CORE ARITHMETIC METRICS CALCULATOR ENGINE ---
  function computeItemTaxParameters(item) {
    const gstRate = parseFloat(item.gstRate) || 18;
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    const itemDiscount = parseFloat(item.discountValue) || 0;

    const grossAmount = qty * price;
    const taxable = Math.max(0, grossAmount - itemDiscount);
    const taxAmt = (taxable * gstRate) / 100;
    const lineTotal = taxable + taxAmt;

    return { rate: gstRate, taxableAmount: taxable, taxAmount: taxAmt, aggregate: lineTotal };
  }

  window.calculateQuotationTotals = () => {
    let itemsSubTotal = 0;
    let totalTaxAmount = 0;
    let taxRegistry = { 18: { taxable: 0, tax: 0 }, 5: { taxable: 0, tax: 0 }, 12: { taxable: 0, tax: 0 }, 28: { taxable: 0, tax: 0 } };

    let activeList = currentItemsList.length > 0 ? currentItemsList : lastSavedItemsSnapshot;

    activeList.forEach((item) => {
      let cal = computeItemTaxParameters(item);
      item.taxableAmount = cal.taxableAmount;
      item.taxAmount = cal.taxAmount;
      item.aggregate = cal.aggregate;

      itemsSubTotal += cal.taxableAmount;
      totalTaxAmount += cal.taxAmount;

      if (!taxRegistry[cal.rate]) taxRegistry[cal.rate] = { taxable: 0, tax: 0 };
      taxRegistry[cal.rate].taxable += cal.taxableAmount;
      taxRegistry[cal.rate].tax += cal.taxAmount;
    });

    ['18', '5'].forEach(rate => {
       if(document.getElementById(`taxableAmt${rate}`)) document.getElementById(`taxableAmt${rate}`).textContent = taxRegistry[rate].taxable.toFixed(2);
       if(document.getElementById(`taxAmt${rate}`)) document.getElementById(`taxAmt${rate}`).textContent = taxRegistry[rate].tax.toFixed(2);
       if(document.getElementById(`sundryAmt${rate}`)) document.getElementById(`sundryAmt${rate}`).textContent = taxRegistry[rate].tax.toFixed(2);
    });

    if (document.getElementById("totalTaxableAmtDisplay")) document.getElementById("totalTaxableAmtDisplay").textContent = itemsSubTotal.toFixed(2);
    if (document.getElementById("totalTaxAmtDisplay")) document.getElementById("totalTaxAmtDisplay").textContent = totalTaxAmount.toFixed(2);

    let discountPercent = parseFloat(manualDiscountInput.value) || 0;
    let discountAmount = (itemsSubTotal * discountPercent) / 100;
    let preRound = itemsSubTotal + totalTaxAmount - discountAmount;
    let finalTotal = Math.round(preRound);
    let variance = finalTotal - preRound;

    if (manualDiscountAmountDisplay) manualDiscountAmountDisplay.textContent = "-" + discountAmount.toFixed(2);
    if (grandTotalDisplay) grandTotalDisplay.textContent = finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    return { subtotal: itemsSubTotal, taxableAmount: itemsSubTotal, gstTotal: totalTaxAmount, discountAmount: discountAmount, roundOff: variance, grandTotal: finalTotal };
  };

  window.renderItemsTable = () => {
    if (!itemTableBody) return;
    itemTableBody.innerHTML = "";
    
    currentItemsList.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="text-start fw-semibold text-dark">${item.name}</td>
        <td>${parseFloat(item.qty).toFixed(2)}</td>
        <td>${item.unit}</td>
        <td>${parseFloat(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td class="fw-bold">${(item.qty * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td>
            <button type="button" class="btn-row-edit" onclick="editItemRow(${index})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button type="button" class="btn-row-delete" onclick="deleteItemRow(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
        </td>
      `;
      itemTableBody.appendChild(tr);
    });
    calculateQuotationTotals();
  };

  window.renderVoucherMasterDirectory = (term = "") => {
    if (!voucherMasterTableBody) return;
    voucherMasterTableBody.innerHTML = "";
    let filtered = voucherDatabase.filter(v => v.vchNo.toLowerCase().includes(term.toLowerCase()));

    if(filtered.length === 0) {
       voucherMasterTableBody.innerHTML = `<tr><td colspan="7" class="text-muted py-3">No matching quotation vouchers found.</td></tr>`;
       return;
    }
    filtered.forEach((vch, index) => {
      const originalIdx = voucherDatabase.indexOf(vch);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${index + 1}</b></td>
        <td class="text-danger fw-bold">${vch.vchNo}</td>
        <td>${vch.date}</td>
        <td class="text-start fw-semibold text-dark">${vch.partyName}</td>
        <td><span class="badge bg-light text-dark border">${vch.saleType}</span></td>
        <td class="fw-bold text-primary">₹${vch.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td>
            <button type="button" class="btn btn-sm btn-row-edit px-2" onclick="loadVoucherToForm(${vch.id}, ${originalIdx})"><i class="fa-solid fa-file-pen"></i> Edit</button>
            <button type="button" class="btn btn-sm btn-row-delete px-2" onclick="deleteVoucherRecord(${vch.id}, ${originalIdx})"><i class="fa-solid fa-trash-can"></i> Delete</button>
        </td>
      `;
      voucherMasterTableBody.appendChild(tr);
    });
  };

  // --- 6. CORE VOUCHER SAVE ENGINE (POST / PUT) ---
  document.getElementById("quotationForm").addEventListener("submit", async (e) => {
     e.preventDefault();
     const trackIndex = document.getElementById("qVoucherTrackIndex").value;
     
     if (currentItemsList.length === 0) return alert("Validation Error: Cannot save an empty grid.");
     
     const vchNo = document.getElementById("qVchNo").value.trim();
     const partyName = document.getElementById("qParty").value.trim();
     const metrics = calculateQuotationTotals();

     const payload = {
         id: trackIndex !== "" ? voucherDatabase[parseInt(trackIndex)].id : Date.now(),
         series: document.getElementById("qSeries").value.trim(),
         date: document.getElementById("qDate").value,
         voucherNo: vchNo,
         saleType: document.getElementById("qSaleType").value,
         partyName: partyName,
         matCentre: document.getElementById("qMatCentre").value.trim(),
         narration: document.getElementById("qNarration").value.trim(),
         discountPercent: parseFloat(manualDiscountInput.value) || 0,
         subtotal: metrics.subtotal,
         taxableAmount: metrics.taxableAmount,
         gstTotal: metrics.gstTotal,
         discountAmount: metrics.discountAmount,
         roundOff: metrics.roundOff,
         grandTotal: metrics.grandTotal,
         amountInWords: translateAmountIntoWords(metrics.grandTotal),
         items: currentItemsList
     };

     lastSavedItemsSnapshot = JSON.parse(JSON.stringify(currentItemsList));

     try {
         let response;
         if(trackIndex !== "") {
             response = await fetch(`${API_URL}/${payload.id}`, {
                 method: 'PUT',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(payload)
             });
         } else {
             response = await fetch(API_URL, {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(payload)
             });
         }
         
         const resData = await response.json();
         if(response.ok) {
             alert(resData.message);
             clearVoucherForm();
             fetchSavedVouchers();
         } else {
             alert("Error: " + resData.message);
         }
     } catch(err) {
         console.error(err);
         alert("Network Communication Failure!");
     }
  });

  window.loadVoucherToForm = async (dbId, localIdx) => {
     try {
         const response = await fetch(`${API_URL}/${dbId}`);
         const res = await response.json();
         if(response.ok) {
             const vch = res.quotation;
             const activePartyName = voucherDatabase[localIdx].partyName;

             document.getElementById("qVoucherTrackIndex").value = localIdx;
             document.getElementById("qSeries").value = vch.series;
             document.getElementById("qDate").value = formatDateToLocal(vch.quotation_date);
             document.getElementById("qVchNo").value = vch.voucher_no;
             document.getElementById("qSaleType").value = vch.sale_type;
             document.getElementById("qParty").value = activePartyName;
             document.getElementById("qMatCentre").value = vch.material_centre;
             document.getElementById("qNarration").value = vch.narration || '';
             document.getElementById("manualDiscountPercentage").value = parseFloat(vch.discount_percentage).toFixed(2);

             // अकाऊंट्स कीज मॅपिंग सिंक
             try {
                const accRes = await fetch(ACCOUNT_API);
                const accounts = await accRes.json();
                const matchedAccount = accounts.find(a => a.print_name === activePartyName);
                if (matchedAccount) {
                   partyInput.dataset.location = matchedAccount.billing_address || matchedAccount.shipping_address || 'Pune, Maharashtra';
                   partyInput.dataset.mobile = matchedAccount.mobile_no || 'N/A';
                   partyInput.dataset.email = matchedAccount.email_id || 'N/A';
                   partyInput.dataset.gst = matchedAccount.gstin_no || 'Unregistered';
                   partyInput.dataset.sub = matchedAccount.account_group || 'Sundry Debtors Division';
                }
             } catch (accErr) {
                console.error("Account background injection fault:", accErr);
             }

             currentItemsList = res.items.map(item => ({
                 name: item.item_name,
                 qty: parseFloat(item.qty),
                 unit: item.unit,
                 price: parseFloat(item.price),
                 gstRate: parseFloat(item.tax_rate),
                 hsn: item.hsn_sac_code || '',
                 brand: item.brand || '-',
                 code: item.item_code || '-',
                 image: item.image_path || '',
                 spec: item.item_specification || '',
                 taxableAmount: parseFloat(item.taxable_amount),
                 taxAmount: parseFloat(item.tax_amount),
                 discountValue: 0
             }));

             lastSavedItemsSnapshot = JSON.parse(JSON.stringify(currentItemsList));

             document.getElementById("formVoucherHeaderTitle").innerHTML = `<i class="fa-solid fa-file-pen text-warning"></i> Editing Voucher: ${vch.voucher_no}`;
             document.getElementById("mainVoucherSaveBtn").innerHTML = `<i class="fa-solid fa-check-double"></i> Update Voucher`;
             
             renderItemsTable();
             document.getElementById("voucherFormCard").scrollIntoView({ behavior: "smooth" });
         }
     } catch (err) {
         console.error("Error loading single voucher details:", err);
     }
  };

  window.deleteVoucherRecord = async (dbId, localIdx) => {
      if(confirm("Are you sure you want to delete this voucher permanently?")) {
          try {
              const response = await fetch(`${API_URL}/${dbId}`, { method: 'DELETE' });
              if(response.ok) {
                  alert("Voucher deleted successfully!");
                  clearVoucherForm();
                  fetchSavedVouchers();
              }
          } catch(e) { console.error(e); }
      }
  };

  // --- 7. POPUP MODAL ITEMS STORAGE PIPELINE ---
  if (modalItemForm) {
    modalItemForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("modalItemName").value.trim();
      const qtyStr = document.getElementById("modalItemQty").value.trim();
      const unit = document.getElementById("modalItemUnit").value.trim();
      const priceStr = document.getElementById("modalItemPrice").value.trim();
      const editIndexValue = modalEditIndex.value;

      if (!name || !qtyStr || !unit || !priceStr) return alert("Validation Error: All inputs are mandatory.");
      const qty = parseFloat(qtyStr) || 0;
      const price = parseFloat(priceStr) || 0;
      if (qty <= 0 || price <= 0) return alert("Values must be positive greater than zero.");

      const targetInput = document.getElementById("modalItemName");
      const gstRate = parseFloat(targetInput.dataset.taxRate) || 18;
      const hsn = targetInput.dataset.hsn || "";
      const brand = targetInput.dataset.brand || "-";
      const code = targetInput.dataset.code || "-";
      const image = targetInput.dataset.image || "";
      const spec = targetInput.dataset.spec || "";

      const payload = { name, qty, unit, price, gstRate, hsn, brand, code, image, spec, discountValue: 0 };

      if (editIndexValue !== "") {
        currentItemsList[parseInt(editIndexValue)] = payload;
      } else {
        currentItemsList.push(payload);
      }
      
      lastSavedItemsSnapshot = JSON.parse(JSON.stringify(currentItemsList));
      renderItemsTable();
      bootstrapItemModal.hide();
    });
  }

  window.editItemRow = (i) => {
     const item = currentItemsList[i];
     document.getElementById("modalItemName").value = item.name;
     document.getElementById("modalItemQty").value = item.qty;
     document.getElementById("modalItemUnit").value = item.unit;
     document.getElementById("modalItemPrice").value = item.price;
     modalEditIndex.value = i;
     modalFormMode.textContent = "Edit";
     bootstrapItemModal.show();
  };

  window.deleteItemRow = (i) => { 
     if(confirm("Remove line item row?")) { 
        currentItemsList.splice(i,1); 
        lastSavedItemsSnapshot = JSON.parse(JSON.stringify(currentItemsList));
        renderItemsTable(); 
     } 
  };
  
  window.clearVoucherForm = () => {
    document.getElementById("quotationForm").reset();
    document.getElementById("qVoucherTrackIndex").value = "";
    document.getElementById("formVoucherHeaderTitle").innerHTML = `<i class="fa-solid fa-file-signature text-success"></i> Voucher Entry Panel`;
    document.getElementById("mainVoucherSaveBtn").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Voucher`;
    initializeCurrentDate();
    currentItemsList = [];
    renderItemsTable();
  };

  if(manualDiscountInput) {
     manualDiscountInput.addEventListener("input", () => calculateQuotationTotals());
  }

  const vchSearchBox = document.getElementById("vchSearchBox");
  if(vchSearchBox) vchSearchBox.addEventListener("input", (e)=> renderVoucherMasterDirectory(e.target.value));

  // --- 8. DYNAMIC PRINTING PREVIEW DATA SYNC MATRIX ---
  if (document.getElementById("btnPrintQuotation")) {
    document.getElementById("btnPrintQuotation").addEventListener("click", () => {
      
      let printList = currentItemsList.length > 0 ? currentItemsList : lastSavedItemsSnapshot;
      if (printList.length === 0) return alert("Validation Error: No dynamic item configurations available to print.");

      const partyInp = document.getElementById("qParty");
      
      if(!partyInp.value && lastSavedItemsSnapshot.length > 0) {
          const trackIdx = document.getElementById("qVoucherTrackIndex").value;
          if(trackIdx !== "" && voucherDatabase[trackIdx]) {
              partyInp.value = voucherDatabase[trackIdx].partyName;
          }
      }

      document.getElementById("pdfClientInstitution").textContent = partyInp.value || "The Principal";
      document.getElementById("pdfClientSubName").textContent = partyInp.dataset.sub || 'Sundry Debtors Division';
      document.getElementById("pdfClientLocation").textContent = partyInp.dataset.location || 'Pune, Maharashtra';
      document.getElementById("pdfClientMobile").textContent = partyInp.dataset.mobile || 'N/A';
      document.getElementById("pdfClientEmail").textContent = partyInp.dataset.email || 'N/A';
      document.getElementById("pdfClientGst").textContent = partyInp.dataset.gst || 'N/A';

      document.getElementById("pdfMetaDate").textContent = document.getElementById("qDate").value;
      document.getElementById("pdfMetaQtnNo").textContent = document.getElementById("qVchNo").value;

      const rowsTarget = document.getElementById("pdfItemRowsTarget");
      rowsTarget.innerHTML = "";

      printList.forEach((item, index) => {
          let cal = computeItemTaxParameters(item);
          let tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td class="text-start fw-bold text-dark">${item.name}</td>
            <td class="text-dark">${item.brand || '-'}</td>
            <td class="text-end font-monospace">${parseFloat(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td>${parseFloat(item.qty)}</td>
            <td>${item.unit}</td>
            <td>${cal.rate}%</td>
            <td class="text-end font-monospace">${cal.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="text-end font-monospace fw-bold">${cal.aggregate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          `;
          rowsTarget.appendChild(tr);
      });

      for (let i = printList.length; i < 15; i++) {
        let emptyTr = document.createElement("tr");
        emptyTr.className = "pdf-empty-row-tr";
        emptyTr.innerHTML = `<td>${i+1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>`;
        rowsTarget.appendChild(emptyTr);
      }

      const metrics = calculateQuotationTotals();
      document.getElementById("pdfAmountInWords").textContent = translateAmountIntoWords(metrics.grandTotal);
      printPreviewModal.show();
    });
  }

  // --- 9. DYNAMIC PRINT CATALOG GENERATOR PIPELINE ---
  if (document.getElementById("btnPrintCatalog")) {
    document.getElementById("btnPrintCatalog").addEventListener("click", () => {
      let catalogList = currentItemsList.length > 0 ? currentItemsList : lastSavedItemsSnapshot;
      if (catalogList.length === 0) return alert("Validation Error: No dynamic item configurations available to print catalog.");

      const catalogContainer = document.getElementById("catalogPrintTargetArea");
      if (!catalogContainer) return;

      catalogContainer.innerHTML = ""; // जुना स्टॅटिक डेटा क्लिअर करा

      catalogList.forEach((item, index) => {
        // आयटम मास्टरमधून अतिरिक्त तपशील (Code, Image, Specification) मॅच करा
        const matchedMaster = systemItemsMasterList.find(x => x.item_name.toLowerCase() === item.name.toLowerCase());
        
        const itemCode = matchedMaster?.item_code || item.code || 'N/A';
        const itemSpec = matchedMaster?.item_specification || item.spec || 'No specification available for this item.';
        
        let imageSrc = 'Images/advanced-practi-man-cpr-manikin-254.jpg'; // फॉलबॅक इमेज
        if (matchedMaster && matchedMaster.image_path) {
          imageSrc = matchedMaster.image_path.startsWith('http') || matchedMaster.image_path.startsWith('data:') 
                     ? matchedMaster.image_path 
                     : `http://localhost:5000${matchedMaster.image_path}`;
        } else if (item.image) {
          imageSrc = item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`;
        }

        const logoSrc = (systemCompanyProfile && systemCompanyProfile.logo_file) 
                          ? `http://localhost:5000/uploads/${systemCompanyProfile.logo_file}` 
                          : 'Images/Eliteplus-logo.png';
        
        const qrSrc = (systemCompanyProfile && systemCompanyProfile.qr_file) 
                        ? `http://localhost:5000/uploads/${systemCompanyProfile.qr_file}` 
                        : 'Images/scanner.png';

        const regAddress = systemCompanyProfile?.registered_address || 'Sr.No 175, Fl No #116, Shivane, Pune - 411023';
        const mobileNo = systemCompanyProfile?.company_mobile || '9890017812';
        const emailId = systemCompanyProfile?.company_email || 'elite.pune@gmail.com';
        const websiteUrl = systemCompanyProfile?.company_website || 'www.eliteplus.in';

        // प्रत्येक प्रॉडक्टसाठी स्वतंत्र A4 पेज लेआउट तयार करा
        const pageDiv = document.createElement("div");
        pageDiv.className = `catalog-page ${index > 0 ? 'catalog-page-break' : ''}`;
        
        pageDiv.innerHTML = `
          <div class="pdf-inner-border-wrapper">
            <div class="pdf-letterhead-container mb-2">
              <div class="logo-wrapper">
                <img src="${logoSrc}" alt="Company Logo" class="pdf-header-logo">
              </div>
            </div>

            <div class="catalog-product-row px-2 py-3">
              <h1 class="catalog-screenshot-title">${item.name}</h1>
              <div class="catalog-screenshot-code">Code: ${itemCode}</div>

              <div class="product-img-box-clean">
                <img src="${imageSrc}" alt="${item.name}" onerror="this.onerror=null; this.src='Images/advanced-practi-man-cpr-manikin-254.jpg';">
              </div>

              <p class="catalog-screenshot-desc mt-2">
                ${itemSpec}
              </p>
            </div>

            <div class="pdf-bottom-pinned-group mt-auto">
              <div class="pdf-corporate-footer-blue-bar text-white d-flex justify-content-between align-items-center">
                <div class="legal-address-column small text-start">
                  <div class="opacity-90 mb-1" style="max-width: 540px; color: #cbd5e1; font-size: 11px;">
                    <i class="fa-solid fa-location-dot me-1 text-info"></i> ${regAddress}
                  </div>
                  <div class="fw-medium font-monospace text-white-50" style="font-size: 10.5px;">
                    <i class="fa-solid fa-phone me-1 text-info"></i> ${mobileNo}
                    <span class="mx-1">|</span>
                    <i class="fa-solid fa-envelope me-1 text-info"></i> ${emailId}
                    <span class="mx-1">|</span>
                    <i class="fa-solid fa-globe me-1 text-info"></i> ${websiteUrl}
                  </div>
                </div>
                <div class="footer-right-side-qr-area bg-white p-1 rounded">
                  <div class="embedded-qr-placeholder-box-real mini-qr-box">
                    <img src="${qrSrc}" alt="Mini Scanner" class="pdf-scanner-img">
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        catalogContainer.appendChild(pageDiv);
      });

      catalogPreviewModal.show();
    });
  }

  function translateAmountIntoWords(amount) {
    let primaryValue = Math.floor(amount);
    let unitsList = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    let tensList = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function computeHundreds(num) {
      let out = "";
      if (num >= 100) { out += unitsList[Math.floor(num / 100)] + " Hundred "; num %= 100; }
      if (num >= 20) { out += tensList[Math.floor(num / 10)] + " "; num %= 10; }
      if (num > 0) { out += unitsList[num] + " "; }
      return out.trim();
    }
    let output = "";
    if (Math.floor(primaryValue / 100000) > 0) { output += computeHundreds(Math.floor(primaryValue / 100000)) + " Lakh "; primaryValue %= 100000; }
    if (Math.floor(primaryValue / 1000) > 0) { output += computeHundreds(Math.floor(primaryValue / 1000)) + " Thousand "; primaryValue %= 1000; }
    if (primaryValue > 0) output += computeHundreds(primaryValue);
    return (output.trim() + " Rupees Only");
  }

  document.getElementById("modalDownloadPdfBtn")?.addEventListener("click", () => {
      const el = document.getElementById("pdfPrintTargetArea");
      const cleanVch = document.getElementById("pdfMetaQtnNo").textContent.replace(/\//g, "-");
      html2pdf().set({ margin: 0, filename: `Quotation-${cleanVch}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "pt", format: "a4", orientation: "portrait" } }).from(el).save();
  });

  document.getElementById("modalDownloadCatalogBtn")?.addEventListener("click", () => {
      const catalogElement = document.getElementById("catalogPrintTargetArea");
      const catalogOptions = {
        margin: 0,
        filename: "Product-Catalog.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], before: ".catalog-page-break" }
      };
      html2pdf().set(catalogOptions).from(catalogElement).save();
  });

  document.getElementById("topVchDetailBtn")?.addEventListener("click", () => document.getElementById("voucherDirectoryCard").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("openAddModalBtn")?.addEventListener("click", () => bootstrapItemModal.show());
  document.getElementById("btnWhatsAppConfig")?.addEventListener("click", () => window.open(`https://web.whatsapp.com/send?phone=7721092805&text=Hello`, "_blank"));
  document.getElementById("btnEmailConfig")?.addEventListener("click", () => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=kalpande402@gmail.com&su=Quotation`, "_blank"));

  fetchItemMasterData();
  fetchActiveCompanyProfile();
  fetchSavedVouchers();
});