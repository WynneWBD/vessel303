'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    __vessel303VisualPreviewBridgeReady?: boolean
    __vessel303VisualPreviewHydrated?: boolean
    __vessel303VisualEditorSelectFromPreview?: (data: unknown) => void
  }
}

const VISUAL_EDITOR_STYLE_ID = 'vessel303-visual-editor-hotspots'
const VISUAL_EDITOR_LABEL_ID = 'vessel303-visual-editor-hover-label'
const VISUAL_EDITOR_HOVER_ATTR = 'data-vessel303-visual-hover'
const EDITABLE_HOTSPOT_SELECTOR = '[data-cms-edit-url],[data-page-module-field],[data-page-module-item],[data-page-module]'
const VISUAL_INTERACTION_SELECTOR = '[data-visual-open-panel]'
const MEDIA_EDITABLE_FIELDS = new Set(['image_url', 'video_url', 'video_poster_url'])

type VisualEditorSelectionMessage = {
  type: 'vessel303:visual-editor-select'
  moduleId: string | null
  itemId: string | null
  field: string | null
  text: string | null
  editKind?: string | null
  editTitle?: string | null
  editField?: string | null
  editUrl?: string | null
  editTargetId?: string | null
  editApiUrl?: string | null
  editPatchKey?: string | null
  editObjectKey?: string | null
  editObjectPath?: string | null
  editInput?: string | null
  editMaxLength?: string | null
  editArrayIndex?: string | null
  editArrayMode?: string | null
  editRequired?: string | null
  editNullable?: string | null
  editValue?: string | null
  editOptions?: string | null
  editDisplaySuffix?: string | null
}

function getClickElement(target: EventTarget | null) {
  if (target instanceof Element) return target
  const node = target as { parentElement?: Element | null } | null
  return node?.parentElement ?? null
}

function visibleTextForSelection(target: Element | null, fieldEl: HTMLElement | null) {
  const source = fieldEl ?? target
  if (!source) return null
  if (source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement) return source.value.trim() || null
  if (source instanceof HTMLImageElement) return source.alt.trim() || source.src || null

  const text = source.textContent?.replace(/\s+/g, ' ').trim()
  if (text) return text
  return source.getAttribute('aria-label') ?? source.getAttribute('title')
}

function cmsEditKindLabel(element: HTMLElement) {
  const input = element.dataset.cmsEditInput
  const field = `${element.dataset.cmsEditField ?? ''} ${element.dataset.cmsEditPatchKey ?? ''}`.toLowerCase()

  if (input === 'image') return '图片'
  if (input === 'select') return '选项'
  if (input === 'number') return '数字'
  if (input === 'textarea') return '正文'
  if (field.includes('href') || field.includes('url') || field.includes('link') || field.includes('链接')) return '链接'
  return '文字'
}

function hotspotLabelForElement(element: HTMLElement) {
  if (element.dataset.cmsEditUrl) {
    return `编辑${cmsEditKindLabel(element)}：${element.dataset.cmsEditField || element.dataset.cmsEditTitle || '内容'}`
  }
  if (element.dataset.pageModuleField) {
    return `编辑：${fieldLabel(element.dataset.pageModuleField)}`
  }
  if (element.dataset.pageModuleItem) return '选择这条内容'
  if (element.dataset.pageModule) return '选择模块'
  return '选择内容'
}

function clearHoverHotspots() {
  document.querySelectorAll<HTMLElement>(`[${VISUAL_EDITOR_HOVER_ATTR}="true"]`).forEach((element) => {
    element.removeAttribute(VISUAL_EDITOR_HOVER_ATTR)
  })
}

function syncHoverHotspot(element: HTMLElement | null) {
  clearHoverHotspots()
  if (!element || element.dataset.vessel303VisualSelected === 'true') return
  element.setAttribute(VISUAL_EDITOR_HOVER_ATTR, 'true')
}

function hideHoverLabel() {
  const label = document.getElementById(VISUAL_EDITOR_LABEL_ID)
  if (label) label.style.display = 'none'
  clearHoverHotspots()
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    title_zh: '中文标题',
    title_en: '英文标题',
    description_zh: '中文副文案',
    description_en: '英文副文案',
    label_zh: '中文文字',
    label_en: '英文文字',
    content_zh: '中文正文',
    content_en: '英文正文',
    value_zh: '中文数值',
    value_en: '英文数值',
    image_url: '图片',
    video_url: '视频',
    video_poster_url: '视频封面',
    href: '链接',
  }
  return labels[field] ?? '可编辑内容'
}

