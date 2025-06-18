import { showStyleModal } from './src/Modal.js';

// Demo function to test the enhanced modal with TextEditor
async function testEnhancedModal() {
    const result = await showStyleModal(
        "Test Node",
        "#ffffff",
        "<p>This is <strong>existing content</strong> with <em>formatting</em>!</p><ul><li>Item 1</li><li>Item 2</li></ul>",
        "https://via.placeholder.com/150",
        "rectangle"
    );
    
    if (result) {
        console.log('Modal result:', result);
        alert(`Updated node:\nText: ${result.text}\nDescription: ${result.description}\nBackground: ${result.background}\nImage: ${result.imageUrl}\nShape: ${result.shape}`);
    } else {
        console.log('Modal was cancelled');
    }
}

// Add a button to test the modal
document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button');
    button.textContent = 'Test Enhanced Modal with TextEditor';
    button.style.padding = '12px 24px';
    button.style.fontSize = '16px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.style.margin = '20px';
    
    button.addEventListener('click', testEnhancedModal);
    document.body.appendChild(button);
    
    // Add some styling to the page
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    document.body.style.backgroundColor = '#f8f9fa';
    document.body.style.padding = '20px';
    
    const title = document.createElement('h1');
    title.textContent = 'Enhanced Modal with TextEditor Integration';
    title.style.color = '#2d3436';
    document.body.insertBefore(title, button);
    
    const description = document.createElement('p');
    description.innerHTML = 'Click the button below to test the enhanced modal that now includes a rich text editor for node descriptions. The editor supports:<br><br>• <strong>Bold</strong>, <em>italic</em>, and <u>underlined</u> text<br>• Bulleted and numbered lists<br>• Text alignment options<br>• Link insertion<br>• Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)';
    description.style.color = '#636e72';
    description.style.lineHeight = '1.6';
    description.style.maxWidth = '600px';
    document.body.insertBefore(description, button);
});

export { testEnhancedModal };
