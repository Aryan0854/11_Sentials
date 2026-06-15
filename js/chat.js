// Chat interface module
export function initChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');

    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            initChatWindow();
        }
    });

    function initChatWindow() {
        chatWindow.innerHTML = `
            <div class="p-4 border-b">
                <h3 class="text-lg font-medium">Cloud Guardian Assistant</h3>
            </div>
            <iframe src="https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/02/01/21/20250201215549-JMCB6H37.json" 
                width="100%" height="400px" frameborder="0"></iframe>
        `;
    }
}
