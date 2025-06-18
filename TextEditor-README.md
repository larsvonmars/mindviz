# TextEditor Component

The `TextEditor` component is a rich text editor designed for creating and editing formatted descriptions in mind map nodes. It provides a user-friendly interface with formatting tools and supports HTML output.

## Features

- **Rich Text Formatting**: Bold, italic, underline text
- **Lists**: Create bulleted and numbered lists
- **Text Alignment**: Left, center, right alignment options
- **Hyperlinks**: Insert and edit links with URL prompts
- **Keyboard Shortcuts**: 
  - `Ctrl+B` or `Cmd+B` for bold
  - `Ctrl+I` or `Cmd+I` for italic
  - `Ctrl+U` or `Cmd+U` for underline
- **Clean Paste**: Automatically strips unwanted formatting when pasting content
- **Placeholder Support**: Shows helpful placeholder text when editor is empty
- **HTML Output**: Generates clean, semantic HTML for storage and rendering
- **Real-time Updates**: Optional onChange callback for real-time content monitoring

## Usage

### Basic Usage

```typescript
import { TextEditor } from 'mindviz';

// Create a basic text editor
const editor = new TextEditor({
    placeholder: "Enter your description here...",
    initialValue: "<p>Some initial content</p>",
    maxHeight: "200px"
});

// Add to DOM
document.getElementById('container').appendChild(editor.getElement());
```

### With Change Callback

```typescript
const editor = new TextEditor({
    placeholder: "Start typing...",
    onChange: (content) => {
        console.log('Content updated:', content);
        // Handle real-time updates
    }
});
```

### Using the Helper Function

```typescript
import { createTextEditor } from 'mindviz';

const editor = createTextEditor({
    placeholder: "Enter description...",
    maxHeight: "300px"
});
```

## API Reference

### Constructor Options

```typescript
interface TextEditorOptions {
    placeholder?: string;     // Placeholder text when empty
    initialValue?: string;    // Initial HTML content
    maxHeight?: string;       // Maximum height (CSS value)
    onChange?: (content: string) => void; // Change callback
}
```

### Methods

#### `getContent(): string`
Returns the current HTML content of the editor.

```typescript
const htmlContent = editor.getContent();
```

#### `setContent(content: string): void`
Sets the HTML content of the editor.

```typescript
editor.setContent("<p><strong>Bold text</strong></p>");
```

#### `getTextContent(): string`
Returns the plain text content (without HTML tags).

```typescript
const plainText = editor.getTextContent();
```

#### `focus(): void`
Focuses the editor for user input.

```typescript
editor.focus();
```

#### `getElement(): HTMLDivElement`
Returns the root DOM element of the editor.

```typescript
const editorElement = editor.getElement();
document.body.appendChild(editorElement);
```

#### `onChange(callback: (content: string) => void): void`
Sets or updates the change callback.

```typescript
editor.onChange((content) => {
    console.log('New content:', content);
});
```

#### `destroy(): void`
Removes the editor from the DOM and cleans up resources.

```typescript
editor.destroy();
```

## Integration with Mind Map Modals

The TextEditor is automatically integrated into the node editing modal (`showStyleModal`). When editing a node's description, users can:

1. Format text with the toolbar buttons
2. Use keyboard shortcuts for quick formatting
3. Create lists and align text
4. Insert hyperlinks
5. Paste content that gets automatically cleaned

```typescript
import { showStyleModal } from 'mindviz';

const result = await showStyleModal(
    "Node Title",
    "#ffffff",
    "<p>Existing <strong>formatted</strong> description</p>",
    "image-url.jpg",
    "rectangle"
);

if (result) {
    console.log('Updated description:', result.description);
    // result.description contains the HTML from the TextEditor
}
```

## Styling and Customization

The TextEditor uses CSS custom properties for theming:

```css
:root {
    --mm-primary: #4dabf7;
    --mm-text: #495057;
    --mm-border: #e9ecef;
    --mm-bg: #ffffff;
}
```

### Custom Styling

You can also apply custom styles directly to the editor element:

```typescript
const editor = new TextEditor();
const editorElement = editor.getElement();

// Customize appearance
editorElement.style.border = '2px solid #007bff';
editorElement.style.borderRadius = '12px';
```

## Toolbar Buttons

The editor includes the following toolbar sections:

### Formatting
- **Bold** (B): Toggle bold formatting
- **Italic** (I): Toggle italic formatting  
- **Underline** (U): Toggle underline formatting

### Lists
- **Bullet List** (•): Create unordered list
- **Numbered List** (1.): Create ordered list

### Alignment
- **Align Left** (≡): Left-align text
- **Align Center** (≣): Center-align text
- **Align Right** (≡): Right-align text

### Content
- **Insert Link** (🔗): Insert hyperlink with URL prompt
- **Clear Formatting** (×): Remove all formatting from selected text

## Browser Compatibility

The TextEditor uses modern web APIs and is compatible with:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

For older browsers, consider including polyfills for `contentEditable` and `document.execCommand`.

## Examples

### Minimal Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>TextEditor Example</title>
</head>
<body>
    <div id="editor-container"></div>
    
    <script type="module">
        import { TextEditor } from './path/to/mindviz.js';
        
        const editor = new TextEditor({
            placeholder: "Start writing..."
        });
        
        document.getElementById('editor-container')
            .appendChild(editor.getElement());
    </script>
</body>
</html>
```

### With Form Integration

```typescript
const form = document.getElementById('myForm');
const editor = new TextEditor({
    placeholder: "Enter description...",
    onChange: (content) => {
        // Update hidden form field
        document.getElementById('descriptionField').value = content;
    }
});

form.addEventListener('submit', (e) => {
    const description = editor.getContent();
    // Process form with rich text description
});
```

## Accessibility

The TextEditor includes accessibility features:

- Proper ARIA roles and attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML output

## Performance

The editor is optimized for performance with:

- Efficient DOM manipulation
- Debounced change events
- Lazy loading of formatting states
- Memory leak prevention through proper cleanup
