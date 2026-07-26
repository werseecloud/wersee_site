import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import { Box3, Vector3 } from 'three';
import {
  Box,
  CheckCircle2,
  Grid3X3,
  Info,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Triangle,
  X,
} from 'lucide-react';
import { formatBytes } from '../../lib/asset3d';

type ViewerSettings = {
  auto_rotate?: boolean;
  background_color?: string;
  grid?: boolean;
  ground_shadow?: boolean;
  lighting_intensity?: number;
  exposure?: number;
  model_scale?: number;
  animation_loop?: boolean;
};

type Wersee3DViewerProps = {
  previewUrl?: string | null;
  posterUrl?: string | null;
  title: string;
  settings?: ViewerSettings | null;
  technicalSummary?: {
    format?: string | null;
    sizeBytes?: number | null;
    vertices?: number | null;
    triangles?: number | null;
    materials?: number | null;
    textures?: number | null;
    animations?: number | null;
  };
  compact?: boolean;
};

const Model = ({ url, scale = 1 }: { url: string; scale?: number }) => {
  const gltf = useGLTF(url);

  useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = new Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z);
    if (maxAxis > 0) {
      gltf.scene.scale.setScalar((2 / maxAxis) * scale);
    }
    const center = new Vector3();
    box.getCenter(center);
    gltf.scene.position.sub(center.multiplyScalar(gltf.scene.scale.x));
  }, [gltf.scene, scale]);

  return <primitive object={gltf.scene} />;
};

const RenderLoopGovernor = ({ active }: { active: boolean }) => {
  useFrame((state) => {
    if (!active) return;
    state.gl.render(state.scene, state.camera);
  }, 1);
  return null;
};

export const Wersee3DViewer: React.FC<Wersee3DViewerProps> = ({
  previewUrl,
  posterUrl,
  title,
  settings,
  technicalSummary,
  compact = false,
}) => {
  const [activated, setActivated] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(Boolean(settings?.auto_rotate));
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(Boolean(settings?.grid));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const canRender = Boolean(previewUrl) && !failed;
  const background = settings?.background_color || '#0A0A0A';

  const controls = (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setAutoRotate((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
          aria-label={autoRotate ? 'Pause auto rotate' : 'Start auto rotate'}
          title={autoRotate ? 'Pause auto rotate' : 'Start auto rotate'}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setShowGrid((value) => !value)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${showGrid ? 'bg-white text-black' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          aria-label="Toggle grid"
          title="Toggle grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setWireframe((value) => !value)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${wireframe ? 'bg-white text-black' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          aria-label="Toggle wireframe"
          title="Toggle wireframe"
        >
          <Triangle className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActivated(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Reset viewer"
          title="Reset viewer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setInspectorOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Open technical information"
          title="Technical information"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-[#101010] ${compact ? 'aspect-[16/11]' : 'aspect-video min-h-[360px]'}`}
      style={{ background }}
    >
      {!activated || !canRender ? (
        <div className="absolute inset-0">
          {posterUrl ? (
            <img src={posterUrl} alt={title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.10),transparent_34%),#101010]">
              <Box className="h-16 w-16 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

          <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-gray-300 backdrop-blur-xl">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Powered by Forge Engine
              </div>
              <h3 className="text-2xl font-semibold tracking-normal text-white">{title}</h3>
              <p className="mt-1 max-w-xl text-sm text-gray-400">
                {previewUrl ? 'Interactive preview is available.' : 'Interactive preview is not available for the uploaded source format yet.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setActivated(Boolean(previewUrl));
              }}
              disabled={!previewUrl}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
            >
              <Maximize2 className="h-4 w-4" />
              View in 3D
            </button>
          </div>
        </div>
      ) : (
        <>
          <Canvas
            frameloop={isVisible ? 'always' : 'never'}
            dpr={[1, 1.75]}
            camera={{ position: [2.4, 1.6, 3.2], fov: 45 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = Number(settings?.exposure || 1);
            }}
            onError={() => setFailed(true)}
          >
            <color attach="background" args={[background]} />
            <ambientLight intensity={0.65 * Number(settings?.lighting_intensity || 1)} />
            <directionalLight position={[4, 5, 3]} intensity={1.6 * Number(settings?.lighting_intensity || 1)} castShadow />
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <Model url={previewUrl || ''} scale={Number(settings?.model_scale || 1)} />
              </Bounds>
              <Environment preset="studio" />
            </Suspense>
            {showGrid && <gridHelper args={[10, 10, '#404040', '#262626']} />}
            <OrbitControls makeDefault enableDamping autoRotate={autoRotate} autoRotateSpeed={1.2} />
            <RenderLoopGovernor active={isVisible} />
          </Canvas>
          {controls}
        </>
      )}

      <AnimatePresence>
        {inspectorOpen && (
          <div className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-white/10 bg-[#0A0A0A]/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-400" />
                <h4 className="font-semibold text-white">Technical info</h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close technical information"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Format', technicalSummary?.format || 'Not analyzed'],
                ['Download size', formatBytes(technicalSummary?.sizeBytes)],
                ['Vertices', technicalSummary?.vertices?.toLocaleString() || 'Not analyzed'],
                ['Triangles', technicalSummary?.triangles?.toLocaleString() || 'Not analyzed'],
                ['Materials', technicalSummary?.materials?.toLocaleString() || 'Not analyzed'],
                ['Textures', technicalSummary?.textures?.toLocaleString() || 'Not analyzed'],
                ['Animations', technicalSummary?.animations?.toLocaleString() || '0'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/8 py-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-200">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-400">
              Original buyer files are delivered through short-lived signed URLs after purchase verification.
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
