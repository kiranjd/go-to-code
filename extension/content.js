// Extract repository info from the current page
function extractRepoInfo() {
  const url = window.location.pathname;
  const pathParts = url.split("/");

  // Handle both PR and commit URLs
  if (pathParts.length >= 3) {
    return {
      workspace: pathParts[1],
      repository: pathParts[2],
    };
  }
  return null;
}

// Add interactive behavior to code lines
function addEditorButtons() {
  // Add CSS if not already added
  if (!document.getElementById("editor-button-styles")) {
    const style = document.createElement("style");
    style.id = "editor-button-styles";
    style.textContent = `
      .line-wrapper {
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      }
      .line-wrapper:hover {
        background-color: rgba(76, 154, 255, 0.04) !important;
      }
      .line-wrapper:hover::after {
        content: 'Click to open in editor';
        position: absolute;
        right: 24px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        font-weight: 500;
        color: #0052CC;
        background: rgba(222, 235, 255, 0.9);
        padding: 6px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(76, 154, 255, 0.15);
        opacity: 0;
        animation: fadeIn 0.2s ease forwards;
        pointer-events: none;
        z-index: 1000;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-50%) translateX(10px); }
        to { opacity: 1; transform: translateY(-50%) translateX(0); }
      }
      .open-in-editor.add-comment-button {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  const repoInfo = extractRepoInfo();
  console.log("repoInfo:", repoInfo);
  if (!repoInfo) return;

  // Find all add comment buttons
  const commentButtons = document.querySelectorAll("button.add-comment-button");

  // Also find all line wrappers directly for commit diffs
  const lineWrappers = document.querySelectorAll(".line-wrapper");

  // Process both comment buttons (for PRs) and line wrappers (for commits)
  const processLineWrapper = (lineWrapper, diffContainer) => {
    if (!lineWrapper || lineWrapper.hasAttribute("data-editor-enabled")) return;
    lineWrapper.setAttribute("data-editor-enabled", "true");

    // Get the file path from this specific diff container
    const fileHeader = diffContainer?.querySelector(
      '[data-qa="bk-filepath"], [data-qa="commit-file-name"]'
    );
    let filePath;

    if (fileHeader) {
      const segments = Array.from(
        fileHeader.querySelectorAll(
          '[data-qa="bk-filepath__padded-segment"], [data-qa="commit-file-name"] span'
        )
      )
        .map((el) => el.textContent.trim())
        .filter((text) => text !== "/");

      if (segments.length > 0) {
        filePath = segments.join("/");
      }
    }

    if (!filePath) {
      console.log("No file path found for this line");
      return;
    }

    // Get line number from the line-numbers div
    const lineNumberDiv = lineWrapper.querySelector(".line-numbers");

    // Try to get line number from different attributes and clean it
    let lineNumber =
      lineNumberDiv
        ?.querySelector(".line-number-permalink")
        ?.textContent?.trim() ||
      lineNumberDiv?.getAttribute("data-new-line-number") ||
      lineNumberDiv?.getAttribute("data-old-line-number");

    // Make sure line number is a clean number
    if (lineNumber) {
      lineNumber = lineNumber.replace(/\D/g, "");
    }

    if (!lineNumber) {
      console.log("No line number found for this line");
      return;
    }

    lineWrapper.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;

      chrome.storage.sync.get(["repoMappingsV2"], (result) => {
        const mappings = result.repoMappingsV2 || {};
        const mapping = mappings[repoInfo.repository];

        if (!mapping) {
          alert(
            `Please map repository "${repoInfo.repository}" in extension settings`
          );
          return;
        }

        const projectPath = mapping.path;
        const editorConfig = mapping.editorConfig;

        // Handle project root for IDEs that need it
        const fullProjectPath = editorConfig.projectRoot || projectPath;
        const fullFilePath = `${projectPath}/${filePath}`;

        // Generate URL based on editor protocol
        let fileUrl;
        if (editorConfig.name === "androidStudio") {
          // Android Studio specific handling
          const projectRoot = editorConfig.projectRoot || projectPath;
          fileUrl = `idea://open?file=${encodeURIComponent(
            fullFilePath
          )}&line=${lineNumber}`;
          if (projectRoot) {
            fileUrl += `&project=${encodeURIComponent(projectRoot)}`;
          }
        } else if (editorConfig.name === "xcode") {
          const encodedPath = encodeURIComponent(fullFilePath);
          fileUrl = `xcode://open?url=file:///${encodedPath}&line=${lineNumber}`;
        } else {
          fileUrl = editorConfig.protocol
            .replace(/{path}/g, fullFilePath)
            .replace(/{line}/g, lineNumber);
        }

        // Add URL logging before opening
        console.log("Opening URL:", fileUrl);

        // Always open project first, then file
        const projectUrl = editorConfig.protocol
          .replace(/{path}/g, fullProjectPath)
          .replace(/{line}/g, "1");
        console.log("Opening project URL first:", projectUrl);
        window.open(projectUrl);
        setTimeout(() => window.open(fileUrl), 1000);
      });
    });
  };

  // Process PR diffs
  commentButtons.forEach((commentButton) => {
    const lineWrapper = commentButton.closest(".line-wrapper");
    const diffContainer = commentButton.closest('[data-qa="branch-diff-file"]');
    processLineWrapper(lineWrapper, diffContainer);
  });

  // Process commit diffs
  lineWrappers.forEach((lineWrapper) => {
    if (!lineWrapper.hasAttribute("data-editor-enabled")) {
      const diffContainer = lineWrapper.closest('[data-qa="commit-file"]');
      processLineWrapper(lineWrapper, diffContainer);
    }
  });
}

// Run when page loads and when content changes
const observer = new MutationObserver(() => {
  requestAnimationFrame(addEditorButtons);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial run with a small delay to ensure DOM is ready
setTimeout(addEditorButtons, 1000);
