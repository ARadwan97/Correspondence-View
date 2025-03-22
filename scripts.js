document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxA-mKACF_ZCPBuwFpBWbdqS1Guj30CIbNYzhhiopJsQTywcUj84h69L9wg1aFSF1ZE/exec'; // Your deployed Apps Script URL

    async function submitComment(formData) {
        try {
            // Format the date in YYYY-MM-DD HH:MM:SS format
            const now = new Date();
            const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
            
            // Add timestamp and ensure all required fields
            const data = {
                timestamp: formattedDate,
                user: 'ARadwan97',
                pdfId: formData.pdfId,
                pdfName: formData.pdfName,
                comment: formData.comment
            };

            console.log('Submitting data:', data); // Debug log

            // Convert data to URL-encoded format
            const formBody = new URLSearchParams(data).toString();
            
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody
            });

            // Log the response for debugging
            console.log('Response status:', response.status);
            
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

        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Error saving comment. Please try again.');
        }
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
                        <iframe src="https://docs.google.com/gview?url=https://drive.google.com/uc?export=download%26id=${file.id}&embedded=true" 
                                width="600" 
                                height="800">
                        </iframe>
                    `;

                    // Update the commentSection creation in your scripts.js
const commentSection = document.createElement("div");
commentSection.className = "comment-section";
commentSection.innerHTML = `
    <div class="metadata">
        <p>Current Date and Time (UTC): ${new Date().toISOString().replace('T', ' ').slice(0, 19)}</p>
        <p>User: ARadwan97</p>
    </div>
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
                        pdfId: this.getAttribute('data-pdf-id'),
                        pdfName: this.getAttribute('data-pdf-name'),
                        comment: this.querySelector('.comment-input').value.trim()
                    };

                    console.log('Form submission data:', formData); // Debug log

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
