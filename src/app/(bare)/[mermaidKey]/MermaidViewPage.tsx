'use client';

import {
  ArrowBackIcon,
  Button,
  CopyToClipboard,
  DateLiteral,
  DocumentMembersButton,
  ExpandMoreIcon,
  InfoIIcon,
  LoadingIcon,
  Modal,
  PaletteIcon,
  PlayArrowIcon,
  Select,
  SettingsIcon,
  SpinIcon,
  SplitPane,
  T,
  TwoContentLayout,
  UserCodeEditor,
  WarningIcon,
} from 'components';
import { jukiApiManager } from 'config';
import { JUKI_SERVICE_V2_URL } from 'config/constants';
import { authorizedRequest, classNames, cleanRequest, contentResponse, getUserKey, oneTab } from 'helpers';
import { useFetcher, useStableRef, useUIStore, useUserStore } from 'hooks';
import { MouseEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CodeEditorFiles, CodeLanguage, ContentResponseType, EntityMembersResponseDTO, MermaidResponseDTO, MermaidTheme, UserCodeEditorProps } from 'types';
import { GraphicToolbar } from './GraphicToolbar';
import { DEFAULT_MERMAID_CODE, MERMAID_TEMPLATES } from './mermaid-templates';
import { MermaidAiChat } from './MermaidAiChat';

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
      <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{error}</pre>
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
      <div className="jk-col stretch gap nowrap wh-100">
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

        <div className="jk-row gap">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button key={cat} onClick={() => setActiveCategory(cat)} size="tiny" type={activeCategory === cat ? 'accent' : 'light'}>
              {cat}
            </Button>
          ))}
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {filtered.map((template) => (
              <Button
                key={template.name}
                onClick={() => {
                  onLoad(template.code);
                  onClose();
                }}
                type="text"
                className="jk-br-ie"
                style={{
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span>{template.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--t-color-gray-6)', fontWeight: 400 }}>{template.category}</span>
              </Button>
            ))}
          </div>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--t-color-gray-6)' }}>No templates found</div>}
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
      <div className="jk-col gap wh-100 stretch">
        <h3>
          <T className="tt-se">mermaid configuration</T>
        </h3>
        <div className="jk-row tx-s left gap">
          <InfoIIcon size="small" filledCircle className="cr-at-lt" />
          <span>
            JSON config passed to{' '}
            <code className="bc-hl" style={{ padding: '1px 4px', borderRadius: '3px' }}>
              mermaid.initialize()
            </code>
          </span>
        </div>
        <div className="ow-hn jk-br-ie" style={{ height: '320px', overflow: 'hidden' }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingIcon />
              </div>
            }
          >
            <UserCodeEditor<CodeLanguage.JSON>
              key={configEditorKey}
              storeKey={`mermaid-config-editor-${configEditorKey}`}
              languages={[{ value: CodeLanguage.JSON, label: 'JSON' }]}
              initialFiles={{
                'config.json': {
                  source: localConfig,
                  language: CodeLanguage.JSON,
                  index: 0,
                  name: 'config.json',
                  hidden: false,
                  readonly: false,
                  protected: false,
                },
              }}
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

const toEntityMembersDTO = (members: EntityMembersResponseDTO) => {
  return {
    rankAdministrators: members.rankAdministrators,
    administrators: Object.keys(members.administrators),
    rankManagers: members.rankManagers,
    managers: Object.keys(members.managers),
    rankParticipants: members.rankParticipants,
    participants: Object.keys(members.participants),
    rankGuests: members.rankGuests,
    guests: Object.keys(members.guests),
    rankSpectators: members.rankSpectators,
    spectators: Object.keys(members.spectators),
  };
};

const oderFiles = (files: CodeEditorFiles<CodeLanguage.MERMAID>) => {
  const filesArray: CodeEditorFiles<CodeLanguage.MERMAID> = {};
  for (const [key, file] of Object.entries(files)) {
    filesArray[key] = {
      source: file.source,
      language: file.language,
      index: file.index,
      name: file.name,
      hidden: file.hidden,
      readonly: file.readonly,
      protected: file.protected,
    };
  }

  return filesArray;
};

export function MermaidViewPage({ mermaid: fallbackData }: { mermaid: MermaidResponseDTO }) {
  const {
    data,
    isLoading,
    isValidating,
    mutate: reloadMermaid,
  } = useFetcher<ContentResponseType<MermaidResponseDTO>>(jukiApiManager.API_V2.mermaid.getData({ params: { key: fallbackData.key } }).url, {
    fallbackData: JSON.stringify(contentResponse('fallback data', fallbackData)),
  });
  const mermaid = data?.success ? data.content : fallbackData;
  const [files, setFiles] = useState(mermaid.files);

  const newBodyString = JSON.stringify({
    name: mermaid.name,
    files: oderFiles(files),
    tags: [],
    members: toEntityMembersDTO(mermaid.members),
  });
  const currentBodyString = JSON.stringify({
    name: mermaid.name,
    files: oderFiles(mermaid.files),
    tags: [],
    members: toEntityMembersDTO(mermaid.members),
  });

  const timeoutRef = useRef<NodeJS.Timeout>(null);
  useEffect(() => {
    const body = JSON.parse(newBodyString);
    if (isLoading || body.files?.length === 0) {
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      const { url, ...options } = jukiApiManager.API_V2.mermaid.updateData({
        params: { key: fallbackData.key },
        body,
      });
      cleanRequest<ContentResponseType<{ key: string }>>(await authorizedRequest(url, options));
      await reloadMermaid();
      timeoutRef.current = null;
    }, 400);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fallbackData.key, isLoading, newBodyString, reloadMermaid]);

  const { Link } = useUIStore((store) => store.components);
  const user = useUserStore((store) => store.user);
  const [mermaidTheme, setMermaidTheme] = useState<MermaidTheme>('default');
  const [configJson, setConfigJson] = useState(DEFAULT_CONFIG);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const renderIdRef = useRef(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  const code = files[currentFileName]?.source || DEFAULT_MERMAID_CODE;

  useEffect(() => {
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
          setError('');
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
  }, [code, mermaidTheme, configJson]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.1, Math.min(8, parseFloat((z + delta).toFixed(2)))));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
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

  useEffect(() => {
    const el = wheelContainerRef.current;
    if (!el) return;
    const onWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((z) => Math.max(0.1, Math.min(8, parseFloat((z + delta).toFixed(3)))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (!previewContainerRef.current) return;
    if (!document.fullscreenElement) {
      await previewContainerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const setFileCbRef = useRef<Parameters<NonNullable<UserCodeEditorProps<CodeLanguage.MERMAID>['setSetFile']>>[0]>(null);
  const filesRef = useStableRef(files);
  const setCode = useCallback(
    (source: string) => {
      if (filesRef.current[currentFileName]?.source !== source) {
        setFileCbRef.current?.(currentFileName, {
          ...filesRef.current[currentFileName],
          source,
        });
      }
    },
    [currentFileName, filesRef],
  );
  const setCodeRef = useStableRef(setCode);

  const setSetFile = useCallback((setFileCb: Parameters<NonNullable<UserCodeEditorProps<CodeLanguage.MERMAID>['setSetFile']>>[0]) => {
    setFileCbRef.current = setFileCb;
  }, []);

  const selectedThemeOption = {
    value: mermaidTheme,
    label: MERMAID_THEMES.find((t) => t.value === mermaidTheme)?.label || mermaidTheme,
  };

  return (
    <TwoContentLayout
      tabButtons={[
        <div key="state" className="tx-t jk-row gap" style={{ opacity: 0.6 }}>
          {isLoading || isValidating ? (
            <SpinIcon />
          ) : (
            <InfoIIcon
              filledCircle
              size="tiny"
              className={classNames({
                'cr-wg': currentBodyString !== newBodyString,
                'cr-ss': currentBodyString === newBodyString,
              })}
              data-tooltip-id="jk-tooltip"
              data-tooltip-content={currentBodyString !== newBodyString ? 'changes not saved' : 'changes saved'}
            />
          )}
          <DateLiteral date={new Date(mermaid.updatedAt)} />
        </div>,
        <DocumentMembersButton
          key="members"
          members={mermaid.members}
          managers={{}}
          spectators={{}}
          documentOwner={mermaid.owner}
          saveUrl={`${JUKI_SERVICE_V2_URL}/mermaid/${mermaid.key}/members`}
          isAdministrator={getUserKey(mermaid.owner.nickname, mermaid.owner.company.key) === getUserKey(user.nickname, user.company.key)}
          documentName={mermaid.name}
          copyLink={() => (typeof window !== 'undefined' ? window.location.href : '')}
          size="tiny"
        />,
      ]}
      tabs={oneTab(
        <SplitPane direction="row" minSize={200} style={{ flex: 1, overflow: 'hidden' }} closableFirstPane={{ align: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            <Suspense
              fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <LoadingIcon />
                </div>
              }
            >
              <UserCodeEditor<CodeLanguage.MERMAID>
                initialFiles={fallbackData.files}
                leftButtons={() => [
                  <CopyToClipboard key="copy-code" disabled={!code} size="tiny" text={code}>
                    code
                  </CopyToClipboard>,
                  <CopyToClipboard key="copy-svg" disabled={!renderedSvg} size="tiny" text={renderedSvg}>
                    SVG
                  </CopyToClipboard>,
                ]}
                setSetFile={setSetFile}
                storeKey={`mermaid-uce-${mermaid.key}`}
                languages={[{ value: CodeLanguage.MERMAID, label: 'Mermaid' }]}
                onCurrentFileNameChange={setCurrentFileName}
                onFilesChange={setFiles}
                onlyCodeEditor
                withoutRunCodeButton
                withoutDownloadCopyButton
              />
            </Suspense>

            {!!error && <ErrorPanel error={error} />}
          </div>
          <div className="jk-row nowrap gap top ht-100 wh-100 center" style={{ position: 'sticky', top: 0 }}>
            <div className="ht-100 jk-col ow-hn flex-1 wh-100" ref={previewContainerRef}>
              <GraphicToolbar
                zoom={zoom}
                isRendering={isRendering}
                isFullscreen={isFullscreen}
                onZoom={handleZoom}
                onReset={handleResetView}
                onToggleFullscreen={handleToggleFullscreen}
                renderedSvg={renderedSvg}
                mermaidKey={mermaid.key}
                mermaidTheme={mermaidTheme}
              />

              <div
                ref={wheelContainerRef}
                className="wh-100"
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  position: 'relative',
                  userSelect: 'none',
                  background: mermaidTheme === 'dark' ? '#1e1e2e' : 'var(--t-color-bg-1, #f8fafc)',
                }}
                onMousedown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onMouseleave={handleMouseUp}
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
            <MermaidAiChat mermaidKey={mermaid.key} code={code} setCodeRef={setCodeRef} error={error} />
          </div>
        </SplitPane>,
      )}
    >
      <TemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onLoad={setCode} />

      <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} configJson={configJson} onConfigChange={setConfigJson} />
      <div className="jk-row gap jk-pg-xsm">
        <Link href="/">
          <Button type="text" icon={<ArrowBackIcon />} tooltipContent="back home" />
        </Link>
        <div className="jk-row cr-at tx-l fw-br">Mermaid Editor</div>

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

        <div style={{ width: '1px', height: '20px', background: 'var(--t-color-gray-4)' }} />
      </div>
    </TwoContentLayout>
  );
}
