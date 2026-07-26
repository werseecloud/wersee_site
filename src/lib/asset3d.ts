export const ASSET_3D_SUBCATEGORIES = [
  '3D Models',
  'Characters',
  'Creatures',
  'Vehicles',
  'Architecture',
  'Environments',
  'Props',
  'Furniture',
  'Weapons',
  'Clothing',
  'Accessories',
  'Nature',
  'Plants',
  'Materials',
  'Textures',
  'HDRIs',
  'Animation Packs',
  'Rigged Models',
  'Game-Ready Assets',
  'VFX Assets',
  'Industrial Models',
  'Printable Models',
  'CAD Assets',
  'Asset Packs',
];

export const ASSET_3D_TYPES = [
  { id: 'single_model', label: 'Single 3D model' },
  { id: 'model_pack', label: 'Model pack' },
  { id: 'character', label: 'Character' },
  { id: 'animated_character', label: 'Animated character' },
  { id: 'environment', label: 'Environment' },
  { id: 'material_texture_pack', label: 'Material or texture pack' },
  { id: 'animation_pack', label: 'Animation pack' },
  { id: 'printable_model', label: 'Printable model' },
  { id: 'cad_industrial_asset', label: 'CAD or industrial asset' },
  { id: 'other', label: 'Other 3D asset' },
];

export const ASSET_3D_FILE_ROLES = [
  { id: 'primary_model', label: 'Primary model' },
  { id: 'alternative_format', label: 'Alternative format' },
  { id: 'source_file', label: 'Source file' },
  { id: 'texture', label: 'Texture' },
  { id: 'material', label: 'Material' },
  { id: 'animation', label: 'Animation' },
  { id: 'rig', label: 'Rig' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'license', label: 'License' },
  { id: 'preview_only', label: 'Preview-only file' },
  { id: 'buyer_download', label: 'Buyer download file' },
  { id: 'bonus_content', label: 'Bonus content' },
];

export const ASSET_3D_LICENSES = [
  { id: 'personal', label: 'Personal License' },
  { id: 'commercial', label: 'Commercial License' },
  { id: 'extended_commercial', label: 'Extended Commercial License' },
  { id: 'editorial', label: 'Editorial License' },
  { id: '3d_printing', label: '3D Printing License' },
  { id: 'game_development', label: 'Game Development License' },
  { id: 'film_animation', label: 'Film and Animation License' },
  { id: 'custom', label: 'Custom License' },
];

export const ASSET_3D_ACCEPT = [
  '.glb', '.gltf', '.fbx', '.obj', '.mtl', '.stl', '.blend', '.dae', '.3ds', '.ply',
  '.usd', '.usda', '.usdc', '.usdz', '.abc', '.x3d', '.vrm', '.bvh', '.ma', '.mb',
  '.max', '.c4d', '.step', '.stp', '.iges', '.igs', '.dwg', '.dxf', '.zip', '.7z',
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.tiff', '.tif', '.tga', '.bmp',
  '.dds', '.exr', '.hdr', '.ktx', '.ktx2', '.basis', '.pdf', '.txt', '.md',
].join(',');

export const formatBytes = (bytes?: number | null) => {
  const value = Number(bytes || 0);
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const formatMinorCurrency = (minor: number, currency = 'eur') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
};

export const isBrowserPreviewFormat = (format?: string | null) => {
  const normalized = String(format || '').toLowerCase().replace('.', '');
  return ['glb', 'gltf', 'model/gltf-binary', 'model/gltf+json'].includes(normalized);
};
