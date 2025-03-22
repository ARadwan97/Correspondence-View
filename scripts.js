document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM"; // Replace with your Google Drive folder ID
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w"; // Replace with your Google Drive API key
    const clientId = "898372359689-nepv7lbtge136m2s64a0b3ehdr36hepa.apps.googleusercontent.com"; // Replace with your Google OAuth client ID
    
    // Load the Google Drive API
    gapi.load('client:auth2', initClient);

    function initClient() {
        gapi.client.init({
            apiKey: apiKey,
            clientId: clientId,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            scope: 'https://www.googleapis.com/auth/drive.file'
        }).then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                authInstance.signIn();
            }
        });
    }

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

                    // Submit comment to Google Drive
                    const authInstance = gapi.auth2.getAuthInstance();
                    if (authInstance.isSignedIn.get()) {
                        const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
                        fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=media`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'text/plain'
                            },
                            body: comment
                        })
                        .then(response => {
                            if (response.ok) {
                                commentInput.value = '';
                                loadComments(pdfId);
                            } else {
                                console.error('Error submitting comment:', response.statusText);
                            }
                        })
                        .catch(error => console.error('Error submitting comment:', error));
                    }
                });
            });

            function loadComments(pdfId) {
                fetch(`https://www.googleapis.com/drive/v3/files?q='${googleDriveFolderId}'+in+parents&key=${apiKey}`)
                    .then(response => response.json())
                    .then(comments => {
                        const commentsContainer = document.querySelector(`.comments-container[data-pdf-id="${pdfId}"]`);
                        commentsContainer.innerHTML = comments.map(comment => `<p>${comment}</p>`).join('');
                    })
                    .catch(error => console.error('Error loading comments:', error));
            }
        })
        .catch(error => console.error("Error fetching files from Google Drive:", error));
    // Add these functions to your existing scripts.js
function initializeSheet() {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
        // Load the Google Sheets API
        gapi.client.load('sheets', 'v4', () => {
            console.log('Sheets API loaded');
        });
    }
}

function saveCommentToSheet(pdfId, comment) {
    const spreadsheetId = '1Hx4pZt2EFz1UcEbFWtkonNF5GCF4Z9n1KMEoPPim-WY'; // Replace with your Google Sheet ID
    const range = 'Sheet1!A:C';
    
    const values = [
        [new Date().toISOString(), pdfId, comment]
    ];

    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: values
        }
    }).then((response) => {
        console.log('Comment saved to sheet');
    }, (error) => {
        console.error('Error saving comment:', error);
    });
}

// Update your initialization
function initClient() {
    gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            "https://sheets.googleapis.com/$discovery/rest?version=v4"
        ],
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets'
    }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
            authInstance.signIn();
        } else {
            initializeSheet();
        }
    });
}
});
