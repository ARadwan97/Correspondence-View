document.addEventListener("DOMContentLoaded", function () {
    const pdfContainer = document.getElementById("pdf-container");
    const googleDriveFolderId = "1Rhzwhk8XdhjBEOjv3r8QvrIWtW-SrtzM";
    const apiKey = "AIzaSyAVpu1eoWrW5HQPXjree3E24KtTqd1Za-w";
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

    // Comment queue system
    const commentQueue = {
        queue: [],
        processing: false,
        retryDelay: 1000, // Start with 1 second delay
        maxRetries: 3,

        add: function(formData) {
            this.queue.push({
                data: formData,
                retries: 0
            });
            if (!this.processing) {
                this.processNext();
            }
        },

        processNext: async function() {
            if (this.queue.length === 0) {
                this.processing = false;
                return;
            }

            this.processing = true;
            const item = this.queue[0];

            try {
                await this.submitComment(item.data);
                this.queue.shift(); // Remove successfully processed item
                this.retryDelay = 1000; // Reset delay after success
            } catch (error) {
                console.error('Error processing comment:', error);
                item.retries++;
                
                if (item.retries >= this.maxRetries) {
                    this.queue.shift(); // Remove failed item after max retries
                    showError(`Failed to save comment after ${this.maxRetries} attempts`);
                } else {
                    this.retryDelay *= 2; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }

            this.processNext();
        },

        submitComment: async function(formData) {
            const startTime = performance.now();
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(formData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const executionTime = performance.now() - startTime;
                console.log(`Comment submission took ${executionTime}ms`);

                if (data.result === 'success') {
                    showSuccess(formData.pdfId);
                } else {
                    throw new Error(data.error || 'Unknown error occurred');
                }
            } catch (error) {
                throw error;
            }
        }
    };

    function showSuccess(pdfId) {
        const form = document.querySelector(`form[data-pdf-id="${pdfId}"]`);
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Comment saved successfully!';
        form.appendChild(successMsg);
        form.querySelector('.comment-input').value = '';
        setTimeout(() => successMsg.remove(), 3000);
    }

    function showError(message) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 5000);
    }

    // Optimized PDF viewer creation
    async function createPDFViewers(files) {
        const fragment = document.createDocumentFragment();
        
        for (const file of files) {
            if (file.mimeType === "application/pdf") {
                const container = document.createElement('div');
                container.className = 'pdf-container';
                
                // Create viewer with loading state
                container.innerHTML = `
                    <div class="pdf-viewer">
                        <div class="loading">Loading PDF...</div>
                        <iframe 
                            src="https://docs.google.com/gview?url=https://drive.google.com/uc?export=download%26id=${file.id}&embedded=true" 
                            width="600" 
                            height="800"
                            onload="this.previousElementSibling.style.display='none'"
                        ></iframe>
                    </div>
                    <div class="comment-section">
                        <h2>Comments for ${file.name}</h2>
                        <form class="comment-form" data-pdf-id="${file.id}" data-pdf-name="${file.name}">
                            <textarea class="comment-input" placeholder="Add a comment..." rows="4" required></textarea>
                            <button type="submit">Submit Comment</button>
                        </form>
                        <div class="comments-container" data-pdf-id="${file.id}"></div>
                    </div>
                `;

                fragment.appendChild(container);
            }
        }

        pdfContainer.appendChild(fragment);
    }

    // Fetch PDFs with retry mechanism
    async function fetchPDFs(retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q='${googleDriveFolderId}'+in+parents&key=${apiKey}`
                );
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                await createPDFViewers(data.files);
                
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
                            commentQueue.add(formData);
                        }
                    });
                });

                return;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // Initialize the application
    fetchPDFs().catch(error => {
        console.error('Failed to fetch PDFs:', error);
        showError('Failed to load PDFs. Please refresh the page.');
    });
});
