'use client';

import {
  Button,
  ButtonLoader,
  Field,
  FieldDate,
  FieldText,
  Input,
  LoginIcon,
  LogoutIcon,
  OpenInNewIcon,
  PagedDataViewer,
  ShareIcon,
  SmartToyIcon,
  T,
  UserChip,
} from 'components';
import { jukiApiManager } from 'config';
import { EMPTY_ENTITY_MEMBERS } from 'config/constants';
import { authorizedRequest, cleanRequest, toFilterUrl, toSortUrl } from 'helpers';
import { useJukiNotification, useJukiUser, useRouterStore, useUIStore, useUserStore } from 'hooks';
import { useState } from 'react';
import { ContentResponse, DataViewerHeadersType, MermaidResponseDTO, QueryParamKey, Status } from 'types';

const MERMAID_COLUMNS: DataViewerHeadersType<MermaidResponseDTO>[] = [
  {
    index: 'name',
    head: 'name',
    minWidth: 200,
    Field: ({ record }) => <FieldText label={<T>name</T>} text={record.name} />,
    sort: true,
  },
  {
    index: 'key',
    head: 'key',
    minWidth: 120,
    Field: ({ record }) => <FieldText label={<T>key</T>} text={record.key} />,
    sort: true,
  },
  {
    index: 'owner',
    head: 'owner',
    minWidth: 140,
    Field: ({ record: { owner } }) => (
      <Field className="jk-row">
        <UserChip imageUrl={owner.imageUrl} nickname={owner.nickname} companyKey={owner.company.key} />
      </Field>
    ),
    sort: true,
  },
  {
    index: 'updatedAt',
    head: 'updated',
    minWidth: 160,
    Field: ({ record }) => <FieldDate label={<T>key</T>} date={new Date(record.updatedAt)} twoLines />,
    sort: true,
  },
  {
    index: 'createdAt',
    head: 'created',
    minWidth: 160,
    Field: ({ record }) => <FieldDate label={<T>key</T>} date={new Date(record.createdAt)} twoLines />,
    sort: true,
  },
];

