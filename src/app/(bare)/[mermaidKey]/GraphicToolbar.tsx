import { Button, DownloadIcon, FullscreenExitIcon, FullscreenIcon, LoadingIcon, MinusIcon, PlusIcon, RefreshIcon, T } from 'components';
import { downloadBlobAsFile } from 'helpers';
import { useCallback } from 'react';
import { MermaidTheme } from 'types';

interface GraphicToolbarProps {
  zoom: number;
  isRendering: boolean;
  isFullscreen: boolean;
  onZoom: (delta: number) => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  renderedSvg: string;
  mermaidTheme: MermaidTheme;
  mermaidKey: string;
}

export function GraphicToolbar(props: GraphicToolbarProps) {
  const { zoom, isRendering, isFullscreen, onZoom, onReset, onToggleFullscreen, renderedSvg, mermaidTheme, mermaidKey } = props;

  const handleExportSVG = useCallback(() => {
    if (!renderedSvg) return;
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlobAsFile(blob, `diagram-${mermaidKey}.svg`);
  }, [renderedSvg, mermaidKey]);

  const handleExportPNG = useCallback(() => {
    if (!renderedSvg) return;
    const img = new Image();
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const scale = 2;
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = mermaidTheme === 'dark' ? '#1e1e2e' : '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `diagram-${mermaidKey}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [renderedSvg, mermaidTheme, mermaidKey]);

  return (
    <div className="jk-row gap jk-pg-xsm">
      <Button onClick={() => onZoom(-0.1)} icon={<MinusIcon size="small" />} size="tiny" type="light" />
      <span style={{ minWidth: '42px', textAlign: 'center', fontSize: '0.8rem', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
      <Button onClick={() => onZoom(0.1)} icon={<PlusIcon size="small" />} size="tiny" type="light" />
      <div style={{ width: '1px', height: '16px', background: 'var(--t-color-gray-4)', margin: '0 4px' }} />
      <Button onClick={() => onZoom(1 - zoom)} size="tiny" type="light">
        100%
      </Button>
      <Button onClick={() => onZoom(2 - zoom)} size="tiny" type="light">
        200%
      </Button>
      <Button onClick={onReset} icon={<RefreshIcon size="small" />} size="tiny" type="light">
        <T className="tt-se">reset</T>
      </Button>
      <Button onClick={handleExportSVG} disabled={!renderedSvg} icon={<DownloadIcon size="small" />} size="tiny">
        SVG
      </Button>
      <Button onClick={handleExportPNG} disabled={!renderedSvg} icon={<DownloadIcon size="small" />} size="tiny">
        PNG
      </Button>
      <div style={{ flex: 1 }} />
      {isRendering && <LoadingIcon size="small" />}
      <Button
        onClick={onToggleFullscreen}
        icon={isFullscreen ? <FullscreenExitIcon size="small" /> : <FullscreenIcon size="small" />}
        size="tiny"
        type="light"
      />
    </div>
  );
}
