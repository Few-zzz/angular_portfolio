import {
  AfterViewInit, Component, ElementRef, HostBinding, HostListener,
  OnDestroy, ViewChild, computed, signal
} from '@angular/core';

type Theme = 'dark' | 'light';
type Lang = 'th' | 'en';

interface Particle { x: number; y: number; vx: number; vy: number; radius: number; color: string; }

interface Project {
  no: string;
  image?: string;
  kind?: string;
  icon?: string[];
  pdf?: string;
  tags: string[];
  title: string;
  desc: string;
  role: string;
}

interface Certificate { img: string; title: string; org: string; date: string; }

/* Particle field, retuned to the steel accent so it reads as a technical
   ground in both themes instead of the old indigo/pink glow. */
const THEME_CANVAS = {
  light: { trail: 'rgba(242, 242, 243, 0.30)', composite: 'source-over' as GlobalCompositeOperation, alpha: 0.34, palette: ['#5980a6', '#749dc4', '#94bcd3'] },
  dark: { trail: 'rgba(26, 28, 29, 0.28)', composite: 'lighter' as GlobalCompositeOperation, alpha: 0.55, palette: ['#5980a6', '#749dc4', '#94bce3'] }
};

const SUN = ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'];
const MOON = ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'];

/* Lucide paths at stroke-width 1.5 — code, server, database, smartphone,
   cpu, memory, wrench, clipboard-check. */
const SKILL_ICONS: string[][] = [
  ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  ['M4 4h16v6H4z', 'M4 14h16v6H4z', 'M8 7h.01', 'M8 17h.01'],
  ['M3 5c0-1.66 4.03-3 9-3s9 1.34 9 3-4.03 3-9 3-9-1.34-9-3Z', 'M3 5v7c0 1.66 4.03 3 9 3s9-1.34 9-3V5', 'M3 12v7c0 1.66 4.03 3 9 3s9-1.34 9-3v-7'],
  ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M11 18h2'],
  ['M6 6h12v12H6z', 'M9 2v3', 'M15 2v3', 'M9 19v3', 'M15 19v3', 'M2 9h3', 'M2 15h3', 'M19 9h3', 'M19 15h3'],
  ['M4 8h16v8H4z', 'M8 8V5', 'M16 8V5', 'M8 19v-3', 'M16 19v-3'],
  ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.4 6.4a2 2 0 0 1-2.8-2.8l6.4-6.4a6 6 0 0 1 7.9-7.9Z'],
  ['M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 2h6v4H9z', 'm9 14 2 2 4-4']
];

const PROJECT_ICONS = {
  database: SKILL_ICONS[2],
  doc: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M15 2v5h5', 'M8 12h8', 'M8 16h8'],
  network: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z']
};

const PROJECT_META = [
  { no: 'PRJ 01', image: 'V-Fresh.png', pdf: 'https://drive.google.com/file/d/1DANoJK3dT4KO2cx15d8tWNkyYZkYUdZi/view?usp=sharing', tags: ['React Native', 'Expo', 'Supabase', 'Agora'] },
  { no: 'PRJ 02', image: 'Smart Agriculture System.png', pdf: 'https://drive.google.com/file/d/1WktLarO58SoWDAysT_vOYmE4UWxIeO9Q/view?usp=sharing', tags: ['ESP32', 'IoT', 'PCB Design'] },
  { no: 'PRJ 03', kind: 'Database / Backend', icon: PROJECT_ICONS.database, tags: ['SQL', 'Database Design', 'Backend'] },
  { no: 'PRJ 04', image: 'IoT Shrimp Farm.png', pdf: 'https://drive.google.com/file/d/1VHvYFRuAO9Vy6GikAmccSmzvrfNdukvg/view?usp=sharing', tags: ['IoT', 'ESP32', 'PostgreSQL', 'Node.js', 'React', 'Nginx'] },
  { no: 'PRJ 05', image: '8-bit CPU Design.png', pdf: 'https://drive.google.com/file/d/1HZfBWmmP_Ip2lQzZKT2FVIm_f-hydUu0/view?usp=sharing', tags: ['VHDL', 'Verilog', 'FPGA', 'Xilinx'] },
  { no: 'PRJ 06', kind: 'Documentation', icon: PROJECT_ICONS.doc, pdf: 'https://drive.google.com/file/d/1AQV4LdDOUfsZBX9IeWVjBqf1yILtf3_A/view?usp=sharing', tags: ['ISO 29110', 'Documentation', 'PM'] },
  { no: 'PRJ 07', kind: 'Network Research', icon: PROJECT_ICONS.network, pdf: 'https://drive.google.com/file/d/1fjkqMTIZZQc9PaTKvGWuKdNiFa65fEhf/view?usp=sharing', tags: ['Network', 'Active-Active', 'High Availability', 'SA'] }
];

