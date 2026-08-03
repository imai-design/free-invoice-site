(function () {
  "use strict";

  var form = document.getElementById("document-form");
  if (!form) return;

  var itemList = document.getElementById("items");
  var itemCount = 0;
  var money = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

  function localDateValue(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatDate(value) {
    if (!value) return "発行日を入力してください";
    var parts = value.split("-");
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  function formatNumber(value) {
    return money.format(Math.round(Number(value) || 0));
  }

  function addItem(name, quantity, unitPrice) {
    itemCount += 1;
    var row = document.createElement("div");
    row.className = "item-row";
    row.dataset.itemId = String(itemCount);
    row.innerHTML =
      '<div class="item-field"><label for="item-name-' + itemCount + '">品名</label><input id="item-name-' + itemCount + '" class="item-name" type="text" placeholder="例：デザイン制作" value="' + (name || "") + '"></div>' +
      '<div class="item-field"><label for="item-quantity-' + itemCount + '">数量</label><input id="item-quantity-' + itemCount + '" class="item-quantity" type="number" min="0" step="1" inputmode="numeric" value="' + (quantity || 1) + '"></div>' +
      '<div class="item-field"><label for="item-price-' + itemCount + '">単価</label><input id="item-price-' + itemCount + '" class="item-price" type="number" min="0" step="1" inputmode="numeric" placeholder="0" value="' + (unitPrice || "") + '"></div>' +
      '<button class="remove-item" type="button" aria-label="この品目を削除">×</button>';
    itemList.appendChild(row);
    row.addEventListener("input", updatePreview);
    row.querySelector(".remove-item").addEventListener("click", function () {
      if (itemList.children.length > 1) {
        row.remove();
        updatePreview();
      }
    });
  }

  function getValue(id) {
    var element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function selectedValue(name) {
    var selected = form.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : "";
  }

  function validateRequiredFields() {
    var errorMessage = document.getElementById("form-error");
    var requiredFields = [
      { element: document.getElementById("issuerName"), message: "発行者名を入力してください" },
      { element: document.getElementById("recipientName"), message: "宛先名を入力してください" }
    ];

    errorMessage.textContent = "";
    requiredFields.forEach(function (field) { field.element.removeAttribute("aria-invalid"); });

    for (var i = 0; i < requiredFields.length; i += 1) {
      var field = requiredFields[i];
      if (!field.element.value.trim()) {
        field.element.setAttribute("aria-invalid", "true");
        errorMessage.textContent = field.message;
        field.element.focus();
        return false;
      }
    }

    return true;
  }

  function updatePreview() {
    var documentType = selectedValue("documentType");
    var issueDate = getValue("issueDate");
    var taxRate = Number(selectedValue("taxRate"));
    var issuerName = getValue("issuerName");
    var issuerDetails = [getValue("issuerAddress"), getValue("issuerPhone"), getValue("issuerEmail")].filter(Boolean).join(" / ");
    var registration = getValue("registrationNumber");
    var rows = Array.from(itemList.querySelectorAll(".item-row"));
    var subtotal = 0;
    var previewItems = document.getElementById("preview-items");
    var typeLabel = documentType === "estimate" ? "見積書" : "請求書";
    var numberPrefix = documentType === "estimate" ? "EST" : "INV";
    var numberDate = issueDate ? issueDate.replace(/-/g, "") : "00000000";

    document.getElementById("preview-document-type").textContent = typeLabel;
    document.getElementById("preview-number").textContent = numberPrefix + "-" + numberDate + "-001";
    document.getElementById("preview-recipient").textContent = getValue("recipientName") || "宛先を入力してください";
    document.getElementById("preview-date").textContent = formatDate(issueDate);
    document.getElementById("preview-issuer").textContent = issuerName || "発行者名を入力してください";
    document.getElementById("preview-issuer-details").textContent = issuerDetails || "住所・電話・メール";
    document.getElementById("preview-registration").textContent = registration ? "登録番号：" + registration : "";
    document.getElementById("preview-tax-label").textContent = taxRate ? "消費税（" + (taxRate * 100) + "%）" : "消費税";
    document.getElementById("preview-notes").textContent = getValue("notes") || "—";

    previewItems.textContent = "";
    rows.forEach(function (row) {
      var name = row.querySelector(".item-name").value.trim() || "品目";
      var quantity = Math.max(0, Number(row.querySelector(".item-quantity").value) || 0);
      var unitPrice = Math.max(0, Number(row.querySelector(".item-price").value) || 0);
      var lineTotal = quantity * unitPrice;
      subtotal += lineTotal;
      var tableRow = document.createElement("tr");
      [name, quantity, formatNumber(unitPrice), formatNumber(lineTotal)].forEach(function (value) {
        var cell = document.createElement("td");
        cell.textContent = value;
        tableRow.appendChild(cell);
      });
      previewItems.appendChild(tableRow);
    });

    var tax = Math.floor(subtotal * taxRate);
    document.getElementById("preview-subtotal").textContent = formatNumber(subtotal);
    document.getElementById("preview-tax").textContent = formatNumber(tax);
    document.getElementById("preview-total").textContent = formatNumber(subtotal + tax);
  }

  document.getElementById("issueDate").value = localDateValue(new Date());
  addItem("", 1, "");
  document.getElementById("add-item").addEventListener("click", function () { addItem("", 1, ""); updatePreview(); });
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  document.getElementById("print-document").addEventListener("click", function () {
    if (!validateRequiredFields()) return;
    window.print();
  });
  updatePreview();
}());
