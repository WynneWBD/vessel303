import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'
import ts from 'typescript'

// Run: node scripts/test-global-map-loading.mjs
// Executes real component code with controlled hooks, browser tasks and imports.
// No browser, network, database, build output or production files are modified.
const sourceFile = fileURLToPath(new URL('../src/components/GlobalMapView.tsx', import.meta.url))
const dataModule = '@/data/showcaseProjects'
const detailModule = './ProjectDetail'
const markers = [
  { id: 'astrobase-mamison', name: { en: 'Mamison', zh: 'Mamison' }, coordinates: [42, 44] },
  { id: 'test-second-camp', name: { en: 'Second camp', zh: 'Second camp' }, coordinates: [30, 40] },
]
const projects = markers.map((marker) => ({ ...marker }))
const cmsProject = { id: 'test-cms-camp', name: { en: 'CMS camp', zh: 'CMS camp' }, coordinates: [20, 30] }

const compiled = ts.transpileModule(readFileSync(sourceFile, 'utf8'), {
  fileName: sourceFile,
  reportDiagnostics: true,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
  transformers: {
    // Stub only the import boundary so each real import can resolve or reject later.
    before: [(context) => (file) => {
      function visit(node) {
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          return context.factory.createCallExpression(
            context.factory.createIdentifier('__importModule'),
            undefined,
            node.arguments,
          )
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(file, visit)
    }],
  },
})
const diagnostics = compiled.diagnostics?.filter((entry) => entry.category === ts.DiagnosticCategory.Error) ?? []
assert.equal(diagnostics.length, 0, diagnostics.map((entry) => ts.flattenDiagnosticMessageText(entry.messageText, '\n')).join('\n'))
const componentScript = new Script(
  `${compiled.outputText}\nmodule.exports.testLoadData = loadShowcaseProjectsModule;`,
  { filename: sourceFile },
)

function createTaskQueue() {
  let nextId = 0
  let cancelled = 0
  const tasks = new Map()
  return {
    tasks,
    get cancelled() { return cancelled },
    schedule(callback, options) {
      const id = ++nextId
      tasks.set(id, { callback, options })
      return id
    },
    cancel(id) {
      if (tasks.delete(id)) cancelled += 1
    },
    run() {
      const pending = [...tasks.values()]
      tasks.clear()
      for (const task of pending) task.callback()
    },
  }
}

function findElement(node, predicate) {
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = findElement(child, predicate)
      if (result) return result
    }
  } else if (node && typeof node === 'object') {
    if (predicate(node)) return node
    return findElement(node.props?.children, predicate)
  }
  return null
}

