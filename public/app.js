  // Updated to accept a message parameter
  function showNotification(message, duration = 1000) { // Duration is now a parameter
    notification.textContent = message; // Set the notification message
    notification.style.display = 'block'; // Show the notification
    setTimeout(() => {
        notification.style.display = 'none'; // Hide after duration
    }, duration);
}

  // Function to update button visibility based on paragraph content
  function updateButtonVisibility() {
    if (responseArea.textContent.trim() === '') {
        copyButton.style.display = 'none';
    } else {
        copyButton.style.display = 'inline-block';
    }
}

document.addEventListener('DOMContentLoaded', function () {
  const userInput = document.getElementById('userInput'); // Make sure this ID is correct
  const copyButton = document.getElementById('copyButton');
  const responseArea = document.getElementById('responseArea');
  const clearButton = document.getElementById('clearButton');

  updateButtonVisibility();

  userInput.addEventListener('keypress', function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Stop the Enter key from creating a new line
      sendMessage(); // Call sendMessage function
    }
  });

  copyButton.addEventListener('click', function () {
      if (navigator.clipboard) {
          navigator.clipboard.writeText(responseArea.textContent).then(() => {
              showNotification("Text copied to clipboard!", 1000); // Show notification for 1 second
          }).catch(err => {
              console.error('Failed to copy text: ', err);
          });
      } else {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(responseArea);
          selection.removeAllRanges();
          selection.addRange(range);
          try {
              document.execCommand('copy');
              showNotification("Text copied to clipboard!", 1000); // Show notification for 1 second
          } catch (err) {
              console.error('Failed to copy text: ', err);
          }
          selection.removeAllRanges();
      }
  });

  // Function to clear both the user input and response area
  clearButton.addEventListener('click', function () {
      userInput.value = '';  // Clear textarea
      responseArea.textContent = '';  // Clear response area
      updateButtonVisibility(); // Update visibility state of the copy button
      userInput.disabled = false;
  });

});


async function sendMessage() {
  const userInputEl = document.getElementById('userInput');
  const responseArea = document.getElementById('responseArea');

  if (userInputEl.value.trim() === '') {
    showNotification("Please enter your message", 1000);    
    return;
  }

  responseArea.textContent = '';
  userInputEl.blur();
  userInputEl.disabled = true;

  const eventSource = new EventSource('/message-stream?message=' + encodeURIComponent(userInputEl.value.trim())); 

  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    responseArea.textContent += data.text; 
    updateButtonVisibility();

    if (data.done) { 
      eventSource.close(); 
      userInputEl.disabled = false;
      userInputEl.focus(); 
    }
  };

  eventSource.onerror = function(error) {
    console.error("Stream encountered an error: ", error);
    eventSource.close(); 
    userInputEl.disabled = false;
    responseArea.textContent = "Error processing your request";
  };

  eventSource.onopen = function() {
    console.log("Stream opened");
  };
}