import React from 'react';
import {
  Award,
  Box,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  History,
  KeyRound,
  Layers3,
  MonitorSmartphone,
  Package,
  RotateCcw,
  Route,
  ShieldCheck,
  Truck,
  Video,
} from 'lucide-react';
import { formatBytes } from '../../../lib/asset3d';

type FactItem = {
  label: string;
  value: React.ReactNode;
  helper?: string;
};

type ProductTypeFactsProps = {
  type: 'digital' | 'asset_3d' | 'service' | 'course' | 'physical';
  listing: any;
  stats?: any;
  asset3d?: {
    details?: any;
    analysis?: any;
    licenses?: any[];
  };
};

const isBlank = (value: any) => (
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)
);

const display = (value: any, fallback = 'Not specified') => {
  if (isBlank(value)) return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || fallback;
  return String(value);
};

const numberDisplay = (value: any, fallback = 'Not analyzed') => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed.toLocaleString() : fallback;
};

const formatSize = (value: any) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return formatBytes(parsed);
  return display(value);
};

const getFirst = (...values: any[]) => values.find((value) => !isBlank(value));

const renderList = (items: any[], empty = 'Not specified') => {
  const filtered = (items || []).filter(Boolean);
  if (!filtered.length) return empty;
  return (
    <ul className="space-y-1">
      {filtered.slice(0, 6).map((item, index) => (
        <li key={`${String(item)}-${index}`} className="leading-5">{String(item)}</li>
      ))}
    </ul>
  );
};

const totalStock = (variations: any[] = []) => {
  const stocked = variations
    .map((variant) => Number(variant?.stock))
    .filter((value) => Number.isFinite(value));
  if (!stocked.length) return 'Not specified';
  return stocked.reduce((sum, value) => sum + value, 0).toLocaleString();
};