const CERT_IMAGES = ['cert-aws.png', 'cert-teacher.png', 'cert-aws-full.png', 'cert-research.png', 'cert-datascience.png', 'cert-cloudbased.png', 'cert-logistics.png', 'cert-business.png'];

const COPY = {
  th: {
    'nav.about': 'เกี่ยวกับ', 'nav.education': 'การศึกษา', 'nav.skills': 'ทักษะ',
    'nav.projects': 'ผลงาน', 'nav.certificates': 'เกียรติบัตร', 'nav.contact': 'ติดต่อ',
    'hero.kicker': 'Portfolio / 2026 — มหาวิทยาลัยศรีปทุม',
    'hero.name': 'วงศกร ศรีทองเทศ',
    'hero.desc': 'นักศึกษาวิศวกรรมคอมพิวเตอร์ พัฒนาเว็บ โมบายแอป และระบบ IoT ตั้งแต่ระดับฮาร์ดแวร์ ESP32 และ FPGA ไปจนถึงฐานข้อมูลและหน้าใช้งานจริง',
    'hero.btnProjects': 'ดูผลงาน', 'hero.btnContact': 'ติดต่อผม',
    'about.title': 'เกี่ยวกับผม',
    'about.p1': 'สวัสดีครับ ผมชื่อ วงศกร ศรีทองเทศ นักศึกษาสาขาวิศวกรรมคอมพิวเตอร์ ที่หลงใหลในการสร้างสรรค์เทคโนโลยีและนวัตกรรมใหม่ๆ',
    'about.p2': 'มีประสบการณ์ในการพัฒนาทั้ง Web, Mobile Application, IoT และการออกแบบระบบ Hardware เช่น ESP32, FPGA พร้อมทั้งการจัดการ Database',
    'about.p3': 'สนใจการเรียนรู้สิ่งใหม่ๆ และพร้อมเปิดรับโอกาสในการทำงานร่วมกับทีม เพื่อพัฒนาทักษะและสร้างผลงานที่มีคุณภาพ',
    'edu.title': 'การศึกษา', 'edu.school': 'สถาบัน', 'edu.degree': 'วุฒิ / แผนการเรียน', 'edu.period': 'ช่วงเวลา',
    'skills.title': 'ทักษะ', 'proj.title': 'ผลงาน', 'cert.title': 'เกียรติบัตร',
    'proj.roleLabel': 'หน้าที่', 'proj.openDoc': 'ดูเอกสาร',
    'proj.searchPlaceholder': 'ค้นหาผลงาน เช่น ESP32, IoT, React',
    'proj.clear': 'ล้าง', 'proj.noResults': 'ไม่พบผลงานที่ตรงกับคำค้นหา',
    'cert.viewFull': 'ดูภาพเต็ม',
    'contact.title': 'สนใจร่วมงาน ติดต่อผมได้เลย',
    'contact.desc': 'เปิดรับโอกาสฝึกงานและร่วมงานด้านพัฒนาซอฟต์แวร์ IoT และระบบฐานข้อมูล',
    'footer': 'Portfolio — วิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยศรีปทุม'
  },
  en: {
    'nav.about': 'About', 'nav.education': 'Education', 'nav.skills': 'Skills',
    'nav.projects': 'Projects', 'nav.certificates': 'Certificates', 'nav.contact': 'Contact',
    'hero.kicker': 'Portfolio / 2026 — Sripatum University',
    'hero.name': 'Wongsakon Sritongted',
    'hero.desc': 'Computer Engineering student building web, mobile and IoT systems — from ESP32 and FPGA hardware up to databases and the interfaces on top of them.',
    'hero.btnProjects': 'View projects', 'hero.btnContact': 'Contact me',
    'about.title': 'About me',
    'about.p1': "Hi, I'm Wongsakon Sritongted, a Computer Engineering student passionate about creating technology and innovation.",
    'about.p2': 'Experienced in developing Web, Mobile Applications, IoT, and Hardware design such as ESP32, FPGA, along with Database management.',
    'about.p3': 'Always eager to learn new things and open to opportunities to work with a team to develop skills and produce quality work.',
    'edu.title': 'Education', 'edu.school': 'Institution', 'edu.degree': 'Degree / Program', 'edu.period': 'Period',
    'skills.title': 'Skills', 'proj.title': 'Projects', 'cert.title': 'Certificates',
    'proj.roleLabel': 'Role', 'proj.openDoc': 'Open document',
    'proj.searchPlaceholder': 'Search projects — ESP32, IoT, React…',
    'proj.clear': 'Clear', 'proj.noResults': 'No projects match your search',
    'cert.viewFull': 'View full',
    'contact.title': 'Interested in collaborating? Reach out',
    'contact.desc': 'Open to internships and collaboration in software development, IoT and database systems.',
    'footer': 'Portfolio — Computer Engineering, Sripatum University'
  }
} as const;

