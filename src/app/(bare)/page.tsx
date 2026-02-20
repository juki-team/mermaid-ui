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
  T,
  UserChip,
} from 'components';
import { jukiApiManager } from 'config';
import { EMPTY_ENTITY_MEMBERS } from 'config/constants';
import { authorizedRequest, cleanRequest, toFilterUrl, toSortUrl } from 'helpers';
import { useJukiNotification, useJukiUser, useResizeDetector, useRouterStore, useUIStore, useUserStore } from 'hooks';
import { useState } from 'react';
import { ContentResponseType, DataViewerHeadersType, MermaidResponseDTO, QueryParamKey, Status } from 'types';

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

export default function Page() {
  const setSearchParams = useRouterStore((state) => state.setSearchParams);
  const pushRoute = useRouterStore((state) => state.pushRoute);
  const { isLogged, imageUrl, nickname, company } = useUserStore((store) => store.user);
  const [name, setName] = useState('');
  const [mermaidKey, setMermaidKey] = useState('');
  const { Link } = useUIStore((store) => store.components);
  const { notifyResponse } = useJukiNotification();
  const { logout } = useJukiUser();
  const { ref, height = 0 } = useResizeDetector();
  return (
    <div className="jk-col nowrap gap wh-100 ht-100 stretch jk-pg pn-re">
      <div className="jk-col center" ref={ref}>
        <h1>Juki Mermaid</h1>
        <div className="jk-row-col gap wh-100 jk-pg">
          <div className="jk-col gap center bc-we jk-pg jk-br">
            {isLogged ? (
              <>
                <T className="tt-se">you are logged in as</T>
                <UserChip imageUrl={imageUrl} nickname={nickname} companyKey={company.key} />
                <ButtonLoader size="tiny" onClick={(setLoader) => logout({ setLoader })} type="light" icon={<LogoutIcon />}>
                  <T className="ws-np tt-se">sign out</T>
                </ButtonLoader>
              </>
            ) : (
              <>
                <T className="tt-se">to create or access an mermaid, you must first log in</T>
                <Button
                  onClick={() => setSearchParams({ name: QueryParamKey.SIGN_IN, value: 'true' })}
                  icon={<LoginIcon />}
                  expand
                >
                  <T className="ws-np tt-se">sign in</T>
                </Button>
              </>
            )}
          </div>
          {isLogged && (
            <div className="jk-row nowrap gap jk-pg jk-br bc-we stretch">
              <form className="jk-col gap" onSubmit={(e) => e.preventDefault()}>
                <T className="tt-se">create a new mermaid</T>
                <Input expand label={<T className="tt-se cr-hd tx-s">name</T>} value={name} onChange={setName} />
                <ButtonLoader
                  submit
                  expand
                  onClick={async (setLoaderStatus) => {
                    setLoaderStatus(Status.LOADING);
                    const { url, ...options } = jukiApiManager.API_V2.mermaid.create({
                      body: { name, members: EMPTY_ENTITY_MEMBERS_DTO(), tags: [], files: {} },
                    });
                    const response = cleanRequest<ContentResponseType<{ key: string }>>(await authorizedRequest(url, options));
                    if (notifyResponse(response, setLoaderStatus)) {
                      pushRoute(`/${response.content.key}`);
                    }
                  }}
                >
                  <T className="tt-se">create</T>
                </ButtonLoader>
              </form>
              <div className="jk-col horizontal">
                <T className="tt-ue cr-hd">or</T>
              </div>
              <div className="jk-col gap stretch">
                <T className="tt-se">join an mermaid</T>
                <Input expand label={<T className="tt-se cr-hd tx-s">key</T>} value={mermaidKey} onChange={setMermaidKey} />
                <Link href={`/${mermaidKey}`} target="_blank" rel="noopener noreferrer">
                  <Button submit icon={<OpenInNewIcon />} expand>
                    <T className="tt-se">join</T>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      {isLogged && (
        <div className="jk-col nowrap stretch">
          <T key="title" className="tt-se cr-hd">
            your latest mermaid files created
          </T>
          <div
            style={{ height: `calc(var(--100VH) - ${height}px - var(--pad-md) - var(--pad-md) - var(--tx-h-m))` }}
            className="wh-100"
          >
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