const getCourseDuration = (listing: any) => {
  const modules = listing.metadata?.course?.modules || [];
  const totalSeconds = modules.reduce((acc: number, module: any) => (
    acc + (module.lessons || []).reduce((lessonAcc: number, lesson: any) => {
      const parts = String(lesson.duration || '0:00').split(':').map(Number);
      if (parts.length === 3) return lessonAcc + parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return lessonAcc + parts[0] * 60 + parts[1];
      return lessonAcc;
    }, 0)
  ), 0);

  if (!totalSeconds) return display(listing.metadata?.duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const makeFacts = ({ type, listing, stats, asset3d }: ProductTypeFactsProps): FactItem[] => {
  const metadata = listing.metadata || {};
  const course = metadata.course || {};
  const packages = metadata.packages || [];
  const selectedPackage = packages[0] || {};
  const variations = metadata.variations || [];
  const shippingRegions = metadata.shippingRegions || [];
  const details = asset3d?.details || {};
  const analysis = asset3d?.analysis || {};
  const licenses = asset3d?.licenses || [];
  const commercialLicense = licenses.find((license) => (
    String(license.license_type || '').includes('commercial') ||
    license.terms?.commercial ||
    license.terms?.games ||
    license.terms?.films
  ));

  if (type === 'digital') {
    return [
      { label: 'File type', value: display(getFirst(metadata.format, metadata.fileType, metadata.file_type)) },
      { label: 'File size', value: formatSize(getFirst(metadata.fileSize, metadata.file_size, metadata.fileSizeBytes, metadata.sizeBytes)) },
      { label: 'Version history', value: display(getFirst(metadata.versionHistory, metadata.version_history, metadata.version, metadata.releaseNotes)) },
      { label: 'License', value: display(getFirst(metadata.license, metadata.licenseName, metadata.license_name, metadata.usageRights)) },
      { label: 'Updates included', value: display(getFirst(metadata.updatesIncluded, metadata.updates_included, metadata.freeUpdates)) },
      { label: 'Device / activation limits', value: display(getFirst(metadata.deviceLimit, metadata.activationLimit, metadata.device_limit, metadata.maxActivations)) },
    ];
  }

  if (type === 'asset_3d') {
    return [
      { label: 'Interactive preview', value: display(getFirst(listing.metadata?.asset3d?.previewUrl, details.storefront_settings?.hero_mode === 'interactive_3d' ? 'GLB/GLTF preview' : null), 'Not available') },
      { label: 'Polygon count', value: numberDisplay(getFirst(analysis.polygon_count, analysis.triangle_count)) },
      { label: 'Texture resolution', value: display(Array.isArray(analysis.texture_resolutions) ? analysis.texture_resolutions.map((item: any) => item.label || `${item.width || '?'}x${item.height || '?'}`) : analysis.texture_resolutions, 'Not analyzed') },
      { label: 'Rigged / animated', value: `${display(getFirst(details.rigged, analysis.has_rig, listing.technical_metadata?.rigged, listing.metadata?.asset3d?.rigged), 'No')} / ${display(getFirst(details.animated, analysis.has_animations, listing.technical_metadata?.animated, listing.metadata?.asset3d?.animated), 'No')}` },
      { label: 'Supported engines', value: display(getFirst(details.supported_engines, listing.metadata?.asset3d?.enginesText)) },
      { label: 'LODs', value: display(getFirst(details.has_lods, analysis.lod_count ? `${analysis.lod_count} levels` : null, listing.technical_metadata?.has_lods, listing.metadata?.asset3d?.hasLods), 'Not specified') },
      { label: 'File size', value: formatSize(getFirst(details.download_size_bytes, analysis.file_size_bytes, listing.technical_metadata?.download_size_bytes)) },
      { label: 'Commercial-use license', value: commercialLicense?.name || listing.metadata?.asset3d?.licenseName || 'Not specified' },
    ];
  }

  if (type === 'service') {
    return [
      { label: 'Delivery time', value: display(selectedPackage.deliveryTime ? `${selectedPackage.deliveryTime} days` : metadata.deliveryTime) },
      { label: 'Revisions', value: metadata.revisionPolicy === 'unlimited' ? 'Unlimited' : display(selectedPackage.revisions) },
      { label: 'Intake questions', value: renderList((metadata.requirements || []).map((item: any) => item.question)) },
      { label: 'Available moments', value: display(getFirst(metadata.availability, metadata.capacityPerWeek ? `${metadata.capacityPerWeek} orders per week` : null)) },
      { label: 'Deliverables', value: renderList(selectedPackage.features || metadata.deliverables || []) },
    ];
  }

  if (type === 'course') {
    const modules = course.modules || [];
    const previewLessons = modules.flatMap((module: any) => (
      (module.lessons || []).filter((lesson: any) => lesson.isFreePreview || lesson.preview).map((lesson: any) => lesson.title)
    ));

    return [
      { label: 'Curriculum', value: modules.length ? `${modules.length} modules, ${stats?.lessons || 0} lessons` : 'Not specified' },
      { label: 'Duration', value: getCourseDuration(listing) },
      { label: 'Preview lessons', value: renderList(previewLessons, metadata.previewFileUrl ? 'Preview file available' : 'Not specified') },
      { label: 'Progress', value: display(getFirst(course.progressTracking, metadata.progressTracking, 'Tracked after enrollment')) },
      { label: 'Certificate requirements', value: display(getFirst(course.certificateRequirements, metadata.certificateRequirements, stats?.certificates > 0 ? 'Included' : null)) },
    ];
  }

  return [
    { label: 'Stock', value: totalStock(variations) },
    { label: 'Variants', value: variations.length ? variations.map((variant: any) => variant.name).filter(Boolean).join(', ') : 'Not specified' },
    { label: 'Shipping', value: shippingRegions.length ? shippingRegions.map((region: any) => `${region.name || 'Region'}: ${region.carrier || 'carrier TBD'}${region.time ? `, ${region.time}` : ''}`).join('; ') : 'Not specified' },
    { label: 'Tracking', value: display(getFirst(metadata.trackingIncluded, metadata.tracking, shippingRegions.some((region: any) => region.carrier) ? 'Carrier tracking when available' : null)) },
    { label: 'Returns', value: display(getFirst(metadata.returnPeriod ? `${metadata.returnPeriod} days` : null, metadata.returnPolicy)) },
  ];
};

const icons: Record<ProductTypeFactsProps['type'], React.ReactNode> = {
  digital: <Download className="h-5 w-5" />,
  asset_3d: <Box className="h-5 w-5" />,
  service: <CalendarClock className="h-5 w-5" />,
  course: <Video className="h-5 w-5" />,
  physical: <Package className="h-5 w-5" />,
};

const titleByType: Record<ProductTypeFactsProps['type'], string> = {
  digital: 'Digital product details',
  asset_3d: '3D asset specifications',
  service: 'Service details',
  course: 'Course details',
  physical: 'Product details',
};

const iconByLabel: Record<string, React.ReactNode> = {
  'File type': <FileText className="h-4 w-4" />,
  'File size': <Download className="h-4 w-4" />,
  'Version history': <History className="h-4 w-4" />,
  License: <ShieldCheck className="h-4 w-4" />,
  'Updates included': <RotateCcw className="h-4 w-4" />,
  'Device / activation limits': <MonitorSmartphone className="h-4 w-4" />,
  'Interactive preview': <Box className="h-4 w-4" />,
  'Polygon count': <Layers3 className="h-4 w-4" />,
  'Texture resolution': <Layers3 className="h-4 w-4" />,
  'Rigged / animated': <Route className="h-4 w-4" />,
  'Supported engines': <CheckCircle2 className="h-4 w-4" />,
  LODs: <Layers3 className="h-4 w-4" />,
  'Commercial-use license': <KeyRound className="h-4 w-4" />,
  'Delivery time': <CalendarClock className="h-4 w-4" />,
  Revisions: <RotateCcw className="h-4 w-4" />,
  'Intake questions': <FileText className="h-4 w-4" />,
  'Available moments': <CalendarClock className="h-4 w-4" />,
  Deliverables: <CheckCircle2 className="h-4 w-4" />,
  Curriculum: <FileText className="h-4 w-4" />,
  Duration: <CalendarClock className="h-4 w-4" />,
  'Preview lessons': <Video className="h-4 w-4" />,
  Progress: <CheckCircle2 className="h-4 w-4" />,
  'Certificate requirements': <Award className="h-4 w-4" />,
  Stock: <Package className="h-4 w-4" />,
  Variants: <Layers3 className="h-4 w-4" />,
  Shipping: <Truck className="h-4 w-4" />,
  Tracking: <Route className="h-4 w-4" />,
  Returns: <RotateCcw className="h-4 w-4" />,
};

export const ProductTypeFacts: React.FC<ProductTypeFactsProps> = (props) => {
  const facts = makeFacts(props);

  return (
    <section className="space-y-5 pt-8 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-300">
          {icons[props.type]}
        </div>
        <h3 className="text-2xl font-bold text-white">{titleByType[props.type]}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-white/5 bg-[#141414] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              {iconByLabel[fact.label]}
              <span>{fact.label}</span>
            </div>
            <div className="text-sm font-semibold leading-6 text-white">{fact.value}</div>
            {fact.helper && <p className="mt-1 text-xs leading-5 text-gray-500">{fact.helper}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};