function closestEditableHotspot(target: EventTarget | null) {
  const element = getClickElement(target)
  return element?.closest(EDITABLE_HOTSPOT_SELECTOR) as HTMLElement | null
}

function editableCandidateRank(element: HTMLElement) {
  const field = element.dataset.pageModuleField
  if (!field) return 1
  return MEDIA_EDITABLE_FIELDS.has(field) ? 2 : 0
}

function editableCandidateArea(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return rect.width * rect.height
}

function compareEditableCandidates(a: HTMLElement, b: HTMLElement) {
  const rankDiff = editableCandidateRank(a) - editableCandidateRank(b)
  if (rankDiff !== 0) return rankDiff
  return editableCandidateArea(a) - editableCandidateArea(b)
}

function closestElementFromPoint(event: MouseEvent, selector: string) {
  const matches: HTMLElement[] = []
  if (typeof document.elementsFromPoint === 'function') {
    for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
      const match = element.closest(selector)
      if (match instanceof HTMLElement && !matches.includes(match)) matches.push(match)
    }
  }

  const fallbackRoot = getClickElement(event.target)?.closest('[data-page-module]') ?? null
  if (fallbackRoot) {
    for (const candidate of Array.from(fallbackRoot.querySelectorAll<HTMLElement>(selector))) {
      const rect = candidate.getBoundingClientRect()
      if (
        rect.width > 0
        && rect.height > 0
        && event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom
        && !matches.includes(candidate)
      ) {
        matches.push(candidate)
      }
    }
  }

  if (matches.length === 0) return null
  matches.sort(compareEditableCandidates)
  return matches[0]
}

function closestModuleElementFromPoint(event: MouseEvent) {
  if (typeof document.elementsFromPoint !== 'function') return null
  for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
    const match = element.closest('[data-page-module]')
    if (match instanceof HTMLElement) return match
  }
  return null
}

function closestEditableHotspotFromEvent(event: MouseEvent) {
  return closestElementFromPoint(event, EDITABLE_HOTSPOT_SELECTOR) ?? closestEditableHotspot(event.target)
}

function closestPreviewNavigationTarget(target: EventTarget | null) {
  const element = getClickElement(target)
  return element?.closest('a[href],button,[role="button"],summary,input[type="submit"],input[type="button"]') as HTMLElement | null
}

function closestVisualInteractionTarget(target: EventTarget | null) {
  const element = getClickElement(target)
  return element?.closest(VISUAL_INTERACTION_SELECTOR) as HTMLElement | null
}

function closestEditableBeforeBoundary(target: EventTarget | null, boundary: HTMLElement) {
  let element = getClickElement(target)
  while (element && element instanceof HTMLElement) {
    if (element.matches(EDITABLE_HOTSPOT_SELECTOR)) return element
    if (element === boundary) break
    element = element.parentElement
  }
  return null
}

