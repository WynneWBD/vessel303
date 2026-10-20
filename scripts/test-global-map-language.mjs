import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
function parse(relativePath, kind) {
  const path = fileURLToPath(new URL(relativePath, root))
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, kind)
}
function findAll(node, predicate) {
  const matches = []
  function visit(child) {
    if (predicate(child)) matches.push(child)
    ts.forEachChild(child, visit)
  }
  visit(node)
  return matches
}
function only(node, predicate, label) {
  const matches = findAll(node, predicate)
  assert.equal(matches.length, 1, `Expected one ${label}`)
  return matches[0]
}
function isMethod(node, name) {
  return ts.isMethodDeclaration(node) && node.name.getText() === name
}
function isEventCall(node, receiver, method, event) {
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && node.expression.expression.getText() === receiver
    && node.expression.name.text === method
    && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === event
}

const app = parse('src/components/GlobalMapML.tsx', ts.ScriptKind.TSX)
const sdk = parse('node_modules/@maptiler/sdk/dist/maptiler-sdk.mjs', ts.ScriptKind.JS)
const override = only(app, (n) => ts.isFunctionDeclaration(n)
  && n.name?.text === 'applyTaiwanLabelOverride', 'Taiwan override')
const initial = only(app, (n) => ts.isVariableDeclaration(n)
  && n.name.getText() === 'initialIsZh', 'initial language')
const constructor = only(app, (n) => ts.isNewExpression(n)
  && n.expression.getText() === 'MaptilerMap', 'map constructor')
const load = only(app, (n) => isEventCall(n, 'map', 'on', 'load'), 'load listener')
const statements = load.arguments[1].body.statements
const campsIndex = statements.findIndex((n) => ts.isVariableStatement(n)
  && n.declarationList.declarations.some((d) => d.name.getText() === 'campFeatures'))
assert.ok(campsIndex > 0, 'Language lifecycle must precede camp construction')
const languageBody = statements.slice(0, campsIndex).map((n) => n.getText(app)).join('\n')
const primary = only(sdk, (n) => isMethod(n, 'setPrimaryLanguage'), 'SDK language method')
const setStyle = only(primary.parent, (n) => isMethod(n, 'setStyle'), 'SDK map style method')
const reset = only(setStyle, (n) => isEventCall(n, 'this', 'once', 'idle'), 'SDK idle reset')

const Language = Object.fromEntries([
  ['CHINESE', 'name:zh'], ['ENGLISH', 'name:en'], ['LOCAL', 'name'],
  ['STYLE', 'style'], ['STYLE_LOCK', 'style_lock'], ['AUTO', 'auto'],
  ['VISITOR', 'visitor'], ['VISITOR_ENGLISH', 'visitor_english'],
].map(([name, flag]) => [name, { flag }]))

// Execute the installed SDK method, with only its language/style helpers stubbed.
// The fixture has expression-based labels and a MapTiler-hosted vector source.
const sdkContext = vm.createContext({
  O: Language, Bn: (value) => value, W: { maptilerApiHost: 'api.maptiler.com' },
  ls: () => ({ localized: {} }), URL, console,
})
const applySdkLanguage = vm.runInContext(
  `({ ${primary.getText(sdk)} }).setPrimaryLanguage`, sdkContext,
)
const registerSdkIdleReset = vm.runInContext(
  `(function () { ${reset.getText(sdk)}; })`, sdkContext,
)

class TestMap {
  constructor(options) {
    this.options = options
    this.primaryLanguage = options.language
    this.forceLanguageUpdate = true
    this.languageAlwaysBeenStyle = false
    this.originalLabelStyle = new Map()
    this.events = new Map()
    this.languageCalls = []
    this.writes = 0
    this.layers = ['country_label', 'city_label'].map((id) => ({
      id, type: 'symbol', source: 'basemap',
      layout: { 'text-field': ['get', 'name:en'] },
    }))
    registerSdkIdleReset.call(this)
  }
  on(name, callback) { return this.listen(name, callback, false) }
  once(name, callback) { return this.listen(name, callback, true) }
  listen(name, callback, once) {
    const entries = this.events.get(name) ?? []
    entries.push({ callback, once })
    this.events.set(name, entries)
    return this
  }
  emit(name) {
    const entries = [...(this.events.get(name) ?? [])]
    this.events.set(name, (this.events.get(name) ?? []).filter((entry) => !entry.once))
    for (const { callback } of entries) callback()
  }
  getStyleLanguage() { return null }
  getStyle() { return { layers: this.layers } }
  getSource() { return { url: 'https://api.maptiler.com/tiles/test/tiles.json' } }
  getLayoutProperty(id, key) { return this.layers.find((layer) => layer.id === id).layout[key] }
  setLayoutProperty(id, key, value) {
    this.layers.find((layer) => layer.id === id).layout[key] = value
    this.writes += 1
  }
  setLanguage(language) {
    this.languageCalls.push(language)
    applySdkLanguage.call(this, language)
  }
  styledata() { applySdkLanguage.call(this, this.primaryLanguage) }
}

