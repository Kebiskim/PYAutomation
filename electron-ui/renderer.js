// Don't use require here - we use the exposed API from preload instead

document.addEventListener('DOMContentLoaded', () => {
    console.log("Renderer script loaded");
    
    document.getElementById('runAutomation').addEventListener('click', () => {
        console.log("Run automation button clicked");
        
        // Get all keyword inputs
        const keywordInputs = document.querySelectorAll('.keyword-input');
        const keywords = [];
        
        // Collect non-empty keywords
        keywordInputs.forEach(input => {
            const keyword = input.value.trim();
            if (keyword) {
                keywords.push(keyword);
            }
        });
        
        // Check if we have at least one keyword
        if (keywords.length === 0) {
            document.getElementById('error-message').style.display = 'block';
            return;
        } else {
            document.getElementById('error-message').style.display = 'none';
        }
        
        // Update status
        document.getElementById('status').textContent = '상태: 작업 중...';
        
        console.log("Keywords to search:", keywords);
        
        // Send the keywords to the main process
        window.electron.send('run-automation', keywords);
    });
    
    // Listen for status updates from the main process
    window.electron.receive('update-status', (message) => {
        console.log("Status update received:", message);
        document.getElementById('status').textContent = '상태: ' + message;
    });
    
    console.log("Event listeners attached");
});