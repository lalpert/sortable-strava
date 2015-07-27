// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('Unleashing the script!');

  chrome.tabs.executeScript(null, { file: "jquery-2.1.1.min.js" }, function() {
    chrome.tabs.executeScript(null, { file: "underscore-min.js" }, function() {
      chrome.tabs.executeScript(null, { file: "passwords.js" }, function() {
        chrome.tabs.insertCSS(null, {file: "app.css"});
        chrome.tabs.executeScript(null, { file: "contentscript.js" });
      });
    });
  });
});
