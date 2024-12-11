# Privacy Policy for Bitbucket Code Opener

## Data Collection and Usage

This extension does not collect or transmit any personal data. It only:

- Stores repository-to-path mappings locally in your browser
- Communicates with a local native messaging host to open files
- Reads Bitbucket pull request page content to extract file paths

## Data Storage

- Repository mappings are stored using Chrome's `storage.sync` API
- All data remains on your local machine
- No data is sent to external servers

## Permissions

- `nativeMessaging`: Required to communicate with local editor
- `storage`: Required to save repository mappings
- `activeTab`: Required to interact with Bitbucket pages
- `*://*.bitbucket.org/*`: Required to run on Bitbucket pages

## Security

- All file operations are performed locally
- Path validation prevents unauthorized file access
- No sensitive data is collected or transmitted

## Contact

For questions about this privacy policy, please contact [Your Contact Info]
