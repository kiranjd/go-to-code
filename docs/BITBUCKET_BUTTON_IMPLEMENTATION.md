# Bitbucket Code Opener Implementation

## Overview

A Chrome extension that enables opening files directly in Cursor editor from Bitbucket pull requests. When hovering over code lines in a PR, they highlight and become clickable to open that exact line using the cursor:// protocol.

## Project Structure

```
bitbucket-code-opener/
├── extension/
│   ├── manifest.json     # Extension configuration
│   ├── content.js        # Bitbucket page integration
│   ├── popup.html        # Settings UI
│   ├── popup.js         # Repository mapping logic
│   └── icons/           # Extension icons
├── docs/
│   ├── INSTALLATION.md
│   ├── PRIVACY_POLICY.md
│   └── BITBUCKET_BUTTON_IMPLEMENTATION.md
└── README.md
```

## Key Components

### manifest.json

```json
{
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["*://*.bitbucket.org/*"],
  "content_scripts": [
    {
      "matches": ["*://*.bitbucket.org/*"],
      "js": ["content.js"]
    }
  ]
}
```

### content.js

Main functionality:

- Detects code lines in Bitbucket PRs
- Adds hover effects and click handlers
- Retrieves repository mappings from storage
- Opens files using cursor:// protocol

Key implementations:

```javascript
// Add interactive behavior
lineWrapper.addEventListener("click", (e) => {
  if (e.target.closest("button, a")) return;

  chrome.storage.sync.get(["repoMappings"], (result) => {
    const mappings = result.repoMappings || {};
    const projectPath = mappings[repoInfo.repository];

    // Open in Cursor using protocol handler
    const projectUrl = `cursor://file/${projectPath}`;
    const fileUrl = `cursor://file/${projectPath}/${filePath}:${lineNumber}`;

    window.open(projectUrl);
    window.open(fileUrl);
  });
});
```

### popup.html/js

Settings interface for:

- Managing repository to local path mappings
- Storing mappings in Chrome storage
- Validating paths and repository names

## Implementation Details

### Repository Mapping

- Uses Chrome's storage.sync API
- Maps Bitbucket repository names to local paths
- Example:
  ```javascript
  {
    "my-repo": "/Users/me/projects/my-repo"
  }
  ```

### File Opening

- Uses cursor:// protocol handler
- Opens project first, then specific file
- Includes line number for precise navigation
- Example URL: `cursor://file/path/to/project/src/file.ts:123`

### CSS Implementation

```css
.line-wrapper {
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.line-wrapper:hover {
  background-color: rgba(9, 30, 66, 0.08) !important;
}

.line-wrapper:hover::after {
  content: "Click to open in editor";
  position: absolute;
  right: 16px;
}
```

## Security Considerations

- No direct file system access
- All paths validated before use
- Uses browser's built-in protocol handler security
- Repository mappings stored securely in Chrome storage

## Future Improvements

1. Support for multiple editors
2. Keyboard shortcuts
3. Better error handling for missing mappings
4. Path auto-detection
5. Batch file opening support

## References

- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Cursor Editor Documentation](https://cursor.sh/)
