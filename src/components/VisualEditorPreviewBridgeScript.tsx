const visualEditorPreviewBridgeScript = String.raw`
(() => {
  if (window.__vessel303VisualPreviewBridgeReady) return;
  if (window.parent === window) return;
  if (new URLSearchParams(window.location.search).get('visualDraft') !== '1') return;

  window.__vessel303VisualPreviewBridgeReady = true;

  const STYLE_ID = 'vessel303-visual-editor-hotspots';
  const LABEL_ID = 'vessel303-visual-editor-hover-label';
  const HOVER_ATTR = 'data-vessel303-visual-hover';
  const EDITABLE_SELECTOR = '[data-cms-edit-url],[data-page-module-field],[data-page-module-item],[data-page-module]';
  const INTERACTION_SELECTOR = '[data-visual-open-panel]';
  const MEDIA_EDITABLE_FIELDS = new Set(['image_url', 'video_url', 'video_poster_url']);

  function getClickElement(target) {
    if (target instanceof Element) return target;
    return target && target.parentElement ? target.parentElement : null;
  }

  function fieldLabel(field) {
    const labels = {
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
    };
    return labels[field] || '可编辑内容';
  }

  function visibleTextForSelection(target, fieldEl) {
    const source = fieldEl || target;
    if (!source) return null;
    if (source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement) return source.value.trim() || null;
    if (source instanceof HTMLImageElement) return source.alt.trim() || source.src || null;
    const text = source.textContent ? source.textContent.replace(/\s+/g, ' ').trim() : '';
    return text || source.getAttribute('aria-label') || source.getAttribute('title');
  }

  function cmsEditKindLabel(element) {
    const input = element.dataset.cmsEditInput;
    const field = ((element.dataset.cmsEditField || '') + ' ' + (element.dataset.cmsEditPatchKey || '')).toLowerCase();
    if (input === 'image') return '图片';
    if (input === 'select') return '选项';
    if (input === 'number') return '数字';
    if (input === 'textarea') return '正文';
    if (field.includes('href') || field.includes('url') || field.includes('link') || field.includes('链接')) return '链接';
    return '文字';
  }

  function hotspotLabelForElement(element) {
    if (element.dataset.cmsEditUrl) return '编辑' + cmsEditKindLabel(element) + '：' + (element.dataset.cmsEditField || element.dataset.cmsEditTitle || '内容');
    if (element.dataset.pageModuleField) return '编辑：' + fieldLabel(element.dataset.pageModuleField);
    if (element.dataset.pageModuleItem) return '选择这条内容';
    if (element.dataset.pageModule) return '选择模块';
    return '选择内容';
  }

  function clearHoverHotspots() {
    document.querySelectorAll('[' + HOVER_ATTR + '="true"]').forEach((element) => {
      element.removeAttribute(HOVER_ATTR);
    });
  }

  function syncHoverHotspot(element) {
    clearHoverHotspots();
    if (!element || element.dataset.vessel303VisualSelected === 'true') return;
    element.setAttribute(HOVER_ATTR, 'true');
  }

  function hideHoverLabel() {
    const label = document.getElementById(LABEL_ID);
    if (label) label.style.display = 'none';
    clearHoverHotspots();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = ''
      + '[data-cms-edit-url],[data-page-module-field],[data-page-module-item],[data-page-module]{cursor:pointer!important;}'
      + '[data-cms-edit-url],[data-page-module-field],[data-page-module-item],[data-page-module]{transition:outline-color 120ms ease,box-shadow 120ms ease,background-color 120ms ease;}'
      + '[data-vessel303-visual-hover="true"]{outline:2px solid #1889B6!important;outline-offset:2px!important;box-shadow:0 0 0 4px rgba(24,137,182,.14)!important;background-color:rgba(240,247,248,.24)!important;}'
      + '[data-vessel303-visual-selected="true"]{outline:3px solid #E36F2C!important;outline-offset:3px!important;box-shadow:0 0 0 6px rgba(227,111,44,.18)!important;background-color:rgba(255,247,241,.28)!important;}'
      + '#' + LABEL_ID + '{position:fixed;z-index:2147483647;display:none;max-width:min(260px,calc(100vw - 24px));pointer-events:none;border:1px solid rgba(227,111,44,.28);border-radius:6px;background:rgba(255,255,255,.97);box-shadow:0 8px 24px rgba(36,31,27,.12);color:#2C2A28;font:700 12px/1.2 Arial,sans-serif;padding:7px 9px;white-space:nowrap;}';
    document.head.appendChild(style);
  }

  function ensureLabel() {
    let label = document.getElementById(LABEL_ID);
    if (label) return label;
    label = document.createElement('div');
    label.id = LABEL_ID;
    document.body.appendChild(label);
    return label;
  }

  function editableCandidateRank(element) {
    const field = element.dataset.pageModuleField;
    if (!field) return 1;
    return MEDIA_EDITABLE_FIELDS.has(field) ? 2 : 0;
  }

  function editableCandidateArea(element) {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  function compareEditableCandidates(a, b) {
    const rankDiff = editableCandidateRank(a) - editableCandidateRank(b);
    if (rankDiff !== 0) return rankDiff;
    return editableCandidateArea(a) - editableCandidateArea(b);
  }

  function closestElementFromPoint(event, selector) {
    const matches = [];
    if (typeof document.elementsFromPoint === 'function') {
      for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
        const match = element.closest(selector);
        if (match instanceof HTMLElement && !matches.includes(match)) matches.push(match);
      }
    }

    const fallbackRoot = getClickElement(event.target)?.closest('[data-page-module]') || null;
    if (fallbackRoot) {
      for (const candidate of Array.from(fallbackRoot.querySelectorAll(selector))) {
        const rect = candidate.getBoundingClientRect();
        if (
          rect.width > 0
          && rect.height > 0
          && event.clientX >= rect.left
          && event.clientX <= rect.right
          && event.clientY >= rect.top
          && event.clientY <= rect.bottom
          && !matches.includes(candidate)
        ) {
          matches.push(candidate);
        }
      }
    }

    if (matches.length === 0) return null;
    matches.sort(compareEditableCandidates);
    return matches[0];
  }

  function closestModuleElementFromPoint(event) {
    if (typeof document.elementsFromPoint !== 'function') return null;
    for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
      const match = element.closest('[data-page-module]');
      if (match instanceof HTMLElement) return match;
    }
    return null;
  }

  function closestEditableHotspot(target) {
    const element = getClickElement(target);
    return element ? element.closest(EDITABLE_SELECTOR) : null;
  }

  function closestEditableHotspotFromEvent(event) {
    return closestElementFromPoint(event, EDITABLE_SELECTOR) || closestEditableHotspot(event.target);
  }

  function closestPreviewNavigationTarget(target) {
    const element = getClickElement(target);
    return element ? element.closest('a[href],button,[role="button"],summary,input[type="submit"],input[type="button"]') : null;
  }

  function closestVisualInteractionTarget(target) {
    const element = getClickElement(target);
    return element ? element.closest(INTERACTION_SELECTOR) : null;
  }

  function closestEditableBeforeBoundary(target, boundary) {
    let element = getClickElement(target);
    while (element instanceof HTMLElement) {
      if (element.matches(EDITABLE_SELECTOR)) return element;
      if (element === boundary) break;
      element = element.parentElement;
    }
    return null;
  }

  function isFormControl(element) {
    const tagName = element ? element.tagName.toLowerCase() : '';
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }

  function isActionControl(element) {
    const tagName = element ? element.tagName.toLowerCase() : '';
    return isFormControl(element) || tagName === 'a' || tagName === 'button' || tagName === 'summary' || (element && element.getAttribute('role') === 'button');
  }

  function shouldAllowInteraction(target) {
    const interactionTarget = closestVisualInteractionTarget(target);
    if (!interactionTarget) return false;
    if (closestEditableBeforeBoundary(target, interactionTarget)) return false;
    if (interactionTarget.querySelector(EDITABLE_SELECTOR)) return false;
    if (isFormControl(getClickElement(target))) return true;
    if (isActionControl(interactionTarget)) return true;
    return true;
  }

  function shouldAllowSubmit(event) {
    const target = getClickElement(event.target);
    if (target instanceof HTMLElement && target.matches(INTERACTION_SELECTOR)) return true;
    return shouldAllowInteraction(event.submitter);
  }

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    hideHoverLabel();
  }

  let lastSelectionSignature = '';
  let lastSelectionSentAt = 0;

  function shouldSkipDuplicateSelection(payload) {
    const signature = JSON.stringify(payload);
    const now = Date.now();
    if (signature === lastSelectionSignature && now - lastSelectionSentAt < 250) return true;
    lastSelectionSignature = signature;
    lastSelectionSentAt = now;
    return false;
  }

  function sendSelection(message) {
    const payload = { type: 'vessel303:visual-editor-select', ...message };
    if (shouldSkipDuplicateSelection(payload)) return;
    try {
      if (typeof window.parent.__vessel303VisualEditorSelectFromPreview === 'function') {
        window.parent.__vessel303VisualEditorSelectFromPreview(payload);
        return;
      }
    } catch {
      // Fall back to postMessage when parent access is not available.
    }
    window.parent.postMessage(payload, '*');
  }

  function handleMove(event) {
    const hotspot = closestEditableHotspotFromEvent(event);
    if (!hotspot) {
      hideHoverLabel();
      return;
    }
    syncHoverHotspot(hotspot);
    const label = ensureLabel();
    label.textContent = hotspotLabelForElement(hotspot);
    label.style.display = 'block';
    label.style.left = Math.min(event.clientX + 12, window.innerWidth - label.offsetWidth - 12) + 'px';
    label.style.top = Math.min(event.clientY + 12, window.innerHeight - label.offsetHeight - 12) + 'px';
  }

  function handleClick(event) {
    const target = getClickElement(event.target);
    if (shouldAllowInteraction(event.target)) return;

    const itemEl = (target && target.closest('[data-page-module-item]')) || closestElementFromPoint(event, '[data-page-module-item]');
    const fieldEl = (target && target.closest('[data-page-module-field]')) || closestElementFromPoint(event, '[data-page-module-field]');
    const editEl = (target && target.closest('[data-cms-edit-url]')) || closestElementFromPoint(event, '[data-cms-edit-url]');
    const moduleEl = (target && target.closest('[data-page-module]')) || closestModuleElementFromPoint(event);
    const moduleFieldTarget = fieldEl || itemEl;
    const preferPageModule = Boolean(
      moduleEl
      && editEl
      && moduleFieldTarget
      && moduleFieldTarget !== editEl
      && editEl.contains(moduleFieldTarget)
      && !moduleFieldTarget.dataset.cmsEditUrl
    );

    if (editEl && editEl.dataset.cmsEditUrl && !preferPageModule) {
      stopEvent(event);
      const editInput = editEl.dataset.cmsEditInput || null;
      const editValue = editEl.dataset.cmsEditValue || (editInput === 'image' ? '' : null);
      sendSelection({
        moduleId: moduleEl ? moduleEl.dataset.pageModule || null : null,
        itemId: null,
        field: null,
        text: editInput === 'image' ? editValue : (editValue || visibleTextForSelection(target, editEl)),
        editKind: editEl.dataset.cmsEditKind || null,
        editTitle: editEl.dataset.cmsEditTitle || null,
        editField: editEl.dataset.cmsEditField || null,
        editUrl: editEl.dataset.cmsEditUrl,
        editTargetId: editEl.dataset.cmsEditId || null,
        editApiUrl: editEl.dataset.cmsEditApiUrl || null,
        editPatchKey: editEl.dataset.cmsEditPatchKey || null,
        editObjectKey: editEl.dataset.cmsEditObjectKey || null,
        editObjectPath: editEl.dataset.cmsEditObjectPath || null,
        editInput,
        editMaxLength: editEl.dataset.cmsEditMaxLength || null,
        editArrayIndex: editEl.dataset.cmsEditArrayIndex || null,
        editArrayMode: editEl.dataset.cmsEditArrayMode || null,
        editRequired: editEl.dataset.cmsEditRequired || null,
        editNullable: editEl.dataset.cmsEditNullable || null,
        editValue,
        editOptions: editEl.dataset.cmsEditOptions || null,
        editDisplaySuffix: editEl.dataset.cmsEditDisplaySuffix || null,
      });
      return;
    }

    if (!moduleEl) {
      if (closestPreviewNavigationTarget(event.target)) {
        stopEvent(event);
      }
      return;
    }

    stopEvent(event);
    sendSelection({
      moduleId: moduleEl.dataset.pageModule || null,
      itemId: itemEl ? itemEl.dataset.pageModuleItem || null : null,
      field: fieldEl ? fieldEl.dataset.pageModuleField || null : (itemEl ? itemEl.dataset.pageModuleField || null : null),
      text: visibleTextForSelection(target, fieldEl),
    });
  }

  function handleSubmit(event) {
    if (shouldAllowSubmit(event)) return;
    stopEvent(event);
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (shouldAllowInteraction(event.target)) return;
    if (!closestEditableHotspot(event.target) && !closestPreviewNavigationTarget(event.target)) return;
    stopEvent(event);
  }

  ensureStyle();
  ensureLabel();
  document.addEventListener('mousemove', handleMove, true);
  document.addEventListener('mouseleave', hideHoverLabel, true);
  document.addEventListener('pointerdown', handleClick, true);
  document.addEventListener('mousedown', handleClick, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('keydown', handleKeyDown, true);
})();
`

export default function VisualEditorPreviewBridgeScript() {
  return (
    <script
      id="vessel303-visual-editor-preview-bridge-script"
      dangerouslySetInnerHTML={{ __html: visualEditorPreviewBridgeScript }}
    />
  )
}
