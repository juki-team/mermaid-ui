import { RootLayout, UserStoreProvider } from 'components';
import { jukiApiManager } from 'config';
import { EMPTY_COMPANY, EMPTY_USER } from 'config/constants';
import { get } from 'helpers';
import { type PropsWithChildren } from 'react';
import './styles.scss';
import type { ContentResponseType, PingResponseDTO } from 'types';
import { Initializer } from './Initializer';

const getInitialUser = async () => {
  
  const session = await get<ContentResponseType<PingResponseDTO>>(jukiApiManager.API_V2.auth.ping().url);
  
  return {
    user: session?.success ? session?.content.user : EMPTY_USER,
    company: session?.success ? session?.content.company : EMPTY_COMPANY,
    isLoading: false,
  };
};

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <UserStoreProvider initialUser={await getInitialUser()}>
      <Initializer />
      <RootLayout>
        {children}
      </RootLayout>
    </UserStoreProvider>
  );
}
