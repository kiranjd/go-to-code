const DEFAULT_EDITOR_CONFIG = {
  name: "cursor",
  protocol: "cursor://file/{path}:{line}",
  projectRoot: "",
  isCustom: false,
};

const EDITOR_CONFIGS = {
  cursor: {
    protocol: "cursor://file/{path}:{line}",
  },
  vscode: {
    protocol: "vscode://file/{path}:{line}",
  },
  sublime: {
    protocol: "sublime://file/{path}:{line}",
  },
  androidStudio: {
    protocol: "idea://open?file={path}&line={line}",
    needsProjectRoot: true,
  },
  xcode: {
    protocol: "xcode://file://{path}&line={line}",
    needsProjectRoot: true,
  },
};

let editingRepo = null;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedLoadMappings = debounce(() => {
  chrome.storage.sync.get(["repoMappingsV2"], (result) => {
    const mappings = result.repoMappingsV2 || {};
    const mappingsList = document.getElementById("mappingsList");
    mappingsList.innerHTML = "";

    Object.entries(mappings).forEach(([repoName, mapping]) => {
      addMappingToList(repoName, mapping);
    });
  });
}, 100);

document.addEventListener("DOMContentLoaded", () => {
  debouncedLoadMappings();
  loadEditorSettings();
  document
    .querySelector(".mapping-form")
    .addEventListener("submit", handleSubmit);
  document
    .getElementById("editorSelect")
    .addEventListener("change", handleEditorChange);
  document
    .getElementById("cancelEditBtn")
    .addEventListener("click", cancelEdit);
});

function loadEditorSettings() {
  chrome.storage.sync.get(["editorConfig"], (result) => {
    const config = result.editorConfig || DEFAULT_EDITOR_CONFIG;
    const editorSelect = document.getElementById("editorSelect");
    editorSelect.value = config.name;

    if (config.isCustom) {
      document.getElementById("customEditorName").value = config.name;
      document.getElementById("customProtocol").value = config.protocol;
      document.getElementById("customEditorFields").style.display = "block";
    }

    if (config.needsProjectRoot) {
      document.getElementById("projectRoot").value = config.projectRoot;
      document.getElementById("ideSpecificFields").style.display = "block";
    }
  });
}

function handleEditorChange(e) {
  const selectedEditor = e.target.value;
  const customFields = document.getElementById("customEditorFields");
  const ideFields = document.getElementById("ideSpecificFields");

  customFields.style.display = selectedEditor === "custom" ? "block" : "none";

  const needsProjectRoot = EDITOR_CONFIGS[selectedEditor]?.needsProjectRoot;
  ideFields.style.display = needsProjectRoot ? "block" : "none";

  saveEditorConfig(selectedEditor);
}

function saveEditorConfig(editorName) {
  const config = {
    name: editorName,
    protocol: EDITOR_CONFIGS[editorName]?.protocol || "",
    projectRoot: document.getElementById("projectRoot").value,
    isCustom: editorName === "custom",
    needsProjectRoot: EDITOR_CONFIGS[editorName]?.needsProjectRoot,
  };

  if (config.isCustom) {
    config.name = document.getElementById("customEditorName").value;
    config.protocol = document.getElementById("customProtocol").value;
  }

  chrome.storage.sync.set({ editorConfig: config });
}

function handleSubmit(e) {
  e.preventDefault();

  const repoName = document.getElementById("repoName").value.trim();
  const localPath = document.getElementById("localPath").value.trim();
  const selectedEditor = document.getElementById("editorSelect").value;

  if (!repoName || !localPath) return;

  chrome.storage.sync.get(["repoMappingsV2"], (result) => {
    const mappings = result.repoMappingsV2 || {};

    if (editingRepo && editingRepo !== repoName && mappings[repoName]) {
      alert(`Repository "${repoName}" already exists`);
      return;
    }

    if (editingRepo) {
      delete mappings[editingRepo];
    }

    // Create editor config for this repo
    const editorConfig = {
      name: selectedEditor,
      protocol: EDITOR_CONFIGS[selectedEditor]?.protocol || "",
      projectRoot: document.getElementById("projectRoot").value,
      isCustom: selectedEditor === "custom",
      needsProjectRoot: EDITOR_CONFIGS[selectedEditor]?.needsProjectRoot,
    };

    if (editorConfig.isCustom) {
      editorConfig.name = document.getElementById("customEditorName").value;
      editorConfig.protocol = document.getElementById("customProtocol").value;
    }

    // Store both path and editor config
    mappings[repoName] = {
      path: localPath,
      editorConfig: editorConfig,
    };

    chrome.storage.sync.set({ repoMappingsV2: mappings }, () => {
      document.getElementById("repoName").value = "";
      document.getElementById("localPath").value = "";
      document.getElementById("addMappingBtn").textContent = "Add Mapping";
      document.getElementById("cancelEditBtn").style.display = "none";
      editingRepo = null;
      debouncedLoadMappings();
    });
  });
}

