import pushup from "@/assets/pushup.png";
import squat from "@/assets/squat.png";
import situp from "@/assets/situp.png";
import plank from "@/assets/plank.png";

export const exercises = [
  { id: "push-up", name: "Push-up", img: pushup, target: "3 × 12 rep", score: 86 },
  { id: "squat", name: "Squat", img: squat, target: "3 × 15 rep", score: 92 },
  { id: "sit-up", name: "Sit-up", img: situp, target: "3 × 20 rep", score: 74 },
  { id: "plank", name: "Plank", img: plank, target: "3 × 45 dtk", score: 81 },
];

export const history = [
  { title: "Full Body Pemula", date: "Kemarin · 18 mnt", valid: 42, total: 48, img: squat },
  { title: "Upper Body Rumahan", date: "Sen · 22 mnt", valid: 35, total: 44, img: pushup },
  { title: "Core 10 Menit", date: "Sab · 10 mnt", valid: 50, total: 56, img: situp },
];

export const details: Record<string, { muscles: string; camera: string; steps: string[]; checks: string[] }> = {
  "push-up": {
    muscles: "Dada · Trisep · Bahu",
    camera: "Samping, 2–3 m",
    steps: ["Tangan selebar bahu, badan lurus.", "Turunkan dada hingga siku ±90°.", "Dorong kembali ke posisi awal."],
    checks: ["Pinggul turun", "Pinggul terlalu tinggi", "Turun kurang dalam", "Kepala menunduk"],
  },
  squat: {
    muscles: "Paha · Glutes · Core",
    camera: "Samping atau depan",
    steps: ["Kaki selebar bahu.", "Dorong pinggul ke belakang, turun.", "Paha sejajar lantai, lalu berdiri."],
    checks: ["Lutut masuk ke dalam", "Tumit terangkat", "Punggung membungkuk", "Turun kurang dalam"],
  },
  "sit-up": {
    muscles: "Perut · Hip flexor",
    camera: "Samping, 2 m",
    steps: ["Berbaring, lutut ditekuk.", "Angkat badan ke arah lutut.", "Turun perlahan terkontrol."],
    checks: ["Menarik leher", "Gerakan terlalu cepat", "Rentang kurang penuh"],
  },
  plank: {
    muscles: "Core · Bahu",
    camera: "Samping, 2–3 m",
    steps: ["Siku tepat di bawah bahu.", "Badan lurus dari kepala ke tumit.", "Tahan dan bernapas normal."],
    checks: ["Pinggul turun", "Pinggul terlalu tinggi", "Kepala menunduk"],
  },
};

export const plan = [
  { day: "Sen", date: 19, title: "Upper Body", items: ["Push-up 3×12", "Plank 3×45 dtk"], done: true },
  { day: "Sel", date: 20, title: "Lower Body", items: ["Squat 3×15", "Sit-up 3×20"], today: true },
  { day: "Rab", date: 21, title: "Istirahat aktif", items: ["Stretching 10 mnt"] },
  { day: "Kam", date: 22, title: "Full Body", items: ["Push-up 3×10", "Squat 3×12", "Plank 2×40 dtk"] },
  { day: "Jum", date: 23, title: "Istirahat", items: [] },
  { day: "Sab", date: 24, title: "Core", items: ["Sit-up 3×20", "Plank 3×50 dtk"] },
  { day: "Min", date: 25, title: "Istirahat", items: [] },
];
