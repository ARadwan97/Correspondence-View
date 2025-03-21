document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "YOUR_GOOGLE_DRIVE_FOLDER_ID"; // Replace with your Google Drive folder ID
    const apiKey = "YOUR_GOOGLE_DRIVE_API_KEY"; // Replace with your Google Drive API key

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
                        <form class="comment-form">
                            <textarea class="comment-input" placeholder="Add a comment..." rows="4"></textarea>
                            <button type="submit">Submit</button>
                        </form>
                        <div class="comments-container">
                            <!-- Comments will be displayed here -->
                        </div>
                    `;

                    pdfContainer.appendChild(pdfViewer);
                    pdfContainer.appendChild(commentSection);
                }
            });
        })
        .catch(error => console.error("Error fetching files from Google Drive:", error));
});
