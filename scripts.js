document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM"; // Replace with your Google Drive folder ID
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w"; // Replace with your Google Drive API key
    const googleSheetsApiUrl = "https://script.google.com/macros/s/AKfycbwobzfbPP7cqP3ywjbnP2UkMiCWVIcZBsn07Hwi2iBHmbzCjALlrftSpzQU4XgmyQ7m/exec"; // Replace with your updated Google Sheets API URL

    // Fetch the list of PDFs from the Google Drive folder
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
                        <form class="comment-form" data-pdf-id="${file.id}">
                            <textarea class="comment-input" placeholder="Add a comment..." rows="4"></textarea>
                            <button type="submit">Submit</button>
                        </form>
                        <div class="comments-container" data-pdf-id="${file.id}">
                            <!-- Comments will be displayed here -->
                        </div>
                    `;

                    pdfContainer.appendChild(pdfViewer);
                    pdfContainer.appendChild(commentSection);
                }
            });

            // Add event listeners for comment forms
            document.querySelectorAll('.comment-form').forEach(form => {
                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    const pdfId = this.getAttribute('data-pdf-id');
                    const commentInput = this.querySelector('.comment-input');
                    const comment = commentInput.value;

                    // Submit comment to the Google Sheets API
                    fetch(googleSheetsApiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ pdfId, comment })
                    })
                        .then(response => response.json())
                        .then(data => {
                            commentInput.value = '';
                            loadComments(pdfId);
                        })
                        .catch(error => console.error('Error submitting comment:', error));
                });
            });

            // Load comments for each PDF
            data.files.forEach(file => {
                if (file.mimeType === "application/pdf") {
                    loadComments(file.id);
                }
            });

            function loadComments(pdfId) {
                fetch(`${googleSheetsApiUrl}?pdfId=${pdfId}`)
                    .then(response => response.json())
                    .then(comments => {
                        const commentsContainer = document.querySelector(`.comments-container[data-pdf-id="${pdfId}"]`);
                        commentsContainer.innerHTML = comments.map(comment => `<p>${comment.comment}</p>`).join('');
                    })
                    .catch(error => console.error('Error loading comments:', error));
            }
        })
        .catch(error => console.error("Error fetching files from Google Drive:", error));
});