function cancelEdit() {
  document.getElementById("repoName").value = "";
  document.getElementById("localPath").value = "";
  document.getElementById("addMappingBtn").textContent = "Add Mapping";
  document.getElementById("cancelEditBtn").style.display = "none";
  editingRepo = null;
}

function startEdit(repoName, mapping) {
  editingRepo = repoName;
  document.getElementById("repoName").value = repoName;
  document.getElementById("localPath").value = mapping.path;
  document.getElementById("editorSelect").value = mapping.editorConfig.name;

  if (mapping.editorConfig.isCustom) {
    document.getElementById("customEditorName").value =
      mapping.editorConfig.name;
    document.getElementById("customProtocol").value =
      mapping.editorConfig.protocol;
    document.getElementById("customEditorFields").style.display = "block";
  }

  if (mapping.editorConfig.needsProjectRoot) {
    document.getElementById("projectRoot").value =
      mapping.editorConfig.projectRoot;
    document.getElementById("ideSpecificFields").style.display = "block";
  }

  document.getElementById("addMappingBtn").textContent = "Update Mapping";
  document.getElementById("cancelEditBtn").style.display = "inline-block";
  document.getElementById("repoName").focus();
}

function addMappingToList(repoName, mapping) {
  const mappingsList = document.getElementById("mappingsList");
  const mappingItem = document.createElement("div");
  mappingItem.className = "mapping-item";

  const mappingDetails = document.createElement("div");
  mappingDetails.className = "mapping-details";

  const repoNameElement = document.createElement("div");
  repoNameElement.className = "repo-name";
  repoNameElement.textContent = repoName;

  const localPathElement = document.createElement("div");
  localPathElement.className = "local-path";
  localPathElement.textContent = mapping.path;

  const editorInfo = document.createElement("div");
  editorInfo.className = "editor-info";
  editorInfo.textContent = `Opens in ${
    mapping.editorConfig.name.charAt(0).toUpperCase() +
    mapping.editorConfig.name.slice(1)
  }`;

  const actionButtons = document.createElement("div");
  actionButtons.className = "action-buttons";

  const editButton = document.createElement("button");
  editButton.className = "edit-button";
  editButton.setAttribute("aria-label", "Edit mapping");
  editButton.setAttribute("title", "Edit mapping");
  editButton.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"/></svg>`;
  editButton.addEventListener("click", () => startEdit(repoName, mapping));

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.setAttribute("aria-label", "Remove mapping");
  removeButton.setAttribute("title", "Remove mapping");
  removeButton.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.75 1.75 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15zM6.5 6.5a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5a.75.75 0 01.75-.75zm3 0a.75.75 0 01.75.75v5a.75.75 0 01-1.5 0v-5a.75.75 0 01.75-.75z"/></svg>`;
  removeButton.addEventListener("click", () => removeMapping(repoName));

  mappingDetails.appendChild(repoNameElement);
  mappingDetails.appendChild(localPathElement);
  mappingDetails.appendChild(editorInfo);
  actionButtons.appendChild(editButton);
  actionButtons.appendChild(removeButton);
  mappingItem.appendChild(mappingDetails);
  mappingItem.appendChild(actionButtons);

  mappingsList.appendChild(mappingItem);
}

function removeMapping(repoName) {
  chrome.storage.sync.get(["repoMappingsV2"], (result) => {
    const mappings = result.repoMappingsV2 || {};
    delete mappings[repoName];

    chrome.storage.sync.set({ repoMappingsV2: mappings }, () => {
      debouncedLoadMappings();
    });
  });
}
