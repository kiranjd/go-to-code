// Add logging to see what's happening
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "UPDATE_MAPPING") {
    chrome.storage.sync.get(["repoMappings"], (result) => {
      const currentMappings = result.repoMappings || {};
      // Only update the specific mapping that changed
      const newMappings = {
        ...currentMappings,
        ...message.mapping, // This merges just the new mapping
      };

      console.log("Updating mappings:", {
        current: currentMappings,
        new: newMappings,
        change: message.mapping,
      });

      console.log("🚀 ~ chrome.storage.sync.get ~ newMappings:", newMappings);
      chrome.storage.sync.set({ repoMappings: newMappings });
    });
  }
});
