export type BtechYear = "1st" | "2nd" | "3rd" | "4th";

export interface Subject {
  id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  description?: string;
  materialCount: number;
  questionCount: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  subjectId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  materialType: "past_paper" | "notes" | "syllabus" | "reference";
  year?: number;
  unit?: number;
  uploadedAt?: string | null;
  processedAt?: string | null;
  processingStatus?: "queued" | "processing" | "completed" | "failed";
  processingError?: string | null;
  size: number;
}

export interface SubjectWithMaterials extends Subject {
  materials: Material[];
}
