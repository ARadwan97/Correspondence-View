document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM"; // Replace with your Google Drive folder ID
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w"; // Replace with your Google Drive API key
    const githubRepoOwner = "ARadwan97"; // Replace with your GitHub username
    const githubRepoName = "comments-repo"; // Replace with your GitHub repository name
    const githubToken = "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"; // Replace with your GitHub token

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

                    // Submit comment to the GitHub repository
                    fetch(`https://api.github.com/repos/${githubRepoOwner}/${githubRepoName}/dispatches`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `token ${githubToken}`
                        },
                        body: JSON.stringify({
                            event_type: 'add_comment',
                            client_payload: {
                                comment: `PDF ID: ${pdfId}\nComment: ${comment}`
                            }
                        })
                    })
                        .then(response => {
                            if (response.ok) {
                                commentInput.value = '';
                                loadComments();
                            } else {
                                console.error('Error submitting comment:', response.statusText);
                            }
                        })
                        .catch(error => console.error('Error submitting comment:', error));
                });
            });

            function loadComments() {
                fetch(`https://raw.githubusercontent.com/${githubRepoOwner}/${githubRepoName}/main/comments.txt`)
                    .then(response => response.text())
                    .then(data => {
                        const commentsContainer = document.querySelector('.comments-container');
                        commentsContainer.innerHTML = data.split('\n').map(comment => `<p>${comment}</p>`).join('');
                    })
                    .catch(error => console.error('Error loading comments:', error));
            }

            loadComments();
        })
        .catch(error => console.error("Error fetching files from Google Drive:", error));
});
