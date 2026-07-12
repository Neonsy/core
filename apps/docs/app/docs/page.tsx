import { SdkIndex } from '@/components/SdkIndex';
import { loadApiDocs } from '@/lib/api-docs';

export const metadata = { title: 'SDK' };

export default function DocsIndexPage(): React.ReactElement {
  return <SdkIndex docs={loadApiDocs()} version="latest" basePath="/docs" />;
}
