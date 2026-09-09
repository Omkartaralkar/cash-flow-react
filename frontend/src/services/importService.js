import { upload } from "./api";

export function importExcel(formData) {
  return upload("/api/import/excel", formData);
}