const CONTENT = {
  th: {
    stats: ['โปรเจกต์', 'เกียรติบัตร', 'ปีที่ศึกษา', 'ภาษา'],
    specs: [['สาขา', 'วิศวกรรมคอมพิวเตอร์'], ['สถาบัน', 'มหาวิทยาลัยศรีปทุม'], ['เบอร์โทร', '063-3130850'], ['ภาษา', 'ไทย, อังกฤษ']],
    education: [
      { school: 'มหาวิทยาลัยศรีปทุม', degree: 'ปริญญาตรี คณะเทคโนโลยี', major: 'สาขาวิศวกรรมคอมพิวเตอร์', year: '2023 - ปัจจุบัน' },
      { school: 'โรงเรียนดรุณาราชบุรี', degree: 'มัธยมศึกษาตอนปลาย', major: 'แผนการเรียน วิทย์ - คณิต', year: '2020 - 2022' }
    ],
    skills: [
      ['Frontend', 'HTML, CSS, JavaScript, React'], ['Backend', 'Node.js, Python, PHP, Express'],
      ['Database', 'MySQL, MongoDB, PostgreSQL, Supabase'], ['Mobile', 'React Native, Expo'],
      ['IoT & Hardware', 'ESP32, Arduino, ออกแบบเซ็นเซอร์'], ['FPGA / SoC', 'Xilinx, VHDL, Verilog, CPU 8-bit'],
      ['เครื่องมือ', 'Git, VS Code, Figma, Xilinx ISE'], ['มาตรฐาน', 'การจัดทำเอกสาร ISO 29110']
    ],
    projects: [
      { title: 'Application V-Fresh', desc: 'แอปพลิเคชันสำหรับสั่งซื้อผักผลไม้สดจากฟาร์มถึงบ้านเพื่อเกษตรกร', role: 'ทำหน้าแอปฝั่งของ Seller และระบบ Live โดย Agora พร้อมจัดการ Database ด้วย Supabase' },
      { title: 'ระบบการจัดการเกษตรอัจฉริยะ', desc: 'โครงงาน "คอนโดปลูกผัก" เพื่อลดปัญหาพื้นที่ปลูกไม่พอและลดเวลาในการดูแล ด้วยระบบวัดความชื้นในดิน รดน้ำอัตโนมัติ และแสดงผลผ่าน Dashboard', role: 'ออกแบบบอร์ด ESP32 และสั่งทำเพื่อใช้งานจริง พร้อมระบบควบคุมการเกษตรแบบอัตโนมัติ' },
      { title: 'ระบบจัดการห้องสมุดด้วย SQL', desc: 'การทำเว็บจัดการห้องสมุดตัวอย่าง สำหรับยืม-คืนหนังสือและบริหารข้อมูลสมาชิก', role: 'ออกแบบ Database และพัฒนา Backend บางส่วนสำหรับระบบจัดการหนังสือและสมาชิก' },
      { title: 'ฟาร์มกุ้ง IoT', desc: 'ระบบ IoT-Farm เลี้ยงกุ้งก้ามกราม มอนิเตอร์คุณภาพน้ำด้วย ESP32 + Sensor (pH, Temp) ส่งข้อมูลผ่าน HTTP ขึ้น Cloud และแสดงผลบน Responsive Web Dashboard', role: 'จัดการระบบ Database สำหรับฟาร์มกุ้งอัจฉริยะ เก็บข้อมูลคุณภาพน้ำและสภาพแวดล้อม' },
      { title: 'ออกแบบ CPU 8-bit', desc: 'ออกแบบการทำงานของ CPU 8 บิต เขียนโค้ดด้วยภาษา VHDL และ Verilog สำหรับ FPGA และ SoC ด้วย Xilinx', role: 'ออกแบบโครงสร้างการทำงาน และแก้โค้ดบางส่วน' },
      { title: 'การจัดทำเอกสาร ISO 29110', desc: 'จัดทำและบริหารจัดการเอกสารตามมาตรฐาน ISO 29110 สำหรับกระบวนการพัฒนาซอฟต์แวร์', role: 'Project Manager (PM)' },
      { title: 'วิจัยการออกแบบ Network Active-Active', desc: 'งานวิจัยการออกแบบระบบเครือข่ายแบบ Active-Active เพื่อเพิ่มความพร้อมใช้งาน (High Availability) และกระจายโหลดอย่างมีประสิทธิภาพ', role: 'System Analyst (SA) ออกแบบ Diagram ของระบบ' }
    ],
    certificates: [
      { title: 'AWS Academy - Machine Learning Foundations', org: 'AWS Academy (20 ชั่วโมง)', date: '16 ก.พ. 2026' },
      { title: 'Data Science (45 ชั่วโมง)', org: 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ', date: '6 มี.ค. 2026' },
      { title: 'การใช้เทคโนโลยีเพื่อพัฒนาการวิจัย', org: 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ (6 ชั่วโมง)', date: '6 มี.ค. 2026' },
      { title: 'สมรรถนะครูยุคดิจิทัล', org: 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ (6 ชั่วโมง)', date: '6 มี.ค. 2026' },
      { title: 'เครื่องมือ Cloud-Based ศตวรรษ 21', org: 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', date: '2026' },
      { title: 'โลจิสติกส์และโซ่อุปทานเบื้องต้น', org: 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', date: '2026' },
      { title: 'สุดยอดแนวคิดธุรกิจยุคดิจิทัล', org: 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', date: '2026' },
      { title: 'ทักษะ Coding และมัลติมีเดีย', org: 'โรงเรียนดรุณาราชบุรี - งานสัปดาห์วันวิทยาศาสตร์', date: 'ปีการศึกษา 2565' }
    ]
  },
  en: {
    stats: ['Projects', 'Certificates', 'Years of study', 'Languages'],
    specs: [['Major', 'Computer Engineering'], ['Institution', 'Sripatum University'], ['Phone', '063-3130850'], ['Languages', 'Thai, English']],
    education: [
      { school: 'Sripatum University', degree: "Bachelor's Degree, School of Technology", major: 'Computer Engineering', year: '2023 - Present' },
      { school: 'Darunaratchaburi School', degree: 'High School', major: 'Science - Mathematics Program', year: '2020 - 2022' }
    ],
    skills: [
      ['Frontend', 'HTML, CSS, JavaScript, React'], ['Backend', 'Node.js, Python, PHP, Express'],
      ['Database', 'MySQL, MongoDB, PostgreSQL, Supabase'], ['Mobile', 'React Native, Expo'],
      ['IoT & Hardware', 'ESP32, Arduino, Sensor Design'], ['FPGA / SoC', 'Xilinx, VHDL, Verilog, CPU 8-bit'],
      ['Tools', 'Git, VS Code, Figma, Xilinx ISE'], ['Standard', 'ISO 29110 Document Management']
    ],
    projects: [
      { title: 'V-Fresh Application', desc: 'Mobile app for ordering fresh produce from farm to home, supporting local farmers', role: 'Developed the Seller-side interface and Live streaming feature with Agora, managed Database with Supabase' },
      { title: 'Smart Agriculture System', desc: '"Vegetable Condo" project — reduces limited planting space and maintenance time with soil moisture sensing, automatic watering, and a Dashboard for monitoring', role: 'Custom-designed ESP32 board for real-world use with automated agricultural control' },
      { title: 'Library Management System with SQL', desc: 'Sample library management web app for borrowing/returning books and managing member data', role: 'Database design and partial backend development for book and member management' },
      { title: 'IoT Shrimp Farm', desc: 'IoT-Farm system for giant river prawn — monitors water quality via ESP32 + sensors (pH, Temp), sends data over HTTP to the cloud, displayed on a Responsive Web Dashboard', role: 'Database management for smart shrimp farm, collecting water quality and environmental data' },
      { title: '8-bit CPU Design', desc: 'Designed 8-bit CPU architecture, coded in VHDL and Verilog for FPGA and SoC using Xilinx', role: 'Designed the architecture and edited parts of the code' },
      { title: 'ISO 29110 Documentation', desc: 'Prepared and managed documentation following ISO 29110 standards for software development', role: 'Project Manager (PM)' },
      { title: 'Active-Active Network Design Research', desc: 'Research on designing Active-Active network architecture to improve high availability and efficiently distribute load', role: 'System Analyst (SA) — designed the system diagram' }
    ],
    certificates: [
      { title: 'AWS Academy - Machine Learning Foundations', org: 'AWS Academy (20 Hours)', date: 'Feb 16, 2026' },
      { title: 'Data Science (45 Hours)', org: 'Thai MOOC - Srinakharinwirot University', date: 'Mar 6, 2026' },
      { title: 'Use of Technology for Research Development', org: 'Thai MOOC - Srinakharinwirot University (6 Hours)', date: 'Mar 6, 2026' },
      { title: 'Competency for Teacher in Digital Age', org: 'Thai MOOC - Srinakharinwirot University (6 Hours)', date: 'Mar 6, 2026' },
      { title: 'Cloud-Based Tools for 21st Century', org: 'Thai MOOC - Sripatum University (10 Hours)', date: '2026' },
      { title: 'Introduction to Logistics & Supply Chain', org: 'Thai MOOC - Sripatum University (10 Hours)', date: '2026' },
      { title: 'Digital Age Business Concepts', org: 'Thai MOOC - Sripatum University (10 Hours)', date: '2026' },
      { title: 'Coding & Multimedia Skills', org: 'Darunaratchaburi School - Science Week', date: 'Academic Year 2022' }
    ]
  }
};

const STAT_VALUES = ['7', '8', '4', 'TH / EN'];

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  protected readonly lang = signal<Lang>(((): Lang => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null;
    return stored === 'en' || stored === 'th' ? stored : 'th';
  })());

  protected readonly theme = signal<Theme>(((): Theme => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored === 'dark' || stored === 'light') return stored;
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })());

  @HostBinding('attr.data-theme')
  protected get themeAttr(): Theme { return this.theme(); }

  protected readonly query = signal('');
  protected readonly modalImg = signal<string | null>(null);
  protected readonly modalAlt = signal('');

  protected readonly projectCount = PROJECT_META.length;

  protected readonly channels = [
    { k: 'Email', v: 'wongsakon20172547@gmail.com', href: 'mailto:wongsakon20172547@gmail.com' },
    { k: 'Tel', v: '063-3130850', href: '' },
    { k: 'GitHub', v: 'github.com/Few-zzz ↗', href: 'https://github.com/Few-zzz' },
    { k: 'LinkedIn', v: 'wongsakon-sritongted ↗', href: 'https://www.linkedin.com/in/wongsakon-sritongted-791a85290' },
    { k: 'Facebook', v: 'wongsakon.sritongted ↗', href: 'https://web.facebook.com/wongsakon.sritongted' },
    { k: 'Instagram', v: '@z__few__z ↗', href: 'https://www.instagram.com/z__few__z' }
  ];

  protected readonly themeIcon = computed(() => (this.theme() === 'dark' ? SUN : MOON));

  protected readonly stats = computed(() =>
    CONTENT[this.lang()].stats.map((label, i) => ({ label, value: STAT_VALUES[i] }))
  );

  protected readonly specs = computed(() =>
    CONTENT[this.lang()].specs.map(([k, v]) => ({ k, v }))
  );

  protected readonly education = computed(() => CONTENT[this.lang()].education);

  protected readonly skills = computed(() =>
    CONTENT[this.lang()].skills.map(([name, desc], i) => ({ name, desc, icon: SKILL_ICONS[i] }))
  );

  protected readonly certificates = computed<Certificate[]>(() =>
    CONTENT[this.lang()].certificates.map((c, i) => ({ ...c, img: CERT_IMAGES[i] }))
  );

  protected readonly projects = computed<Project[]>(() =>
    PROJECT_META.map((m, i) => ({ ...m, ...CONTENT[this.lang()].projects[i] }))
  );

  protected readonly filteredProjects = computed<Project[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.projects();
    return this.projects().filter((p) =>
      [p.title, p.desc, p.role, p.kind ?? '', p.tags.join(' ')].join(' ').toLowerCase().includes(q)
    );
  });

  protected t(key: string): string {
    return (COPY[this.lang()] as Record<string, string>)[key] ?? key;
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearQuery(): void { this.query.set(''); }

  protected openModal(cert: Certificate): void {
    this.modalImg.set(cert.img);
    this.modalAlt.set(cert.title);
  }

  protected closeModal(): void { this.modalImg.set(null); }

  protected toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    if (this.reduceMotion && this.ctx) this.drawFrame();
  }

  protected toggleLang(): void {
    const next: Lang = this.lang() === 'th' ? 'en' : 'th';
    this.lang.set(next);
    localStorage.setItem('lang', next);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void { this.closeModal(); }

  /* ── particle background ───────────────────────────────────────── */
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId = 0;
  private readonly mouse = { x: 0, y: 0, active: false };
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void { this.initBackground(); }

  ngOnDestroy(): void { cancelAnimationFrame(this.rafId); }

  @HostListener('window:mousemove', ['$event'])
  protected onMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.active = true;
  }

  @HostListener('window:touchmove', ['$event'])
  protected onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    this.mouse.x = touch.clientX;
    this.mouse.y = touch.clientY;
    this.mouse.active = true;
  }

  @HostListener('document:mouseleave')
  @HostListener('window:touchend')
  protected onPointerLeave(): void { this.mouse.active = false; }

  @HostListener('window:resize')
  protected onResize(): void { this.resizeCanvas(); }

  private initBackground(): void {
    const canvas = this.canvasRef?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    this.ctx = ctx;
    this.resizeCanvas();
    this.spawnParticles();

    if (this.reduceMotion) { this.drawFrame(); return; }

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      this.stepParticles(dt);
      this.drawFrame();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private spawnParticles(): void {
    const canvas = this.canvasRef.nativeElement;
    const count = Math.min(70, Math.round((canvas.width * canvas.height) / 24000));
    const palette = THEME_CANVAS[this.theme()].palette;

    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.6 + 0.8,
      color: palette[Math.floor(Math.random() * palette.length)]
    }));
  }

  private stepParticles(dt: number): void {
    const canvas = this.canvasRef.nativeElement;
    const gravityRadius = 220;

    for (const p of this.particles) {
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < gravityRadius) {
          const pull = (1 - dist / gravityRadius) * 0.6;
          p.vx += (dx / dist) * pull * dt;
          p.vy += (dy / dist) * pull * dt;
        }
      }

      p.vx *= 0.97;
      p.vy *= 0.97;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }
  }

  private drawFrame(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const palette = THEME_CANVAS[this.theme()];

    ctx.fillStyle = palette.trail;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = palette.composite;
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = palette.alpha;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
