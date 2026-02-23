import { TwoContentLayout } from 'components';
import { jukiApiManager } from 'config';
import { DEFAULT_METADATA } from 'config/constants';
import { get, oneTab } from 'helpers';
import { type Metadata } from 'next';
import { ContentResponse, MermaidResponseDTO, MetadataResponseDTO } from 'types';
import { MermaidNotFoundCard } from './MermaidNotFoundCard';
import { MermaidViewPage } from './MermaidViewPage';

type Props = {
  params: Promise<{ mermaidKey: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const excalidrawKey = (await params).mermaidKey;

  const result = await get<ContentResponse<MetadataResponseDTO>>(jukiApiManager.API_V2.mermaid.getMetadata({ params: { key: excalidrawKey } }).url);

  const { title, description } = result?.success ? result.content : { title: '', description: '' };

  return {
    ...DEFAULT_METADATA,
    title,
    description,
    openGraph: {
      ...DEFAULT_METADATA.openGraph,
      title,
      description,
      // images: [
      //   {
      //     url: cover,
      //     width: 400,
      //     height: 210,
      //   },
      // ],
    },
    twitter: {
      ...DEFAULT_METADATA.twitter,
      title,
      description,
    },
  };
}

export default async function ProblemViewPage({ params }: Props) {
  const mermaidKey = (await params).mermaidKey;

  const mermaidResponse = await get<ContentResponse<MermaidResponseDTO>>(jukiApiManager.API_V2.mermaid.getData({ params: { key: mermaidKey } }).url);

  if (mermaidResponse.success) {
    return <MermaidViewPage mermaid={mermaidResponse.content} />;
  }

  return <TwoContentLayout tabs={oneTab(<MermaidNotFoundCard />)} />;
}