function isVisualFormControl(element: Element | null) {
  const tagName = element?.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

function isVisualActionControl(element: Element | null) {
  const tagName = element?.tagName.toLowerCase()
  return (
    isVisualFormControl(element)
    || tagName === 'a'
    || tagName === 'button'
    || tagName === 'summary'
    || element?.getAttribute('role') === 'button'
  )
}

function shouldAllowVisualInteraction(target: EventTarget | null) {
  const interactionTarget = closestVisualInteractionTarget(target)
  if (!interactionTarget) return false
  const element = getClickElement(target)
  if (closestEditableBeforeBoundary(target, interactionTarget)) return false
  if (interactionTarget.querySelector(EDITABLE_HOTSPOT_SELECTOR)) return false
  if (isVisualFormControl(element)) return true
  if (isVisualActionControl(interactionTarget)) return true
  return true
}

function shouldAllowVisualSubmit(event: SubmitEvent) {
  const target = getClickElement(event.target)
  if (target instanceof HTMLElement && target.matches(VISUAL_INTERACTION_SELECTOR)) return true
  return shouldAllowVisualInteraction(event.submitter)
}

let lastPreviewSelectionSignature = ''
let lastPreviewSelectionAt = 0

function shouldSkipDuplicatePreviewSelection(message: VisualEditorSelectionMessage) {
  const signature = JSON.stringify(message)
  const now = Date.now()
  if (signature === lastPreviewSelectionSignature && now - lastPreviewSelectionAt < 250) return true
  lastPreviewSelectionSignature = signature
  lastPreviewSelectionAt = now
  return false
}

function sendPreviewSelection(message: VisualEditorSelectionMessage) {
  if (shouldSkipDuplicatePreviewSelection(message)) return
  try {
    if (typeof window.parent.__vessel303VisualEditorSelectFromPreview === 'function') {
      window.parent.__vessel303VisualEditorSelectFromPreview(message)
      return
    }
  } catch {
    // Fall back to postMessage when parent access is not available.
  }
  window.parent.postMessage(message, '*')
}

function ensureVisualEditorStyle() {
  if (document.getElementById(VISUAL_EDITOR_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = VISUAL_EDITOR_STYLE_ID
  style.textContent = `
    [data-cms-edit-url],
    [data-page-module-field],
    [data-page-module-item],
    [data-page-module] {
      cursor: pointer !important;
    }

    [data-cms-edit-url],
    [data-page-module-field],
    [data-page-module-item],
    [data-page-module] {
      transition: outline-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
    }

    [data-vessel303-visual-hover="true"] {
      outline: 2px solid #1889B6 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(24, 137, 182, 0.14) !important;
      background-color: rgba(240, 247, 248, 0.24) !important;
    }

    [data-vessel303-visual-selected="true"] {
      outline: 3px solid #E36F2C !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(227, 111, 44, 0.18) !important;
      background-color: rgba(255, 247, 241, 0.28) !important;
    }

    #${VISUAL_EDITOR_LABEL_ID} {
      position: fixed;
      z-index: 2147483647;
      display: none;
      max-width: min(260px, calc(100vw - 24px));
      pointer-events: none;
      border: 1px solid rgba(227, 111, 44, 0.28);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 0 8px 24px rgba(36, 31, 27, 0.12);
      color: #2C2A28;
      font: 700 12px/1.2 Arial, sans-serif;
      padding: 7px 9px;
      white-space: nowrap;
    }
  `
  document.head.appendChild(style)
}

function ensureHoverLabel() {
  let label = document.getElementById(VISUAL_EDITOR_LABEL_ID)
  if (label) return label

  label = document.createElement('div')
  label.id = VISUAL_EDITOR_LABEL_ID
  document.body.appendChild(label)
  return label
}

export default function VisualEditorPreviewBridge() {
  const searchParams = useSearchParams()
  const enabled = searchParams.get('visualDraft') === '1'

  useEffect(() => {
    if (!enabled || window.parent === window) return

    window.__vessel303VisualPreviewHydrated = true
    ensureVisualEditorStyle()
    const label = ensureHoverLabel()

    const moveLabel = (event: MouseEvent) => {
      const hotspot = closestEditableHotspotFromEvent(event)
      if (!hotspot) {
        hideHoverLabel()
        return
      }

      syncHoverHotspot(hotspot)
      label.textContent = hotspotLabelForElement(hotspot)
      label.style.display = 'block'
      label.style.left = `${Math.min(event.clientX + 12, window.innerWidth - label.offsetWidth - 12)}px`
      label.style.top = `${Math.min(event.clientY + 12, window.innerHeight - label.offsetHeight - 12)}px`
    }

    const hideLabel = () => {
      hideHoverLabel()
    }

    document.addEventListener('mousemove', moveLabel, true)
    document.addEventListener('mouseleave', hideLabel, true)

    return () => {
      document.removeEventListener('mousemove', moveLabel, true)
      document.removeEventListener('mouseleave', hideLabel, true)
      clearHoverHotspots()
      delete window.__vessel303VisualPreviewHydrated
      document.getElementById(VISUAL_EDITOR_STYLE_ID)?.remove()
      document.getElementById(VISUAL_EDITOR_LABEL_ID)?.remove()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || window.parent === window) return

    const handleClick = (event: MouseEvent) => {
      const target = getClickElement(event.target)
      if (shouldAllowVisualInteraction(event.target)) return
      const targetItemEl = target?.closest('[data-page-module-item]') as HTMLElement | null
      const targetFieldEl = target?.closest('[data-page-module-field]') as HTMLElement | null
      const targetEditEl = target?.closest('[data-cms-edit-url]') as HTMLElement | null
      const targetModuleEl = target?.closest('[data-page-module]') as HTMLElement | null
      const itemEl = targetItemEl ?? closestElementFromPoint(event, '[data-page-module-item]')
      const fieldEl = targetFieldEl ?? closestElementFromPoint(event, '[data-page-module-field]')
      const editEl = targetEditEl ?? closestElementFromPoint(event, '[data-cms-edit-url]')
      const moduleEl = targetModuleEl ?? closestModuleElementFromPoint(event)
      const moduleFieldTarget = fieldEl ?? itemEl
      const preferPageModule = Boolean(
        moduleEl
        && editEl
        && moduleFieldTarget
        && moduleFieldTarget !== editEl
        && editEl.contains(moduleFieldTarget)
        && !moduleFieldTarget.dataset.cmsEditUrl
      )
      if (editEl?.dataset.cmsEditUrl && !preferPageModule) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        hideHoverLabel()
        const editInput = editEl.dataset.cmsEditInput ?? null
        const editValue = editEl.dataset.cmsEditValue ?? (editInput === 'image' ? '' : null)

        const message: VisualEditorSelectionMessage = {
          type: 'vessel303:visual-editor-select',
          moduleId: moduleEl?.dataset.pageModule ?? null,
          itemId: null,
          field: null,
          text: editInput === 'image' ? editValue : (editValue ?? visibleTextForSelection(target, editEl)),
          editKind: editEl.dataset.cmsEditKind ?? null,
          editTitle: editEl.dataset.cmsEditTitle ?? null,
          editField: editEl.dataset.cmsEditField ?? null,
          editUrl: editEl.dataset.cmsEditUrl,
          editTargetId: editEl.dataset.cmsEditId ?? null,
          editApiUrl: editEl.dataset.cmsEditApiUrl ?? null,
          editPatchKey: editEl.dataset.cmsEditPatchKey ?? null,
          editObjectKey: editEl.dataset.cmsEditObjectKey ?? null,
          editObjectPath: editEl.dataset.cmsEditObjectPath ?? null,
          editInput,
          editMaxLength: editEl.dataset.cmsEditMaxLength ?? null,
          editArrayIndex: editEl.dataset.cmsEditArrayIndex ?? null,
          editArrayMode: editEl.dataset.cmsEditArrayMode ?? null,
          editRequired: editEl.dataset.cmsEditRequired ?? null,
          editNullable: editEl.dataset.cmsEditNullable ?? null,
          editValue,
          editOptions: editEl.dataset.cmsEditOptions ?? null,
          editDisplaySuffix: editEl.dataset.cmsEditDisplaySuffix ?? null,
        }

        sendPreviewSelection(message)
        return
      }

      if (!moduleEl) {
        if (closestPreviewNavigationTarget(event.target)) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          hideHoverLabel()
        }
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      hideHoverLabel()

      const message: VisualEditorSelectionMessage = {
        type: 'vessel303:visual-editor-select',
        moduleId: moduleEl.dataset.pageModule ?? null,
        itemId: itemEl?.dataset.pageModuleItem ?? null,
        field: fieldEl?.dataset.pageModuleField ?? itemEl?.dataset.pageModuleField ?? null,
        text: visibleTextForSelection(target, fieldEl),
      }

      sendPreviewSelection(message)
    }

    const handleSubmit = (event: SubmitEvent) => {
      if (shouldAllowVisualSubmit(event)) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      hideHoverLabel()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (shouldAllowVisualInteraction(event.target)) return
      if (!closestEditableHotspot(event.target) && !closestPreviewNavigationTarget(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      hideHoverLabel()
    }

    document.addEventListener('pointerdown', handleClick, true)
    document.addEventListener('mousedown', handleClick, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('submit', handleSubmit, true)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', handleClick, true)
      document.removeEventListener('mousedown', handleClick, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('submit', handleSubmit, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [enabled])

  return null
}
