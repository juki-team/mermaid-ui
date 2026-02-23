'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Button,
  CheckIcon,
  ErrorIcon,
  ExclamationIcon,
  MdMathViewer,
  SendIcon,
  SmartToyIcon,
  SpinIcon,
  T,
  TextArea
} from 'components';
import { classNames, getUserKey, upperFirst } from 'helpers';
import { useI18nStore, useRef, useUserStore } from 'hooks';
import { CSSProperties, ReactNode, RefObject, useEffect, useState } from 'react';

interface MermaidAiChatProps {
  mermaidKey: string;
  code: string;
  error: string;
  setCodeRef: RefObject<((code: string) => void) | null>;
}

const TOOL_STATE_UI: Record<string, { label: string; icon: ReactNode }> = {
  'input-streaming': { label: 'generating diagram', icon: <SpinIcon filledCircle size="tiny" className="cr-il" /> },
  'input-available': { label: 'processing diagram', icon: <SpinIcon filledCircle size="tiny" className="cr-il" /> },
  'approval-requested': { label: 'waiting for approval', icon: <ExclamationIcon filledCircle size="tiny" className="cr-wg" /> },
  'approval-responded': { label: 'approval responded', icon: <SpinIcon filledCircle size="tiny" className="cr-il" /> },
  'output-available': { label: 'diagram ready', icon: <CheckIcon filledCircle size="tiny" className="cr-ss" /> },
  'output-error': { label: 'diagram error', icon: <ErrorIcon filledCircle size="tiny" className="cr-er" /> },
  'output-denied': { label: 'diagram denied', icon: <ErrorIcon filledCircle size="tiny" className="cr-er" /> },
};

const SUGGESTIONS = [
  {
    icon: <div>🔄</div>,
    label: 'flowchart',
    prompt: 'Crea un diagrama de flujo de ejemplo con nodos de decisión, usando flowchart TD.',
  },
  {
    icon: <div>🔗</div>,
    label: 'sequence',
    prompt: 'Crea un diagrama de secuencia de ejemplo con al menos 3 actores y mensajes entre ellos.',
  },
  {
    icon: <div>🗂️</div>,
    label: 'class diagram',
    prompt: 'Crea un diagrama de clases UML de ejemplo con herencia y relaciones.',
  },
  {
    icon: <div>🛠️</div>,
    label: 'fix errors',
    prompt: 'Revisa el código Mermaid actual, corrige cualquier error de sintaxis y mejora la legibilidad.',
  },
];

