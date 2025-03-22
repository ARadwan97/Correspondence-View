document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    const clientId = "898372359689-nepv7lbtge136m2s64a0b3ehdr36hepa.apps.googleusercontent.com";
    const spreadsheetId = "1Hx4pZt2EFz1UcEbFWtkonNF5GCF4Z9n1KMEoPPim-WY";

    // Load the Google APIs
    gapi.load('client:auth2', initClient);

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

    function initializeSheet() {
        // Ensure headers exist in the spreadsheet
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A1:E1'
        }).then((response) => {
            const headers = response.result.values?.[0] || [];
            if (headers.length === 0) {
                // Add headers if they don't exist
                gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: spreadsheetId,
                    range: 'Sheet1!A1:E1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['Timestamp', 'User', 'PDF Name', 'PDF ID', 'Comment']]
                    }
                });
            }
        });
    }

    function saveCommentToSheet(pdfId, pdfName, comment) {
        const timestamp = new Date().toISOString();
        const username = "ARadwan97"; // Using your login

        const values = [
            [timestamp, username, pdfName, pdfId, comment]
        ];

        gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values
            }
        }).then((response) => {
            console.log('Comment saved successfully');
            // Clear the comment input and show success message
            const form = document.querySelector(`form[data-pdf-id="${pdfId}"]`);
            const commentInput = form.querySelector('.comment-input');
            commentInput.value = '';
            
            // Display success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Comment saved successfully!';
            form.appendChild(successMessage);
            setTimeout(() => successMessage.remove(), 3000);

            // Refresh comments display
            loadComments(pdfId);
        }).catch((error) => {
            console.error('Error saving comment:', error);
            alert('Error saving comment. Please try again.');
        });
    }

    // Add this function to load existing comments
    function loadComments(pdfId) {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A:E'
        }).then((response) => {
            const values = response.result.values || [];
            const comments = values.filter(row => row[3] === pdfId); // Filter comments for this PDF
            
            // Display the comments
            const commentsContainer = document.querySelector(`.comments-container[data-pdf-id="${pdfId}"]`);
            commentsContainer.innerHTML = ''; // Clear existing comments
            
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-user">${comment[1]}</span>
                        <span class="comment-date">${new Date(comment[0]).toLocaleString()}</span>
                    </div>
                    <div class="comment-text">${comment[4]}</div>
                `;
                commentsContainer.appendChild(commentElement);
            });
        });
    }

    // Modify your existing fetch and form creation code
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
                            <textarea class="comment-input" placeholder="Add a comment..." rows="4"></textarea>
                            <button type="submit">Submit</button>
                        </form>
                        <div class="comments-container" data-pdf-id="${file.id}">
                            <!-- Comments will be displayed here -->
                        </div>
                    `;

                    pdfContainer.appendChild(pdfViewer);
                    pdfContainer.appendChild(commentSection);
                    
                    // Load existing comments
                    loadComments(file.id);
                }
            });

            // Add event listeners for comment forms
            document.querySelectorAll('.comment-form').forEach(form => {
                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    const pdfId = this.getAttribute('data-pdf-id');
                    const pdfName = this.getAttribute('data-pdf-name');
                    const commentInput = this.querySelector('.comment-input');
                    const comment = commentInput.value.trim();

                    if (comment) {
                        saveCommentToSheet(pdfId, pdfName, comment);
                    }
                });
            });
        });
});
