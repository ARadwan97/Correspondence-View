document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    
    // Replace this with your deployed Apps Script URL
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

    // Function to submit comment to Google Sheet
    async function submitComment(formData) {
        try {
            console.log('Submitting comment:', formData);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for CORS handling
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData).toString()
            });

            console.log('Response received:', response);

            // Show success message
            const form = document.querySelector(`form[data-pdf-id="${formData.pdfId}"]`);
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = 'Comment saved successfully!';
            form.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);

            // Clear the input
            form.querySelector('.comment-input').value = '';

        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Error saving comment: ' + error.message);
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
                    console.log('Form submitted');
                    
                    const formData = {
                        user: 'ARadwan97',
                        pdfId: this.getAttribute('data-pdf-id'),
                        pdfName: this.getAttribute('data-pdf-name'),
                        comment: this.querySelector('.comment-input').value.trim()
                    };

                    console.log('Form data:', formData);

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