const EMPTY_ENTITY_MEMBERS_DTO = () => {
  const members = EMPTY_ENTITY_MEMBERS();
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

const FEATURES = [
  {
    icon: <div style={{ fontSize: '2rem' }}>🗂️</div>,
    title: 'diagrams made easy',
    description: 'create flowcharts, sequence diagrams, class diagrams, gantt charts, and more with a simple text editor.',
  },
  {
    icon: <SmartToyIcon size="large" className="cr-io" />,
    title: 'AI assistant',
    description: 'describe what you need in natural language and the AI will generate or fix your mermaid diagram for you.',
  },
  {
    icon: <ShareIcon size="large" className="cr-io" />,
    title: 'share & collaborate',
    description: 'share your diagrams with a link or invite collaborators to view and edit together.',
  },
];

export default function Page() {
  const setSearchParams = useRouterStore((state) => state.setSearchParams);
  const pushRoute = useRouterStore((state) => state.pushRoute);
  const { isLogged, imageUrl, nickname, company } = useUserStore((store) => store.user);
  const [name, setName] = useState('');
  const [mermaidKey, setMermaidKey] = useState('');
  const { Link } = useUIStore((store) => store.components);
  const { notifyResponse } = useJukiNotification();
  const { logout } = useJukiUser();

  return (
    <div className="jk-col nowrap wh-100 stretch">
      <div className="jk-col center gap">
        <div className="jk-col center gap jk-pg view-width jk-col jk-pg-lg-tb">
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🧜</div>
          <h1>Juki Mermaid</h1>
          <p className="tx-l cr-g4 tt-se">
            <T>create and share beautiful diagrams powered by AI</T>
          </p>
        </div>

        <div className="jk-row-col stretch gap jk-pg view-width">
          {FEATURES.map((f) => (
            <div key={f.title} className="jk-col gap-sm jk-pg jk-br bc-we" style={{ flex: 1, alignItems: 'flex-start' }}>
              {f.icon}
              <div className="fw-bd tt-se">
                <T>{f.title}</T>
              </div>
              <div className="tx-s cr-g4 tt-se">
                <T>{f.description}</T>
              </div>
            </div>
          ))}
        </div>

        <div className="jk-col gap center bc-we jk-pg jk-br view-width">
          {isLogged ? (
            <>
              <T className="tt-se cr-g5 tx-s">signed in as</T>
              <UserChip imageUrl={imageUrl} nickname={nickname} companyKey={company.key} />
              <ButtonLoader size="tiny" onClick={(setLoader) => logout({ setLoader })} type="secondary" icon={<LogoutIcon />}>
                <T className="ws-np tt-se">sign out</T>
              </ButtonLoader>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🔒</div>
              <p style={{ margin: 0, textAlign: 'center', lineHeight: 1.5 }} className="tx-s cr-g5 tt-se">
                <T>sign in to create or access your diagrams</T>
              </p>
              <Button onClick={() => setSearchParams({ name: QueryParamKey.SIGN_IN, value: 'true' })} icon={<LoginIcon />} expand size="large">
                <T className="ws-np tt-se">sign in</T>
              </Button>
            </>
          )}
        </div>
        {isLogged && (
          <div className="jk-row-col stretch gap jk-pg view-width ">
            <div className="jk-row-col gap">
              <div className="jk-col gap jk-pg jk-br bc-we">
                <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>✏️</div>
                <div className="fw-bd tt-se">
                  <T>new diagram</T>
                </div>
                <form className="jk-col gap" onSubmit={(e) => e.preventDefault()}>
                  <Input expand label={<T className="tt-se cr-hd tx-s">name</T>} value={name} onChange={setName} />
                  <ButtonLoader
                    submit
                    expand
                    onClick={async (setLoaderStatus) => {
                      setLoaderStatus(Status.LOADING);
                      const { url, ...options } = jukiApiManager.API_V2.mermaid.create({
                        body: { name, members: EMPTY_ENTITY_MEMBERS_DTO(), tags: [], files: {} },
                      });
                      const response = cleanRequest<ContentResponse<{ key: string }>>(await authorizedRequest(url, options));
                      if (notifyResponse(response, setLoaderStatus)) {
                        pushRoute(`/${response.content.key}`);
                      }
                    }}
                  >
                    <T className="tt-se">create</T>
                  </ButtonLoader>
                </form>
              </div>

              <div className="jk-col gap jk-pg jk-br bc-we" style={{ flex: 1 }}>
                <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔗</div>
                <div className="fw-bd tt-se">
                  <T>open by key</T>
                </div>
                <div className="jk-col gap">
                  <Input expand label={<T className="tt-se cr-hd tx-s">key</T>} value={mermaidKey} onChange={setMermaidKey} />
                  <Link href={`/${mermaidKey}`} target="_blank" rel="noopener noreferrer" className="wh-100">
                    <Button icon={<OpenInNewIcon />} expand>
                      <T className="tt-se">open</T>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLogged && (
        <div className="jk-col nowrap stretch jk-pg">
          <div className="fw-bd tt-se cr-g4 tx-s" style={{ marginBottom: 'var(--pad-sm)' }}>
            <T>your diagrams</T>
          </div>
          <div style={{ height: `calc(var(--100VH) / 2)`, minHeight: '200px' }}>
            <PagedDataViewer<MermaidResponseDTO>
              name="mermaid-list"
              headers={MERMAID_COLUMNS}
              getUrl={({ pagination: { page, pageSize }, filter, sort }) =>
                jukiApiManager.API_V2.mermaid.getSummaryList({
                  params: { page, pageSize, filterUrl: toFilterUrl(filter), sortUrl: toSortUrl(sort) },
                }).url
              }
              refreshInterval={30000}
              onRecordClick={({ data, index }) => pushRoute(`/${data[index].key}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
