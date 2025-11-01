import React, { useRef } from "react";

interface FilteredTextInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export const FilteredTextInput: React.FC<FilteredTextInputProps> = ({ onSend, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const processText = () => {
    let result = "";
    const editor = editorRef.current;

    if (!editor) {
      console.warn("Editor not found");
      return;
    }

    const processNode = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const font = window.getComputedStyle(node.parentElement || editor).fontFamily;
        if (!/courier new/i.test(font)) {
          result += node.textContent || "";
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const font = window.getComputedStyle(node as HTMLElement).fontFamily;
        if (/courier new/i.test(font)) return;
        node.childNodes.forEach(processNode);
      }
    };

    editor.childNodes.forEach(processNode);

    const filtered = result.trim();
    if (filtered) {
      onSend(filtered);
    }

    // Clear the editor after sending
    if (editor) {
      editor.innerHTML = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Send on Enter, but allow new lines with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processText();
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "10px", backgroundColor: "#fff" }}>
      <div style={{ color: '#888', fontSize: '0.8em', marginBottom: '4px' }}>Send with Enter, new line with Shift+Enter. Text in Courier New is ignored.</div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        style={{
          minHeight: "80px",
          outline: "none",
          overflowY: "auto",
          opacity: disabled ? 0.5 : 1,
        }}
        onKeyDown={handleKeyDown}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          onClick={processText}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};