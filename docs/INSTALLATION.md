# Installation Guide

## Prerequisites

- Google Chrome browser
- Cursor editor installed

## Installation Steps

1. Install the extension from Chrome Web Store (or load unpacked for development)

2. Click the extension icon and go to settings

3. Map your Bitbucket repositories to local paths:
   - Repository name: The name of your repo on Bitbucket
   - Local path: Full path to your local repository
     Example: `Repository: my-project
Local path: /Users/username/projects/my-project  `

## Usage

1. Go to any pull request on Bitbucket
2. Click on any line of code
3. The file will open in Cursor at the selected line

## Development Setup

1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension` folder

## Troubleshooting

- Make sure Cursor is installed and can handle `cursor://` protocol
- Verify your repository mappings match exactly with your local paths
- Check if you can manually open files using `cursor://file/path/to/file`