function createHarness({ fallback = false, camp = false, cms = false } = {}) {
  let cursor = 0
  let tree
  let mounted = true
  const slots = []
  const pendingEffects = []
  const requests = []
  const warnings = []
  const idle = createTaskQueue()
  const timers = createTaskQueue()
  const frames = createTaskQueue()
  const props = { cmsProjects: cms ? [cmsProject] : [], pageModules: [] }
  const searchParams = new URLSearchParams(camp ? { camp: markers[0].id } : {})
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const hooks = {
    useState(initial) {
      const index = cursor++
      if (!slots[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial }
        slot.set = (value) => {
          assert.ok(mounted, 'State must not update after unmount')
          slot.value = typeof value === 'function' ? value(slot.value) : value
        }
        slots[index] = slot
      }
      return [slots[index].value, slots[index].set]
    },
    useRef(initial) {
      const index = cursor++
      slots[index] ??= { current: initial }
      return slots[index]
    },
    useMemo(factory, deps) {
      const index = cursor++
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        slots[index] = { value: factory(), deps }
      }
      return slots[index].value
    },
    useCallback(callback, deps) {
      return hooks.useMemo(() => callback, deps)
    },
    useEffect(effect, deps) {
      const index = cursor++
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        pendingEffects.push(() => {
          slots[index]?.cleanup?.()
          slots[index] = { deps, cleanup: effect() }
        })
      }
    },
  }
  const window = {
    setTimeout: (callback, delay) => timers.schedule(callback, delay),
    clearTimeout: (id) => timers.cancel(id),
    location: { href: `https://www.vessel303.com/global?${searchParams}` },
    history: {
      replaceState(_state, _title, url) { window.location.href = String(url) },
    },
  }
  if (!fallback) {
    window.requestIdleCallback = (callback, options) => idle.schedule(callback, options)
    window.cancelIdleCallback = (id) => idle.cancel(id)
  }
  const jsx = (type, elementProps) => ({ type, props: elementProps })
  const commonJsModule = { exports: {} }
  componentScript.runInNewContext({
    module: commonJsModule,
    exports: commonJsModule.exports,
    window,
    URL,
    requestAnimationFrame: (callback) => frames.schedule(callback),
    cancelAnimationFrame: (id) => frames.cancel(id),
    console: { warn: (...args) => warnings.push(args) },
    __importModule(id) {
      assert.ok([dataModule, detailModule].includes(id), `Unexpected dynamic import: ${id}`)
      return new Promise((resolve, reject) => {
        requests.push({ id, resolve, reject, settled: false })
      })
    },
    require(id) {
      switch (id) {
        case 'react': return hooks
        case 'react/jsx-runtime': return { jsx, jsxs: jsx }
        case 'next/dynamic': return (loader) => Object.assign(function Dynamic() {}, { loader })
        case 'next/navigation': return { useSearchParams: () => searchParams }
        case '@/data/showcaseMarkers': return { SHOWCASE_MARKERS: markers }
        case './MapSkeleton': return { default() {} }
        case '@/contexts/LanguageContext': return { useLanguage: () => ({ lang: 'en' }) }
        case '@/lib/global-page-cms': return {
          buildGlobalCmsLabels: () => ({}),
          globalItemAttrs: () => ({}),
          globalModuleAttrs: () => ({}),
        }
        default: throw new Error(`Unexpected require: ${id}`)
      }
    },
  })

  function render() {
    assert.ok(mounted, 'Cannot render an unmounted component')
    cursor = 0
    tree = commonJsModule.exports.default(props)
    while (pendingEffects.length) pendingEffects.shift()()
    return tree
  }
  function mapProps() {
    const map = findElement(tree, (node) => typeof node.props?.onShowcaseSelect === 'function')
    assert.ok(map, 'Map callbacks must remain connected')
    return map.props
  }
  function settleRequest(id, index = 0, error) {
    const request = requests.filter((entry) => entry.id === id)[index]
    assert.ok(request, `Missing import request ${id} #${index + 1}`)
    assert.equal(request.settled, false, 'Import request already settled')
    request.settled = true
    if (error) request.reject(error)
    else request.resolve(id === dataModule ? { SHOWCASE_PROJECTS: projects } : { default() {} })
  }
  return {
    render, mapProps, idle, timers, frames, warnings, requests,
    count: (id) => requests.filter((entry) => entry.id === id).length,
    loadData: commonJsModule.exports.testLoadData,
    ready() { mapProps().onMapReady(); render() },
    select(marker = markers[0]) { mapProps().onShowcaseSelect(marker); render() },
    preview: () => findElement(tree, (node) => Boolean(node.props?.marker)),
    detail: () => findElement(tree, (node) => Boolean(node.props?.project)),
    resolve: (id, index) => settleRequest(id, index),
    reject: (id, index = 0) => settleRequest(id, index, new Error(`Simulated network failure: ${id}`)),
    unmount() {
      if (!mounted) return
      for (const slot of slots) slot?.cleanup?.()
      mounted = false
    },
  }
}

async function flushPromises() {
  // Let promise chains and Node's unhandledRejection reporting finish.
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))
}

