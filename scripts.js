document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    
    // Replace with your deployed Apps Script URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBERNM1Y1HBVFmrz0wgI9ZwdpyrGskeSxbdYq6OnIAtUjrjQ9UdSW2yItD_aHPyXEa/exec';

    // Function to submit comment using JSONP
    function submitComment(formData) {
        // Create a unique callback name
        const callbackName = 'callback_' + Date.now();
        
        // Create script element
        const script = document.createElement('script');
        const queryParams = new URLSearchParams(formData);
        queryParams.append('callback', callbackName);
        
        // Add callback function
        window[callbackName] = function(response) {
            if (response.result === 'success') {
                // Show success message
                const form = document.querySelector(`form[data-pdf-id="${formData.pdfId}"]`);
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Comment saved successfully!';
                form.appendChild(successMsg);
                
                // Clear the input
                form.querySelector('.comment-input').value = '';
                
                // Remove success message after 3 seconds
                setTimeout(() => successMsg.remove(), 3000);
            } else {
                console.error('Error:', response.error);
                alert('Error saving comment. Please try again.');
            }
            
            // Clean up
            document.body.removeChild(script);
            delete window[callbackName];
        };

        // Set script source and append to document
        script.src = `${SCRIPT_URL}?${queryParams.toString()}`;
        document.body.appendChild(script);
    }

    // Fetch PDFs and create viewers
    fetch(`https://www.googleapis.com/drive/v3/files?q='${googleDriveFolderId}'+in+parents&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            data.files.forEach(file => {
                if (file.mimeType === "application/pdf") {
                    const pdfViewer = document.createElement("div");
                    pdfViewer.className = "pdf-viewer";
                    pdfViewer.innerHTML = `
                        <iframe src="https://drive.google.com/file/d/${file.id}/preview" width="600" height="800"></iframe>
                    `;

                    const commentSection = document.createElement("div");
                    commentSection.className = "comment-section";
                    commentSection.innerHTML = `
                        <h2>Comments for ${file.name}</h2>
                        <form class="comment-form" data-pdf-id="${file.id}" data-pdf-name="${file.name}">
                            <textarea class="comment-input" placeholder="Add a comment..." rows="4" required></textarea>
                            <button type="submit">Submit Comment</button>
                        </form>
                        <div class="comments-container" data-pdf-id="${file.id}"></div>
                    `;

                    pdfContainer.appendChild(pdfViewer);
                    pdfContainer.appendChild(commentSection);
                }
            });

            // Add event listeners for comment forms
            document.querySelectorAll('.comment-form').forEach(form => {
                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    
                    const formData = {
                        user: 'ARadwan97',
                        pdfId: this.getAttribute('data-pdf-id'),
                        pdfName: this.getAttribute('data-pdf-name'),
                        comment: this.querySelector('.comment-input').value.trim()
                    };

                    if (formData.comment) {
                        submitComment(formData);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching PDFs:', error);
        });
});
