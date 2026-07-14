import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, List, ListOrdered, CheckSquare, 
  Heading1, Heading2, Quote, Undo, Redo, 
  Link as LinkIcon, Image as ImageIcon,
  Type, Code, MessageSquare
} from 'lucide-react';

interface DocumentEditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ 
  content, 
  onChange, 
  editable = true,
  placeholder = 'Start typing or use / for commands...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const MenuBar = () => {
    if (!editable) return null;

    return (
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 1 }) ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 2 }) ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bulletList') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('orderedList') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('taskList') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('blockquote') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('codeBlock') ? 'bg-white/20 text-white' : 'text-gray-400'}`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="document-editor border border-white/10 rounded-xl overflow-hidden bg-[#0A0A0A]">
      <MenuBar />
      <div className="p-4 min-h-[400px] prose prose-invert max-w-none prose-sm sm:prose-base">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
        .mention {
          background-color: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          padding: 0 4px;
          border-radius: 4px;
          font-weight: 500;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          user-select: none;
          margin-top: 4px;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer;
          accent-color: #6366f1;
        }
      `}</style>
    </div>
  );
};
