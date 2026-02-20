'use client';

import { CodeEditorFiles } from '@juki-team/commons';
import {
  Button,
  ContentCopyIcon,
  CopyToClipboard,
  DownloadIcon,
  ExpandMoreIcon,
  FullscreenExitIcon,
  FullscreenIcon,
  InfoIIcon,
  LoadingIcon,
  MinusIcon,
  Modal,
  PaletteIcon,
  PlayArrowIcon,
  PlusIcon,
  RefreshIcon,
  Select,
  SettingsIcon,
  ShareIcon,
  SplitPane,
  T,
  UserCodeEditor,
  WarningIcon,
} from 'components';
import { MutableRefObject, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_MERMAID_CODE, MERMAID_TEMPLATES } from './mermaid-templates';

type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral' | 'base';

interface StoredState {
  code: string;
  theme: MermaidTheme;
  config: string;
}

const MERMAID_THEMES: { value: MermaidTheme; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'forest', label: 'Forest' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'base', label: 'Base' },
];

const TEMPLATE_CATEGORIES = ['All', ...Array.from(new Set(MERMAID_TEMPLATES.map((t) => t.category)))];

const DEFAULT_CONFIG = `{
  "logLevel": "error",
  "securityLevel": "loose",
  "startOnLoad": false
}`;

const storageKey = (key: string) => `mermaid-editor-${key}`;

function loadFromStorage(key: string): StoredState | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {}
  return null;
}

function saveToStorage(key: string, data: StoredState) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(data));
  } catch {}
}

function encodeToHash(code: string): string {
  try {
    return btoa(encodeURIComponent(code));
  } catch {
    return '';
  }
}

function decodeFromHash(hash: string): string | null {
  try {
    return decodeURIComponent(atob(hash));
  } catch {
    return null;
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildEditorFiles(source: string, filename: string): CodeEditorFiles<string> {
  return {
    [filename]: { source, language: 'plaintext', index: 0, name: filename, hidden: false, readonly: false, protected: false },
  };
}

// Detects active file switches inside UserCodeEditor and notifies the parent
function FileWatcher({
  currentFileName,
  files,
  currentFileNameRef,
  onSwitch,
}: {
  currentFileName: string;
  files: CodeEditorFiles<string>;
  currentFileNameRef: MutableRefObject<string>;
  onSwitch: (source: string) => void;
}) {
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    currentFileNameRef.current = currentFileName;
    onSwitch(filesRef.current[currentFileName]?.source ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileName]);

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ErrorPanel({ error }: { error: string }) {
  return (
    <div
      style={{
        background: 'var(--t-color-error-light, #fee2e2)',
        color: 'var(--t-color-error, #dc2626)',
        borderTop: '2px solid var(--t-color-error, #dc2626)',
        padding: '8px 12px',
        flexShrink: 0,
        overflow: 'auto',
        maxHeight: '140px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
      }}
    >
      <WarningIcon size="small" style={{ flexShrink: 0, marginTop: '2px' }} />
      <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
        {error}
      </pre>
    </div>
  );
}

function ZoomToolbar({
  zoom,
  isRendering,
  isFullscreen,
  onZoom,
  onReset,
  onToggleFullscreen,
}: {
  zoom: number;
  isRendering: boolean;
  isFullscreen: boolean;
  onZoom: (delta: number) => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderBottom: '1px solid var(--t-color-gray-4)',
        flexShrink: 0,
        background: 'var(--t-color-bg)',
        flexWrap: 'wrap',
      }}
    >
      <Button onClick={() => onZoom(-0.1)} icon={<MinusIcon size="small" />} size="tiny" type="light" />
      <span style={{ minWidth: '42px', textAlign: 'center', fontSize: '0.8rem', userSelect: 'none' }}>
        {Math.round(zoom * 100)}%
      </span>
      <Button onClick={() => onZoom(0.1)} icon={<PlusIcon size="small" />} size="tiny" type="light" />
      <div style={{ width: '1px', height: '16px', background: 'var(--t-color-gray-4)', margin: '0 4px' }} />
      <Button onClick={() => onZoom(0.5 - zoom)} size="tiny" type="light">
        50%
      </Button>
      <Button onClick={() => onZoom(1 - zoom)} size="tiny" type="light">
        100%
      </Button>
      <Button onClick={() => onZoom(2 - zoom)} size="tiny" type="light">
        200%
      </Button>
      <Button onClick={onReset} icon={<RefreshIcon size="small" />} size="tiny" type="light">
        <T className="tt-se">reset</T>
      </Button>
      <div style={{ flex: 1 }} />
      {isRendering && <LoadingIcon size="small" />}
      <Button
        onClick={onToggleFullscreen}
        icon={isFullscreen ? <FullscreenExitIcon size="small" /> : <FullscreenIcon size="small" />}
        size="tiny"
        type="light"
      />
    </div>
  );
}

