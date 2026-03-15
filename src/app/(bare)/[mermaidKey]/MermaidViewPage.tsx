'use client';

import { UserCodeEditorHandle } from '@juki-team/base-ui/types';
import { UIMessage } from 'ai';
import {
  AiChatPanel,
  ArrowBackIcon,
  Button,
  CodeEditor,
  DateLiteral,
  DocumentMembersButton,
  ExpandMoreIcon,
  InfoIIcon,
  LoadingIcon,
  Modal,
  PaletteIcon,
  Select,
  SettingsIcon,
  SpinIcon,
  T,
  TwoContentLayout,
  UserCodeEditor,
  WarningIcon,
} from 'components';
import { jukiApiManager } from 'config';
import { JUKI_SERVICE_V2_URL } from 'config/constants';
import { authorizedRequest, classNames, cleanRequest, contentResponse, getUserKey, oneTab } from 'helpers';
import { useFetcher, useStableRef, useUIStore, useUserStore } from 'hooks';
import { CSSProperties, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CodeEditorFiles, CodeLanguage, ContentResponse, EntityMembersResponseDTO, MermaidResponseDTO, MermaidTheme } from 'types';
import { MERMAID_TEMPLATES } from './mermaid-templates';

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
            <Button key={cat} onClick={() => setActiveCategory(cat)} size="tiny" type={activeCategory === cat ? 'primary' : 'secondary'}>
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
                type="ghost"
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
            <CodeEditor<CodeLanguage.JSON>
              language={CodeLanguage.JSON}
              source={localConfig}
              onChange={({ source }) => {
                if (source !== undefined) {
                  setLocalConfig(source);
                }
              }}
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
          <Button onClick={onClose} type="secondary">
            <T className="tt-se">cancel</T>
          </Button>
          <Button onClick={handleApply}>
            <T className="tt-se">apply and close</T>
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
  } = useFetcher<ContentResponse<MermaidResponseDTO>>(jukiApiManager.API_V2.mermaid.getData({ params: { key: fallbackData.key } }).url, {
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
      cleanRequest<ContentResponse<{ key: string }>>(await authorizedRequest(url, options));
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
  const [currentFileName, setCurrentFileName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editorWidth, setEditorWidth] = useState<string>('');
  const userCodeEditorRef = useRef<UserCodeEditorHandle | null>(null);

  const filesRef = useStableRef(files);
  const currentFileNameRef = useStableRef(currentFileName);
  const setCode = useCallback(
    (source: string) => {
      const currentFileName = currentFileNameRef.current;
      console.log('setCode', { currentFileName }, filesRef.current[currentFileName]);
      if (filesRef.current[currentFileName]?.source !== source) {
        userCodeEditorRef.current?.setFile(currentFileName, {
          ...filesRef.current[currentFileName],
          source,
        });
      }
    },
    [currentFileNameRef, filesRef],
  );

  const selectedThemeOption = {
    value: mermaidTheme,
    label: MERMAID_THEMES.find((t) => t.value === mermaidTheme)?.label || mermaidTheme,
  };

  const { source, language } = files?.[currentFileName] || { source: '', language: CodeLanguage.TEXT };
  const getBodyRef = useRef(() => {
    const selectedSource = userCodeEditorRef.current?.markdownGetSelection() ?? '';
    if (selectedSource) {
      userCodeEditorRef.current?.markdownHighlightSelectionNodes('jk-md-math-node-highlighted');
    }
    return { source: language === CodeLanguage.MERMAID ? source : '', selectedSource };
  });

  const appliedPartsRef = useRef<Set<string>>(new Set());
  const onMessagesChangeRef = useRef((messages: UIMessage[]) => {
    for (const message of messages) {
      (
        message.parts as {
          type: string;
          output: { data: { content: string } };
          state: string;
        }[]
      ).forEach((part, i) => {
        if (part?.type === 'tool-suggestMermaid' && part?.state === 'output-available') {
          const key = `${message.id}-${i}`;
          // console.log(key, part);
          if (!appliedPartsRef.current.has(key) && typeof part?.output?.data?.content === 'string') {
            console.log(key, { part });
            setCode(part.output.data.content);
            appliedPartsRef.current.add(key);
          }
        }
      });
    }
  });
  const storeKey = `mermaid-${mermaid.key}`;
  console.log({ files, currentFileName });

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
        <div className="jk-row nowrap gap top ht-100" style={{ '--chat-right-panel-width': 'calc(100vw / 3.5)' } as CSSProperties}>
          <div className="flex-1 ht-100" style={{ maxWidth: editorWidth }}>
            <Suspense
              fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <LoadingIcon />
                </div>
              }
            >
              <UserCodeEditor<CodeLanguage.MERMAID>
                ref={userCodeEditorRef}
                initialFiles={fallbackData.files}
                storeKey={storeKey}
                languages={[{ value: CodeLanguage.MERMAID, label: 'Mermaid' }]}
                onCurrentFileNameChange={setCurrentFileName}
                onFilesChange={setFiles}
                withoutRunCodeButton
              />
            </Suspense>
          </div>
          <AiChatPanel
            getBodyRef={getBodyRef}
            onMessagesChangeRef={onMessagesChangeRef}
            api="/api/chat/mermaid"
            storeKey={storeKey}
            onWidthChange={(width) => setEditorWidth(`calc(100% - ${width}px)`)}
          />
        </div>,
      )}
    >
      <TemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onLoad={setCode} />

      <ConfigModal key={String(showConfig)} isOpen={showConfig} onClose={() => setShowConfig(false)} configJson={configJson} onConfigChange={setConfigJson} />
      <div className="jk-row gap jk-pg-xsm">
        <Link href="/">
          <Button type="ghost" icon={<ArrowBackIcon />} tooltipContent="back home" />
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

        <Button onClick={() => setShowTemplates(true)} icon={<ExpandMoreIcon size="small" />} size="small" type="secondary">
          <T className="tt-se">templates</T>
        </Button>

        <Button onClick={() => setShowConfig(true)} icon={<SettingsIcon size="small" />} size="small" type="secondary">
          <T className="tt-se">config</T>
        </Button>

        <div className="flex-1" />

        <div style={{ width: '1px', height: '20px', background: 'var(--t-color-gray-4)' }} />
      </div>
    </TwoContentLayout>
  );
}
