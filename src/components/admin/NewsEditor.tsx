'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: JSONContent
  onChange: (json: JSONContent) => void
  placeholder?: string
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-[#E36F2C]/10 text-[#E36F2C]'
          : 'text-[#C4B9AB] hover:text-white hover:bg-[#2A2A2E]',
      )}
    >
      {children}
    </button>
  )
}

export default function NewsEditor({ value, onChange, placeholder }: Props) {
  const [revision, setRevision] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none text-[#F0F0F0]',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON())
      setRevision((n) => n + 1)
    },
    onCreate() {
      setRevision((n) => n + 1)
    },
  })

  // Sync when parent switches tabs (value reference changes but editor still holds old content)
  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(value)
    if (current !== next) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!editor) return null

  const handleLink = () => {
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('输入链接 URL', prev)
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url.trim() }).run()
    }
  }

  const sep = <div className="w-px h-5 bg-[#2A2A2E] mx-1 self-center" />
  const showPlaceholder = placeholder && editor.isEmpty && revision >= 0

  return (
    <div className="border border-[#2A2A2E] rounded-lg focus-within:border-[#E36F2C] overflow-hidden transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#2A2A2E] px-2 py-1.5 bg-[#141414]">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Strike"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        {sep}
        <ToolbarButton
          title="H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>
        {sep}
        <ToolbarButton
          title="Bullet List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Ordered List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        {sep}
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={handleLink}>
          <Link2 size={16} />
        </ToolbarButton>
        {sep}
        <ToolbarButton
          title="Undo"
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <div className="relative bg-[#0F0F0F]">
        {showPlaceholder && (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-[#6B6560]">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
