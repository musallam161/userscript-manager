
let validFiles = [];
let resultsData = [];
let originalTexts = [];

function startCheck() {
  const files = document.getElementById("fileInput").files;
  validFiles = [];
  resultsData = [];
  originalTexts = [];

  let html = "<table class='table-auto w-full border'><thead><tr class='bg-gray-200 dark:bg-gray-700'>";
  html += "<th class='p-2 border'>الاسم</th><th class='p-2 border'>الرابط</th><th class='p-2 border'>الحالة</th><th class='p-2 border'>تعديل</th></tr></thead><tbody>";

  Array.from(files).forEach(async (file, index) => {
    const text = await file.text();
    originalTexts[index] = text;
    const name = (text.match(/@name\s+(.+)/)?.[1] || file.name).trim();
    const update = text.match(/@updateURL\s+(.+)/)?.[1]?.trim();
    const download = text.match(/@downloadURL\s+(.+)/)?.[1]?.trim();
    const url = update || download;
    const status = url ? "✅ يحتوي URL" : "⚠️ بدون URL";

    resultsData.push([name, url || "-", status]);

    let modifiedText = text;
    if (url) {
      modifiedText += "\n// @checkedBy musallam161";
      const blob = new Blob([modifiedText], { type: "text/javascript" });
      const newFile = new File([blob], name + ".user.js", { type: "text/javascript" });
      validFiles[index] = { name, file: newFile };
    }

    html += `<tr>
      <td class='p-2 border'>${name}</td>
      <td class='p-2 border'>${url || "-"}</td>
      <td class='p-2 border'>${status}</td>
      <td class='p-2 border'><button class='edit-btn bg-blue-500 text-white px-2 py-1 rounded' data-index='${index}'>✏️</button></td>
    </tr>`;

    if (index === files.length - 1) {
      html += "</tbody></table>";
      document.getElementById("results").innerHTML = html;
      updateSummary();
      setupEditButtons();
    }
  });
}

function setupEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.index);
      openEditor(index, originalTexts[index]);
    };
  });
}

function openEditor(index, content) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
    backgroundColor: "rgba(0,0,0,0.8)", zIndex: "9999", padding: "20px"
  });

  const editorBox = document.createElement("div");
  Object.assign(editorBox.style, {
    backgroundColor: "#fff", maxWidth: "800px", margin: "auto",
    padding: "20px", borderRadius: "8px"
  });

  const textarea = document.createElement("textarea");
  textarea.value = content;
  editorBox.appendChild(textarea);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾 حفظ التعديل وتنزيل";
  saveBtn.style.marginTop = "10px";
  saveBtn.className = "bg-green-600 text-white px-4 py-2 rounded";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "❌ إغلاق";
  closeBtn.style.margin = "10px";
  closeBtn.className = "bg-gray-400 text-black px-4 py-2 rounded";

  editorBox.appendChild(saveBtn);
  editorBox.appendChild(closeBtn);
  overlay.appendChild(editorBox);
  document.body.appendChild(overlay);

  const editor = CodeMirror.fromTextArea(textarea, {
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
  });
  editor.setSize("100%", "400px");

  saveBtn.onclick = () => {
    const modifiedText = editor.getValue() + "\n// @editedBy musallam161";
    const blob = new Blob([modifiedText], { type: "text/javascript" });
    const file = new File([blob], validFiles[index]?.name || `modified_${index}.user.js`, { type: "text/javascript" });
    validFiles[index] = { name: file.name.replace(".user.js", ""), file };
    document.body.removeChild(overlay);
    alert("✅ تم حفظ التعديل!");
  };

  closeBtn.onclick = () => document.body.removeChild(overlay);
}

function updateSummary() {
  const total = resultsData.length;
  const valid = validFiles.filter(v => v).length;
  const noUrl = total - valid;
  document.getElementById("summary").innerHTML =
    `📄 الكلي: ${total} | ✅ صالح: ${valid} | ⚠️ بدون URL: ${noUrl}`;
  document.getElementById("downloadBtn").style.display = valid > 0 ? "inline-block" : "none";
  document.getElementById("exportBtn").style.display = total > 0 ? "inline-block" : "none";
}

document.getElementById("downloadBtn").onclick = async () => {
  const zip = new JSZip();
  validFiles.forEach(({ name, file }) => {
    zip.file(name + ".user.js", file);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "valid-userscripts.zip";
  link.click();
};

document.getElementById("exportBtn").onclick = () => {
  let csv = "الاسم,الرابط,الحالة\n";
  resultsData.forEach(row => {
    csv += row.map(cell => `\"${cell}\"`).join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "userscript_results.csv";
  link.click();
};
