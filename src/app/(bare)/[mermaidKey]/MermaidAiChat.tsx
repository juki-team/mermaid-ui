'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Button,
  CheckIcon,
  EditNoteIcon,
  ErrorIcon,
  ExclamationIcon,
  MdMathViewer,
  SendIcon,
  SmartToyIcon,
  SpinIcon,
  T,
  TextArea,
} from 'components';
import { classNames, upperFirst } from 'helpers';
import { useI18nStore, useRef } from 'hooks';
import { RefObject, useEffect, useState } from 'react';

interface MermaidAiChatProps {
  code: string;
  error: string;
  setCodeRef: RefObject<((code: string) => void) | null>;
}

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

export const MermaidAiChat = ({ code, error, setCodeRef }: MermaidAiChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/mermaid',
    }),
  });

  const t = useI18nStore((store) => store.i18n.t);

  const appliedPartsRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
    });
  }, [messages]);

  return (
    <div
      className={classNames('right-panel jk-br-ie tx-s jk-col gap nowrap stretch ht-100', { 'jk-pg-xsm bc-we': isOpen })}
      style={isOpen ? { width: '400px' } : { width: 'calc(var(--tx-h-m) + var(--pad-sm) + var(--pad-sm))' }}
    >
      <div
        className={classNames('jk-row center cr-we bc-io jk-pg-xsm jk-br-ie hr-e1', { 'vertical-text': !isOpen })}
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'sticky', top: 0, zIndex: 1 }}
      >
        <SmartToyIcon />
        &nbsp;
        <T className="fw-bd tt-se">Juki AI Mermaid</T>
      </div>

      {isOpen && (
        <div className="jk-col gap stretch ai-chat-messages flex-1">
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
                          {part?.state === 'input-streaming' ? (
                            <>
                              <T className="tt-se">generating diagram</T>&nbsp;
                              <SpinIcon filledCircle size="tiny" className="cr-il" />
                            </>
                          ) : part?.state === 'output-available' ? (
                            <>
                              <T className="tt-se">diagram ready</T>&nbsp;
                              <CheckIcon filledCircle size="tiny" className="cr-ss" />
                            </>
                          ) : (
                            <CheckIcon filledCircle size="tiny" />
                          )}
                        </div>

                        {/*{part?.state === 'output-available' && part?.input?.title && (*/}
                        {/*  <div className="tx-s fw-bd">{part.input.title}</div>*/}
                        {/*)}*/}

                        {/*{part?.state === 'output-available' && part?.input?.explanation && (*/}
                        {/*  <div className="tx-s cr-g5">{part.input.explanation}</div>*/}
                        {/*)}*/}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage({ text: input }, { body: { code, error } });
              setInput('');
            }}
          >
            <div className="jk-row wh-100 nowrap top gap">
              {status === 'submitted' ? (
                <CheckIcon />
              ) : status === 'ready' ? (
                <EditNoteIcon />
              ) : status === 'error' ? (
                <ErrorIcon />
              ) : status === 'streaming' ? (
                <SpinIcon />
              ) : (
                <ExclamationIcon />
              )}
              <TextArea
                value={input}
                placeholder={upperFirst(t('describe your diagram')) + '...'}
                onChange={setInput}
                disabled={status !== 'ready'}
              />
              <Button icon={<SendIcon />} submit />
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
                type="light"
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
