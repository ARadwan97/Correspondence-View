document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz18mgZLwc3UOVOpsRZL36UAMLxnNNEkyQBP7ug9TCcMUbPaXdG_AYS72Y-9pTSOo8a/exec';

    // Create header
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
        <img src="logo-dmo.png" alt="Left Logo" class="logo logo-left">
        <div class="header-title">شاشة عرض بوسطة مكتب نائب الوزير</div>
        <img src="logo-dmo1.png" alt="Right Logo" class="logo logo-right">
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Function to format date
    function formatDate(date) {
        return date.toISOString()
            .replace('T', ' ')
            .slice(0, 19);
    }

    // Function to fetch comments for a PDF
    async function fetchComments(pdfId) {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getComments&pdfId=${pdfId}`);
            const comments = await response.json();
            return comments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    // Function to render comments
    function renderComments(comments, container) {
        container.innerHTML = comments.length ? '' : '<p class="no-comments">لا يوجد تأشيرة مقترحة </p>';
        
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-user">${comment.user}</span>
                        <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="comment-text">${comment.comment}</div>
                `;
                container.appendChild(commentElement);
            });
    }

    // Function to submit comment
    async function submitComment(formData) {
        try {
            const now = new Date();
            const data = {
                timestamp: formatDate(now),
                user: 'DR. M.Eltayeb',
                pdfId: formData.pdfId,
                pdfName: formData.pdfName,
                comment: formData.comment
            };

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data)
            });

            const result = await response.json();
            
            if (result.result === 'success') {
                const form = document.querySelector(`form[data-pdf-id="${formData.pdfId}"]`);
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'تم التأشير بنجاح وجاري التنفيذ';
                form.appendChild(successMsg);
                
                // Clear the input
                form.querySelector('.comment-input').value = '';
                
                // Refresh comments
                const commentsContainer = document.querySelector(`.comments-container[data-pdf-id="${formData.pdfId}"]`);
                const comments = await fetchComments(formData.pdfId);
                renderComments(comments, commentsContainer);
                
                setTimeout(() => successMsg.remove(), 300000);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Error saving comment. Please try again.');
        }
    }

    // Function to update current time
    function updateCurrentTime() {
        const timeElements = document.querySelectorAll('.current-time');
        const now = new Date();
        timeElements.forEach(element => {
            element.textContent = formatDate(now);
        });
    }

    // Fetch PDFs and create viewers
    fetch(`https://www.googleapis.com/drive/v3/files?q='${googleDriveFolderId}'+in+parents&key=${apiKey}`)
        .then(response => response.json())
        .then(async data => {
            for (const file of data.files) {
                if (file.mimeType === "application/pdf") {
                    const pdfViewer = document.createElement("div");
                    pdfViewer.className = "pdf-viewer";
                    pdfViewer.innerHTML = `
                        <iframe src="https://docs.google.com/gview?url=https://drive.google.com/uc?export=download%26id=${file.id}&embedded=true" 
                                width="600" 
                                height="1000">
                        </iframe>
                    `;

                    const commentSection = document.createElement("div");
                    commentSection.className = "comment-section";
                    commentSection.innerHTML = `
                        <h2> ${file.name}</h2>
                        <form class="comment-form" data-pdf-id="${file.id}" data-pdf-name="${file.name}">
                            <textarea class="comment-input" placeholder="برجاء اضافة التأشيرة" rows="4" required></textarea>
                            <button type="submit">توقيع</button>
                        </form>
                        <div class="comments-section">
                            <h3>التأشيرات المقترحة</h3>
                            <div class="comments-container" data-pdf-id="${file.id}">
                                <p class="loading-comments">جاري تحميل التأشيرات المقترحة</p>
                            </div>
                        </div>
                    `;

                    pdfContainer.appendChild(pdfViewer);
                    pdfContainer.appendChild(commentSection);

                    // Load existing comments
                    const commentsContainer = commentSection.querySelector('.comments-container');
                    const comments = await fetchComments(file.id);
                    renderComments(comments, commentsContainer);
                }
            }

            // Add event listeners for comment forms
            document.querySelectorAll('.comment-form').forEach(form => {
                form.addEventListener('submit', function (event) {
                    event.preventDefault();
                    
                    const formData = {
                        pdfId: this.getAttribute('data-pdf-id'),
                        pdfName: this.getAttribute('data-pdf-name'),
                        comment: this.querySelector('.comment-input').value.trim()
                    };

                    if (formData.comment) {
                        submitComment(formData);
                    }
                });
            });

            // Update time every minute
            setInterval(updateCurrentTime, 60000);
        })
        .catch(error => {
            console.error('Error fetching PDFs:', error);
        });
});
