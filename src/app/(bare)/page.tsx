'use client';

import { Button, ButtonLoader, Input, LoginIcon, LogoutIcon, OpenInNewIcon, T, UserChip } from 'components';
import { jukiApiManager } from 'config';
import { authorizedRequest, cleanRequest } from 'helpers';
import { useJukiNotification, useJukiUser, useRouterStore, useUIStore, useUserStore } from 'hooks';
import { useState } from 'react';
import { ContentResponseType, QueryParamKey, Status } from 'types';

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
    <div className="jk-col extend center gap">
      <div className="jk-col gap">
        {isLogged ? (
          <>
            <T className="tt-se">you are logged in as</T>
            <UserChip imageUrl={imageUrl} nickname={nickname} companyKey={company.key} />
            <ButtonLoader size="tiny" onClick={(setLoader) => logout({ setLoader })} type="light" icon={<LogoutIcon />}>
              <T className="ws-np tt-se">sign out</T>
            </ButtonLoader>
          </>
        ) : (
          <Button onClick={() => setSearchParams({ name: QueryParamKey.SIGN_IN, value: 'true' })} icon={<LoginIcon />} expand>
            <T className="ws-np tt-se">sign in</T>
          </Button>
        )}
      </div>
      <div className="jk-col gap jk-pg jk-br-ie bc-we stretch">
        {isLogged ? (
          <>
            <form className="jk-col gap">
              <T className="tt-se">create a new mermaid</T>
              <Input expand label={<T className="tt-se">name</T>} value={name} onChange={setName} />
              <ButtonLoader
                submit
                expand
                onClick={async (setLoaderStatus) => {
                  setLoaderStatus(Status.LOADING);
                  const { url, ...options } = jukiApiManager.API_V2.excalidraw.create({ body: { name } });
                  const response = cleanRequest<ContentResponseType<{ key: string }>>(await authorizedRequest(url, options));
                  if (notifyResponse(response, setLoaderStatus)) {
                    pushRoute(`/${response.content.key}`);
                  }
                }}
              >
                <T className="tt-se">create</T>
              </ButtonLoader>
            </form>
            <div className="jk-divider">
              <T className="tt-ue">or</T>
            </div>
            <T className="tt-se">join an mermaid</T>
            <Input expand label={<T className="tt-se">key</T>} value={mermaidKey} onChange={setMermaidKey} />
            <Link href={`/${mermaidKey}`} target="_blank" rel="noopener noreferrer">
              <Button submit icon={<OpenInNewIcon />} expand>
                <T className="tt-se">join</T>
              </Button>
            </Link>
          </>
        ) : (
          <>
            <T className="tt-se">to create or access an mermaid, you must first log in</T>
          </>
        )}
      </div>
    </div>
  );
}
