document.getElementById('comment-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    
    if (commentText !== "") {
        const commentsContainer = document.getElementById('comments-container');
        
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');
        commentElement.textContent = commentText;
        
        commentsContainer.appendChild(commentElement);
        
        commentInput.value = "";
    }
});