export const MermaidAiChat = ({ mermaidKey, code, error, setCodeRef }: MermaidAiChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const {
    company: { key: companyKey },
    nickname,
  } = useUserStore((store) => store.user);

  const storageKey = `jk-mermaid-chat-${mermaidKey}/${getUserKey(nickname, companyKey)}`;

  const initialMessages = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  })();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/mermaid',
    }),
    messages: Array.isArray(initialMessages) ? initialMessages : [],
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const t = useI18nStore((store) => store.i18n.t);

  const appliedPartsRef = useRef<Set<string>>(new Set());

  console.log({ messages });
  useEffect(() => {
    for (const message of messages) {
      (
        message.parts as {
          type: string;
          input: { code: string; title?: string; explanation?: string };
          state: string;
        }[]
      ).forEach((part, i) => {
        if (part?.type === 'tool-suggestMermaid' && part?.state === 'output-available') {
          const key = `${message.id}-${i}`;
          if (!appliedPartsRef.current.has(key) && typeof part?.input?.code === 'string' && part.input.code.trim()) {
            appliedPartsRef.current.add(key);
            setCodeRef.current?.(part.input.code);
          }
        }
      });
    }
  }, [messages, setCodeRef]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    const onScroll = () => {
      shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
    });
  }, [messages]);

  const send = () => {
    shouldAutoScrollRef.current = true;
    void sendMessage({ text: input }, { body: { code, error } });
    setInput('');
  };

  return (
    <div
      ref={scrollContainerRef}
      className={classNames('chat-right-panel jk-br-ie jk-col gap nowrap stretch ht-100', { 'bc-we': isOpen })}
      style={isOpen ? { width: 'var(--chat-right-panel-width, calc(100vw / 3))' } : { width: 'calc(var(--tx-h-m) + var(--pad-sm))' }}
    >
      <div
        className={classNames('jk-row center cr-we bc-io jk-pg-xsm jk-br-ie hr-e1', { 'vertical-text': !isOpen })}
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'sticky', top: 0, zIndex: 1, ...(isOpen ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }}
      >
        <SmartToyIcon />
        &nbsp;
        <T className="fw-bd tt-se">Juki AI Mermaid</T>
      </div>

      {isOpen && (
        <div className="jk-col gap stretch ai-chat-messages tx-s flex-1 jk-pg-xsm">
          <div className="flex-1" />
          {messages.map((message) => (
            <div key={message.id} className={classNames('message jk-br-ie bc-hl jk-pg-xsm', message.role)}>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <div key={`${message.id}-${i}`}>
                        <MdMathViewer source={part.text} flatView />
                      </div>
                    );

                  case 'tool-suggestMermaid':
                    return (
                      <div key={`${message.id}-${i}`} className="jk-col gap-sm">
                        <div className="jk-row left fw-lr">
                          {TOOL_STATE_UI[part?.state] ? (
                            <>
                              <T className="tt-se">{TOOL_STATE_UI[part.state].label}</T>&nbsp;
                              {TOOL_STATE_UI[part.state].icon}
                            </>
                          ) : (
                            <CheckIcon filledCircle size="tiny" />
                          )}
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          ))}
          <div className="jk-row left gap tx-t cr-hd">
            {status === 'submitted' ? (
              <>
                <SmartToyIcon size="tiny" className="cr-io" />
                <div className="jk-row" style={{ alignItems: 'baseline' }}>
                  <T className="tt-se">thinking</T>&nbsp;
                  <div
                    className="dot-flashing"
                    style={
                      {
                        '--dot-flashing-color': 'var(--cr-hd)',
                        '--dot-flashing-color-light': 'var(--cr-ht)',
                        '--dot-flashing-size': '4px',
                      } as CSSProperties
                    }
                  />
                </div>
              </>
            ) : status === 'streaming' ? (
              <>
                <SmartToyIcon size="tiny" className="cr-io" />
                <div className="jk-row" style={{ alignItems: 'baseline' }}>
                  <T className="tt-se">writing</T>&nbsp;
                  <div
                    className="dot-flashing"
                    style={
                      {
                        '--dot-flashing-color': 'var(--cr-hd)',
                        '--dot-flashing-color-light': 'var(--cr-ht)',
                        '--dot-flashing-size': '4px',
                      } as CSSProperties
                    }
                  />
                </div>
              </>
            ) : status === 'error' ? (
              <>
                <ErrorIcon size="tiny" className="cr-er" />
                <T className="tt-se cr-er">something went wrong</T>
              </>
            ) : (
              <>
                <SmartToyIcon size="tiny" className="cr-io" />
                <T className="tt-se">how can I help?</T>
              </>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="jk-row wh-100 nowrap top gap">
              <TextArea
                value={input}
                placeholder={upperFirst(messages.length ? t('ask a follow-up') : t('describe your diagram')) + ', ' + t('control + click to send message')}
                onChange={setInput}
                disabled={status !== 'ready'}
                onCtrlEnter={send}
              />
              <Button icon={<SendIcon />} submit style={{ height: '100%' }} />
            </div>
          </form>

          <div className="jk-row gap jk-pg-xsm">
            {SUGGESTIONS.map((sug) => (
              <Button
                key={sug.label}
                onClick={() => {
                  void sendMessage({ text: sug.prompt }, { body: { code } });
                }}
                icon={sug.icon}
                size="tiny"
                type="text"
              >
                <T className="tt-se">{sug.label}</T>
              </Button>
            ))}
          </div>

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