function TemplatesModal({ isOpen, onClose, onLoad }: { isOpen: boolean; onClose: () => void; onLoad: (code: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = MERMAID_TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeIcon closeOnKeyEscape closeOnClickOverlay className="jk-pg">
      <div style={{ width: 'min(640px, 90vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>
            <T className="tt-se">diagram templates</T>
          </h3>
        </div>

        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid var(--t-color-gray-4)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            outline: 'none',
            background: 'var(--t-color-bg)',
            color: 'var(--t-color-text)',
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              size="tiny"
              type={activeCategory === cat ? 'accent' : 'light'}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {filtered.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  onLoad(template.code);
                  onClose();
                }}
                style={{
                  padding: '12px',
                  border: '1px solid var(--t-color-gray-4)',
                  borderRadius: '6px',
                  background: 'var(--t-color-bg)',
                  color: 'var(--t-color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--t-color-primary)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--t-color-primary-light, #eff6ff)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--t-color-gray-4)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--t-color-bg)';
                }}
              >
                <span>{template.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--t-color-gray-6)', fontWeight: 400 }}>{template.category}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--t-color-gray-6)' }}>No templates found</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ConfigModal({
  isOpen,
  onClose,
  configJson,
  onConfigChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  configJson: string;
  onConfigChange: (v: string) => void;
}) {
  const [localConfig, setLocalConfig] = useState(configJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [configEditorKey, setConfigEditorKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(configJson);
      setParseError(null);
      setConfigEditorKey((k) => k + 1);
    }
  }, [isOpen, configJson]);

  const handleApply = () => {
    try {
      JSON.parse(localConfig);
      onConfigChange(localConfig);
      setParseError(null);
      onClose();
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeIcon closeOnKeyEscape closeOnClickOverlay className="jk-pg">
      <div style={{ width: 'min(560px, 90vw)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>
          <T className="tt-se">mermaid configuration</T>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--t-color-gray-6)' }}>
          <InfoIIcon size="small" />
          <span>
            JSON config passed to{' '}
            <code style={{ background: 'var(--t-color-gray-2)', padding: '1px 4px', borderRadius: '3px' }}>
              mermaid.initialize()
            </code>
          </span>
        </div>
        <div style={{ height: '320px', border: '1px solid var(--t-color-gray-4)', borderRadius: '4px', overflow: 'hidden' }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingIcon />
              </div>
            }
          >
            <UserCodeEditor<string>
              key={configEditorKey}
              storeKey={`mermaid-config-editor-${configEditorKey}`}
              languages={[{ value: 'json', label: 'JSON' }]}
              initialFiles={{ 'config.json': { source: localConfig, language: 'json', index: 0, name: 'config.json', hidden: false, readonly: false, protected: false } }}
              onFilesChange={(files) => {
                const source = files['config.json']?.source;
                if (source !== undefined) setLocalConfig(source);
              }}
              onlyCodeEditor
              withoutRunCodeButton
              withoutDownloadCopyButton
            />
          </Suspense>
        </div>
        {parseError && (
          <div style={{ color: 'var(--t-color-error, #dc2626)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
            <WarningIcon size="small" />
            {parseError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} type="light">
            <T className="tt-se">cancel</T>
          </Button>
          <Button onClick={handleApply}>
            <T className="tt-se">apply & close</T>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ShareModal({ isOpen, onClose, shareUrl }: { isOpen: boolean; onClose: () => void; shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeIcon closeOnKeyEscape closeOnClickOverlay className="jk-pg">
      <div style={{ width: 'min(540px, 90vw)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>
          <T className="tt-se">share diagram</T>
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--t-color-gray-6)' }}>
          <T className="tt-se">this link encodes your diagram in the URL — no account needed</T>
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid var(--t-color-gray-4)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              background: 'var(--t-color-gray-1, #f5f5f5)',
              color: 'var(--t-color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            onClick={handleCopy}
            icon={copied ? undefined : <ContentCopyIcon size="small" />}
            type={copied ? 'accent' : 'light'}
          >
            {copied ? '✓ Copied!' : <T className="tt-se">copy</T>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MermaidViewPage({ mermaidKey }: { mermaidKey: string }) {
  const [code, setCode] = useState(DEFAULT_MERMAID_CODE);
  const [mermaidTheme, setMermaidTheme] = useState<MermaidTheme>('default');
  const [configJson, setConfigJson] = useState(DEFAULT_CONFIG);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // View controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Refs
  const renderIdRef = useRef(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const currentFileNameRef = useRef('diagram.mmd');

  // ── Initialization ──────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true);

    // URL hash takes priority (shared diagram)
    const hash = window.location.hash.slice(1);
    if (hash && hash.length > 10) {
      const decoded = decodeFromHash(hash);
      if (decoded) {
        setCode(decoded);
        return;
      }
    }

    // Then load from localStorage
    const stored = loadFromStorage(mermaidKey);
    if (stored) {
      if (stored.code) setCode(stored.code);
      if (stored.theme) setMermaidTheme(stored.theme);
      if (stored.config) setConfigJson(stored.config);
    }
  }, [mermaidKey]);

  // ── Persist to localStorage ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isMounted) return;
    saveToStorage(mermaidKey, { code, theme: mermaidTheme, config: configJson });
  }, [code, mermaidTheme, configJson, mermaidKey, isMounted]);

  // ── Mermaid Rendering ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isMounted) return;

    const renderId = ++renderIdRef.current;
    setIsRendering(true);

    const timeout = setTimeout(async () => {
      try {
        const { default: mermaid } = await import('mermaid');

        let extraConfig: Record<string, unknown> = {};
        try {
          extraConfig = JSON.parse(configJson);
        } catch {}

        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: 'loose',
          ...extraConfig,
        });

        const { svg } = await mermaid.render(`mermaid-render-${renderId}`, code);

        if (renderId === renderIdRef.current) {
          setRenderedSvg(svg);
          setError(null);
          setIsRendering(false);
        }
      } catch (err: unknown) {
        if (renderId === renderIdRef.current) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message.replace(/^Error:\s*/i, ''));
          setRenderedSvg('');
          setIsRendering(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [code, mermaidTheme, configJson, isMounted]);

  // ── Fullscreen listener ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ── Zoom & Pan ──────────────────────────────────────────────────────────────

  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.1, Math.min(8, parseFloat((z + delta).toFixed(2)))));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((z) => Math.max(0.1, Math.min(8, parseFloat((z + delta).toFixed(3)))));
  }, []);

  // ── Fullscreen ──────────────────────────────────────────────────────────────

  const handleToggleFullscreen = useCallback(async () => {
    if (!previewContainerRef.current) return;
    if (!document.fullscreenElement) {
      await previewContainerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExportSVG = useCallback(() => {
    if (!renderedSvg) return;
    downloadBlob(renderedSvg, `diagram-${mermaidKey}.svg`, 'image/svg+xml;charset=utf-8');
  }, [renderedSvg, mermaidKey]);

  const handleExportPNG = useCallback(() => {
    if (!renderedSvg) return;
    const img = new Image();
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const scale = 2;
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = mermaidTheme === 'dark' ? '#1e1e2e' : '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `diagram-${mermaidKey}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [renderedSvg, mermaidTheme, mermaidKey]);

  // ── Copy ────────────────────────────────────────────────────────────────────

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  }, [code]);

  const handleCopySVG = useCallback(async () => {
    if (!renderedSvg) return;
    try {
      await navigator.clipboard.writeText(renderedSvg);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch {}
  }, [renderedSvg]);

  // ── Share ───────────────────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    const hash = encodeToHash(code);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    setShareUrl(url);
    setShowShare(true);
    // Also update the URL hash without reloading
    window.history.replaceState(null, '', `#${hash}`);
  }, [code]);

  // ── Template loading ────────────────────────────────────────────────────────

  const handleLoadTemplate = useCallback((templateCode: string) => {
    setCode(templateCode);
    setEditorKey((k) => k + 1);
    // Clear URL hash when loading a template
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // ── Editor callbacks ────────────────────────────────────────────────────────

  const handleFilesChange = useCallback((files: CodeEditorFiles<string>) => {
    const source = files[currentFileNameRef.current]?.source;
    if (source !== undefined) setCode(source);
  }, []);

  const handleFileSwitched = useCallback((source: string) => {
    setCode(source);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isMounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingIcon size="huge" />
      </div>
    );
  }

  const selectedThemeOption = {
    value: mermaidTheme,
    label: MERMAID_THEMES.find((t) => t.value === mermaidTheme)?.label || mermaidTheme,
  };

  return (
    <div className="jk-col ow-hn" style={{ height: '100vh' }}>
      <div className="jk-row gap jk-pg-xsm wh-100">
        <div className="jk-row">
          <span className="fw-bd cr-tx-ht">Mermaid Editor</span>
        </div>

        <div className="jk-row gap">
          <PaletteIcon size="small" />
          <Select
            options={MERMAID_THEMES.map(({ value, label }) => ({ value, label }))}
            selectedOption={selectedThemeOption}
            onChange={({ value }) => setMermaidTheme(value as MermaidTheme)}
          />
        </div>

        <Button onClick={() => setShowTemplates(true)} icon={<ExpandMoreIcon size="small" />} size="small" type="light">
          <T className="tt-se">templates</T>
        </Button>

        <Button onClick={() => setShowConfig(true)} icon={<SettingsIcon size="small" />} size="small" type="light">
          <T className="tt-se">config</T>
        </Button>

        <div className="flex-1" />

        <Button
          onClick={handleCopyCode}
          icon={<ContentCopyIcon size="small" />}
          size="small"
          type="light"
          style={{ flexShrink: 0 }}
        >
          {copiedCode ? '✓' : <T className="tt-se">copy code</T>}
        </Button>
        <CopyToClipboard text={code}></CopyToClipboard>

        <Button
          onClick={handleCopySVG}
          disabled={!renderedSvg}
          icon={<ContentCopyIcon size="small" />}
          size="small"
          type="light"
          style={{ flexShrink: 0 }}
        >
          {copiedSvg ? '✓' : 'SVG'}
        </Button>

        <Button onClick={handleShare} icon={<ShareIcon size="small" />} size="small" type="light" style={{ flexShrink: 0 }}>
          <T className="tt-se">share</T>
        </Button>

        <div style={{ width: '1px', height: '20px', background: 'var(--t-color-gray-4)' }} />

        <Button
          onClick={handleExportSVG}
          disabled={!renderedSvg}
          icon={<DownloadIcon size="small" />}
          size="small"
          style={{ flexShrink: 0 }}
        >
          SVG
        </Button>

        <Button
          onClick={handleExportPNG}
          disabled={!renderedSvg}
          icon={<DownloadIcon size="small" />}
          size="small"
          style={{ flexShrink: 0 }}
        >
          PNG
        </Button>
      </div>

      <SplitPane direction="row" minSize={200} style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingIcon />
              </div>
            }
          >
            <UserCodeEditor<string>
              key={editorKey}
              storeKey={`mermaid-uce-${mermaidKey}`}
              languages={[{ value: 'plaintext', label: 'Mermaid' }]}
              initialFiles={buildEditorFiles(code, 'diagram.mmd')}
              initialFileName="diagram.mmd"
              onFilesChange={handleFilesChange}
              rightButtons={({ files, currentFileName }) => (
                <FileWatcher
                  currentFileName={currentFileName}
                  files={files}
                  currentFileNameRef={currentFileNameRef}
                  onSwitch={handleFileSwitched}
                />
              )}
              onlyCodeEditor
              withoutRunCodeButton
              withoutDownloadCopyButton
            />
          </Suspense>

          {error && <ErrorPanel error={error} />}
        </div>

        <div ref={previewContainerRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <ZoomToolbar
            zoom={zoom}
            isRendering={isRendering}
            isFullscreen={isFullscreen}
            onZoom={handleZoom}
            onReset={handleResetView}
            onToggleFullscreen={handleToggleFullscreen}
          />

          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              position: 'relative',
              userSelect: 'none',
              background: mermaidTheme === 'dark' ? '#1e1e2e' : 'var(--t-color-bg-1, #f8fafc)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {renderedSvg ? (
                <div dangerouslySetInnerHTML={{ __html: renderedSvg }} style={{ maxWidth: '100%', lineHeight: 0 }} />
              ) : !isRendering && !error ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--t-color-gray-5)',
                    padding: '3rem',
                    userSelect: 'none',
                  }}
                >
                  <PlayArrowIcon size="huge" />
                  <T className="tt-se">start typing to see your diagram</T>
                </div>
              ) : null}
            </div>

            {isRendering && !renderedSvg && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.05)',
                }}
              >
                <LoadingIcon size="large" />
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                fontSize: '0.7rem',
                color: 'var(--t-color-gray-5)',
                background: 'var(--t-color-bg)',
                padding: '3px 7px',
                borderRadius: '4px',
                border: '1px solid var(--t-color-gray-3)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              scroll to zoom · drag to pan
            </div>
          </div>
        </div>
      </SplitPane>

      <TemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onLoad={handleLoadTemplate} />

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        configJson={configJson}
        onConfigChange={setConfigJson}
      />

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} shareUrl={shareUrl} />
    </div>
  );
}
