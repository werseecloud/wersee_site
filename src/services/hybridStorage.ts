// Compatibility exports while product surfaces move to the provider-neutral API.
export {
  deleteWerseeFile,
  downloadWerseeFile,
  listWerseeFiles,
  moveWerseeFile,
  resolveWerseeFile,
  resumeWerseeUpload,
  uploadWerseeFile,
} from './werseeStorage';
export type { WerseeStoredObject, WerseeUploadOptions } from './werseeStorage';
