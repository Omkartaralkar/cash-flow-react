import { upload } from "./api";

export function importExcel(file) {
  const formData = new FormData();
  formData.append("file", file);
  return upload("/import/excel", formData);
}
