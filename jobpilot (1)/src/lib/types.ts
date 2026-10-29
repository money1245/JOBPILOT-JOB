export type JobStatus = "Saved" | "Applied" | "Interview" | "Offer" | "Rejected";
export type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  url: string;
  salary: string;
  deadline: string;
  status: JobStatus;
  notes: string;
  createdAt: string;
};
export type Resume = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
};
export const emptyResume: Resume = {
  fullName: "", email: "", phone: "", location: "", headline: "",
  summary: "", skills: "", experience: "", education: ""
};