const source = `
${override.getText(app)}
(function (initialLanguage) {
  const isZhRef = { current: initialLanguage };
  let disposed = false;
  const ${initial.getText(app)};
  const map = ${constructor.getText(app)};
  map.on('load', () => { ${languageBody} });
  return { map, isZhRef, dispose: () => { disposed = true; } };
})`
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText
const create = vm.runInNewContext(js, {
  MaptilerMap: TestMap, Language, URL,
  containerRef: { current: {} }, STYLE_URL: '/api/map/maps/streets-v2-light/style.json',
  window: { location: { origin: 'https://example.test' } }, previewMode: false,
  PROXY_TRANSFORM: (url) => ({ url }),
})
const expectedLabel = (zh) => zh ? '\u4e2d\u56fd\u53f0\u6e7e' : 'Taiwan, China'
function assertOverride(map, zh) {
  const field = map.getLayoutProperty('country_label', 'text-field')
  assert.equal(field[0], 'case')
  assert.equal(field[2], expectedLabel(zh))
  assert.notEqual(map.getLayoutProperty('city_label', 'text-field')[0], 'case')
}

for (const zh of [false, true]) {
  const language = zh ? Language.CHINESE : Language.ENGLISH
  const other = zh ? Language.ENGLISH : Language.CHINESE
  const label = zh ? 'Chinese' : 'English'

  test(`${label}: constructor receives language; load avoids a redundant switch`, () => {
    const { map } = create(zh)
    assert.equal(map.options.language, language)
    map.styledata()
    map.emit('load')
    assert.equal(map.languageCalls.length, 0)
    assertOverride(map, zh)
  })

  test(`${label}: a pre-load language change is reconciled`, () => {
    const { map, isZhRef } = create(zh)
    map.styledata()
    isZhRef.current = !zh
    map.emit('load')
    assert.deepEqual(map.languageCalls, [other])
    assertOverride(map, !zh)
  })

  test(`${label}: toggling back before load needs no extra switch`, () => {
    const { map, isZhRef } = create(zh)
    isZhRef.current = !zh
    isZhRef.current = zh
    map.emit('load')
    assert.equal(map.languageCalls.length, 0)
    assertOverride(map, zh)
  })

  test(`${label}: idle restores Taiwan after a real SDK rewrite and stays stable`, () => {
    const { map } = create(zh)
    map.styledata()
    map.emit('load')
    assertOverride(map, zh)
    map.styledata()
    assert.notEqual(map.getLayoutProperty('country_label', 'text-field')[0], 'case')
    map.emit('idle')
    assert.equal(map.forceLanguageUpdate, false)
    assertOverride(map, zh)
    const writes = map.writes
    map.styledata()
    map.emit('idle')
    assert.equal(map.writes, writes, 'No repeated override or SDK rewrite after idle')
    assertOverride(map, zh)
  })

  test(`${label}: pending idle reads the latest language ref`, () => {
    const { map, isZhRef } = create(zh)
    map.styledata()
    map.emit('load')
    map.styledata()
    isZhRef.current = !zh
    map.emit('idle')
    assertOverride(map, !zh)
  })

  test(`${label}: disposed map receives no application writes from pending idle`, () => {
    const { map, dispose } = create(zh)
    map.styledata()
    map.emit('load')
    map.styledata()
    dispose()
    const writes = map.writes
    map.emit('idle')
    assert.equal(map.writes, writes)
  })
}
