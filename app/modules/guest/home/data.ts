export type Category = {
  id: string;
  label: string;
  count: number;
  icon: string;
};

export const jobCategories: Category[] = [
  { id: "fresher", label: "Fresher Jobs", count: 9, icon: "userPlus" },
  { id: "full-time", label: "Full-time Jobs", count: 12, icon: "briefcase" },
  { id: "part-time", label: "Part-time Jobs", count: 0, icon: "clock" },
  { id: "internship", label: "Internship", count: 0, icon: "arrowRight" },
  { id: "remote", label: "Remote Jobs", count: 0, icon: "mapPin" },
  { id: "office", label: "Office / Data Entry Jobs", count: 0, icon: "building" },
  { id: "it", label: "IT Jobs", count: 0, icon: "briefcase" },
  { id: "noida", label: "Jobs in Noida", count: 7, icon: "mapPin" },
  { id: "delivery", label: "Delivery Jobs", count: 0, icon: "send" },
  { id: "customer", label: "Customer Care / Telecaller Jobs", count: 0, icon: "briefcase" },
];