function assertPreview(harness, marker = markers[0]) {
  assert.equal(harness.detail(), null, 'Full detail must wait for code AND data')
  const preview = harness.preview()
  assert.ok(preview, 'Camp title preview must remain visible')
  const content = preview.type(preview.props)
  const title = findElement(content, (node) => node.type === 'h2')
  assert.equal(title?.props.children, marker.name.en)
  const close = findElement(content, (node) => node.type === 'button')
  assert.equal(typeof close?.props.onClick, 'function', 'Preview must remain closable')
}

async function finishDetail(harness, expected = markers[0]) {
  await flushPromises()
  harness.render()
  assert.equal(harness.preview(), null)
  assert.equal(harness.detail()?.props.project.id, expected.id)
}

const tests = [
  ['no background preload before map ready', {}, async (h) => {
    h.render()
    h.idle.run()
    h.timers.run()
    await flushPromises()
    assert.equal(h.idle.tasks.size + h.timers.tasks.size, 0)
    assert.equal(h.requests.length, 0)
  }],
  ['map ready schedules one idle preload, not an immediate import', {}, async (h) => {
    h.render()
    h.ready()
    assert.equal(h.idle.tasks.size, 1)
    assert.equal(h.requests.length, 0)
    h.ready()
    assert.equal(h.idle.tasks.size, 1)
    h.idle.run()
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 1)
    h.resolve(dataModule)
    h.resolve(detailModule)
    await flushPromises()
    h.ready()
    assert.equal(h.idle.tasks.size, 0)
    assert.equal(h.requests.length, 2)
  }],
  ['unmount cancels pending requestIdleCallback', {}, async (h) => {
    h.render()
    h.ready()
    h.unmount()
    assert.equal(h.idle.cancelled, 1)
    h.idle.run()
    assert.equal(h.requests.length, 0)
  }],
  ['missing requestIdleCallback uses a delayed timeout after ready', { fallback: true }, async (h) => {
    h.render()
    assert.equal(h.timers.tasks.size, 0)
    h.ready()
    assert.equal(h.idle.tasks.size, 0)
    assert.equal(h.timers.tasks.size, 1)
    assert.ok(h.timers.tasks.values().next().value.options > 0)
    assert.equal(h.requests.length, 0)
    h.timers.run()
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 1)
    h.resolve(dataModule)
    h.resolve(detailModule)
  }],
  ['unmount cancels the timeout fallback', { fallback: true }, async (h) => {
    h.render()
    h.ready()
    h.unmount()
    assert.equal(h.timers.cancelled, 1)
    h.timers.run()
    assert.equal(h.requests.length, 0)
  }],
  ['normal/static-preview callback starts both imports; early data keeps the title', {}, async (h) => {
    h.render()
    h.select()
    assertPreview(h)
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 1)
    assert.equal(h.idle.tasks.size + h.timers.tasks.size, 0)
    h.resolve(dataModule)
    await flushPromises()
    h.render()
    assertPreview(h)
    h.resolve(detailModule)
    await finishDetail(h)
  }],
  ['CMS selection loads detail code immediately and keeps the title until ready', { cms: true }, async (h) => {
    h.render()
    h.select(cmsProject)
    assert.equal(h.count(dataModule), 0)
    assert.equal(h.count(detailModule), 1)
    await flushPromises()
    h.render()
    assertPreview(h, cmsProject)
    h.resolve(detailModule)
    await finishDetail(h, cmsProject)
  }],
  ['camp deep link opens on the first frame without waiting for map ready', { camp: true }, async (h) => {
    h.render()
    assert.equal(h.frames.tasks.size, 1)
    h.frames.run()
    h.render()
    assertPreview(h)
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 1)
    assert.equal(h.idle.tasks.size + h.timers.tasks.size, 0)
    h.resolve(dataModule)
    await flushPromises()
    h.render()
    assertPreview(h)
    h.resolve(detailModule)
    await finishDetail(h)
  }],
  ['concurrent and completed static-data requests reuse the same promise', {}, async (h) => {
    const first = h.loadData()
    const second = h.loadData()
    assert.equal(first, second)
    assert.equal(h.count(dataModule), 1)
    h.resolve(dataModule)
    await first
    assert.equal(h.loadData(), first)
    assert.equal(h.count(dataModule), 1)
  }],
  ['both background rejections are handled and selection retries', {}, async (h) => {
    h.render()
    h.ready()
    h.idle.run()
    h.reject(dataModule)
    h.reject(detailModule)
    await flushPromises()
    assert.equal(h.warnings.length, 1)
    h.select()
    assertPreview(h)
    assert.equal(h.count(dataModule), 2)
    assert.equal(h.count(detailModule), 2)
    h.resolve(dataModule, 1)
    h.resolve(detailModule, 1)
    await finishDetail(h)
  }],
  ['failed background detail import retries while successful data remains cached', {}, async (h) => {
    h.render()
    h.ready()
    h.idle.run()
    h.resolve(dataModule)
    h.reject(detailModule)
    await flushPromises()
    assert.equal(h.warnings.length, 1)
    h.select()
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 2)
    assertPreview(h)
    h.resolve(detailModule, 1)
    await finishDetail(h)
  }],
  ['active detail rejection keeps a closable title and supports reselection', {}, async (h) => {
    h.render()
    h.select()
    h.resolve(dataModule)
    h.reject(detailModule)
    await flushPromises()
    h.render()
    assert.equal(h.warnings.length, 1)
    assertPreview(h)
    h.preview().props.onClose()
    h.render()
    assert.equal(h.preview(), null)
    h.select()
    assert.equal(h.count(dataModule), 1)
    assert.equal(h.count(detailModule), 2)
    h.resolve(detailModule, 1)
    await finishDetail(h)
  }],
  ['active data rejection clears its cached promise for retry', {}, async (h) => {
    h.render()
    h.select()
    h.resolve(detailModule)
    h.reject(dataModule)
    await flushPromises()
    h.render()
    assert.equal(h.warnings.length, 1)
    assertPreview(h)
    h.select()
    assert.equal(h.count(dataModule), 2)
    h.resolve(dataModule, 1)
    h.resolve(detailModule, 1)
    await finishDetail(h)
  }],
  ['late details cannot replace a newer selection', {}, async (h) => {
    h.render()
    h.select(markers[0])
    h.select(markers[1])
    assertPreview(h, markers[1])
    assert.equal(h.count(dataModule), 1)
    h.resolve(dataModule)
    h.resolve(detailModule, 1)
    await finishDetail(h, markers[1])
    h.resolve(detailModule, 0)
    await finishDetail(h, markers[1])
  }],
  ['closing a pending detail prevents its late completion reopening the panel', {}, async (h) => {
    h.render()
    h.select()
    h.preview().props.onClose()
    h.render()
    h.resolve(dataModule)
    h.resolve(detailModule)
    await flushPromises()
    h.render()
    assert.equal(h.preview(), null)
    assert.equal(h.detail(), null)
  }],
]

const unhandledRejections = []
const onUnhandledRejection = (reason) => unhandledRejections.push(reason)
process.on('unhandledRejection', onUnhandledRejection)
let passed = 0
console.log('GlobalMapView loading regression tests (real source, isolated stubs)')
try {
  for (const [name, options, run] of tests) {
    const harness = createHarness(options)
    const rejectionCount = unhandledRejections.length
    try {
      await run(harness)
      await flushPromises()
      assert.equal(unhandledRejections.length, rejectionCount, 'Unexpected unhandled rejection')
      passed += 1
      console.log(`PASS ${name}`)
    } catch (error) {
      process.exitCode = 1
      console.error(`FAIL ${name}`)
      console.error(error)
    } finally {
      harness.unmount()
    }
  }
} finally {
  process.removeListener('unhandledRejection', onUnhandledRejection)
}
console.log(`${passed}/${tests.length} passed; ${unhandledRejections.length} unhandled rejections`)
