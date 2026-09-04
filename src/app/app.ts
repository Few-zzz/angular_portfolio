import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Project {
  emoji?: string;
  image?: string;
  pdf?: string;
  titleKey: string;
  descKey: string;
  roleKey: string;
  tags: string[];
}

interface Certificate {
  img: string;
  full?: string;
  alt: string;
  titleKey: string;
  orgKey: string;
  dateKey: string;
}

type Lang = 'th' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  th: {
    'nav.home': 'หน้าแรก', 'nav.about': 'เกี่ยวกับ', 'nav.education': 'การศึกษา',
    'nav.skills': 'ทักษะ', 'nav.projects': 'ผลงาน', 'nav.certificates': 'เกียรติบัตร', 'nav.contact': 'ติดต่อ',
    'cert.title1': 'เกียรติ', 'cert.title2': 'บัตร',
    'cert.c1.title': 'AWS Academy - Machine Learning Foundations', 'cert.c1.org': 'AWS Academy (20 ชั่วโมง)', 'cert.c1.date': '16 กุมภาพันธ์ 2026',
    'cert.c2.title': 'Data Science (45 ชั่วโมง)', 'cert.c2.org': 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ', 'cert.c2.date': '6 มีนาคม 2026',
    'cert.c3.title': 'การใช้เทคโนโลยีเพื่อพัฒนาการวิจัย', 'cert.c3.org': 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ (6 ชั่วโมง)', 'cert.c3.date': '6 มีนาคม 2026',
    'cert.c4.title': 'สมรรถนะครูยุคดิจิทัล', 'cert.c4.org': 'Thai MOOC - มหาวิทยาลัยศรีนครินทรวิโรฒ (6 ชั่วโมง)', 'cert.c4.date': '6 มีนาคม 2026',
    'cert.c5.title': 'เครื่องมือ Cloud-Based ศตวรรษ 21', 'cert.c5.org': 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', 'cert.c5.date': '2026',
    'cert.c6.title': 'โลจิสติกส์และโซ่อุปทานเบื้องต้น', 'cert.c6.org': 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', 'cert.c6.date': '2026',
    'cert.c7.title': 'สุดยอดแนวคิดธุรกิจยุคดิจิทัล', 'cert.c7.org': 'Thai MOOC - มหาวิทยาลัยศรีปทุม (10 ชั่วโมง)', 'cert.c7.date': '2026',
    'cert.c8.title': 'ทักษะ Coding และมัลติมีเดีย', 'cert.c8.org': 'โรงเรียนดรุณาราชบุรี - งานสัปดาห์วันวิทยาศาสตร์', 'cert.c8.date': 'ปีการศึกษา 2565',
    'hero.greet': 'สวัสดีครับ', 'hero.im': 'ผมคือ', 'hero.name': 'วงศกร ศรีทองเทศ',
    'hero.role': 'Computer Engineer', 'hero.desc': 'สร้างสรรค์เว็บไซต์ที่สวยงาม ใช้งานง่าย และตอบโจทย์ธุรกิจ',
    'hero.btnProjects': 'ดูผลงาน →', 'hero.btnContact': 'ติดต่อผม',
    'about.title1': 'เกี่ยวกับ', 'about.title2': ' ผม',
    'about.p1': 'สวัสดีครับ ผมชื่อ วงศกร ศรีทองเทศ นักศึกษาสาขาวิศวกรรมคอมพิวเตอร์ ที่หลงใหลในการสร้างสรรค์เทคโนโลยีและนวัตกรรมใหม่ๆ',
    'about.p2': 'มีประสบการณ์ในการพัฒนาทั้ง Web, Mobile Application, IoT และการออกแบบระบบ Hardware เช่น ESP32, FPGA พร้อมทั้งการจัดการ Database',
    'about.p3': 'สนใจการเรียนรู้สิ่งใหม่ๆ และพร้อมเปิดรับโอกาสในการทำงานร่วมกับทีม เพื่อพัฒนาทักษะและสร้างผลงานที่มีคุณภาพ',
    'about.phone': 'เบอร์:', 'about.lang': 'ภาษา:', 'about.langVal': 'ไทย, อังกฤษ',
    'edu.title1': 'การ', 'edu.title2': 'ศึกษา',
    'edu.uni': 'มหาวิทยาลัยศรีปทุม', 'edu.uniYear': '2023 - ปัจจุบัน',
    'edu.uniDegree': 'ปริญญาตรี คณะเทคโนโลยี', 'edu.uniMajor': 'สาขาวิศวกรรมคอมพิวเตอร์',
    'edu.hs': 'โรงเรียนดรุณาราชบุรี', 'edu.hsYear': '2020 - 2022',
    'edu.hsDegree': 'มัธยมศึกษาตอนปลาย', 'edu.hsMajor': 'แผนการเรียน วิทย์ - คณิต',
    'skills.title1': 'ทักษะ', 'skills.title2': 'ของผม',
    'skill.frontend': 'Frontend', 'skill.frontendDesc': 'HTML, CSS, JavaScript, React',
    'skill.backend': 'Backend', 'skill.backendDesc': 'Node.js, Python, PHP, Express',
    'skill.db': 'Database', 'skill.dbDesc': 'MySQL, MongoDB, PostgreSQL, Supabase',
    'skill.mobile': 'Mobile', 'skill.mobileDesc': 'React Native, Expo',
    'skill.iot': 'IoT & Hardware', 'skill.iotDesc': 'ESP32, Arduino, ออกแบบเซ็นเซอร์',
    'skill.fpga': 'FPGA / SoC', 'skill.fpgaDesc': 'Xilinx, VHDL, Verilog, CPU 8-bit',
    'skill.tools': 'เครื่องมือ', 'skill.toolsDesc': 'Git, VS Code, Figma, Xilinx ISE',
    'skill.std': 'มาตรฐาน', 'skill.stdDesc': 'การจัดทำเอกสาร ISO 29110',
    'proj.title1': 'ผลงาน', 'proj.title2': 'ของผม', 'proj.roleLabel': 'หน้าที่:',
    'proj.p1.title': 'Application V-Fresh',
    'proj.p1.desc': 'แอปพลิเคชันสำหรับสั่งซื้อผักผลไม้สดจากฟาร์มถึงบ้านเพื่อเกษตรกร',
    'proj.p1.role': 'ทำหน้าแอปฝั่งของ Seller และระบบ Live โดย Agora พร้อมจัดการ Database ด้วย Supabase',
    'proj.p2.title': 'ระบบการจัดการเกษตรอัจฉริยะ',
    'proj.p2.desc': 'โครงงาน "คอนโดปลูกผัก" เพื่อลดปัญหาพื้นที่ปลูกไม่พอและลดเวลาในการดูแล ด้วยระบบวัดความชื้นในดิน รดน้ำอัตโนมัติ และแสดงผลผ่าน Dashboard',
    'proj.p2.role': 'ออกแบบบอร์ด ESP32 และสั่งทำเพื่อใช้งานจริง พร้อมระบบควบคุมการเกษตรแบบอัตโนมัติ',
    'proj.p3.title': 'ระบบจัดการห้องสมุดด้วย SQL',
    'proj.p3.desc': 'การทำเว็บจัดการห้องสมุดตัวอย่าง สำหรับยืม-คืนหนังสือและบริหารข้อมูลสมาชิก',
    'proj.p3.role': 'ออกแบบ Database และพัฒนา Backend บางส่วนสำหรับระบบจัดการหนังสือและสมาชิก',
    'proj.p4.title': 'ฟาร์มกุ้ง IoT',
    'proj.p4.desc': 'ระบบ IoT-Farm เลี้ยงกุ้งก้ามกราม มอนิเตอร์คุณภาพน้ำด้วย ESP32 + Sensor (pH, Temp) ส่งข้อมูลผ่าน HTTP ขึ้น Cloud และแสดงผลบน Responsive Web Dashboard',
    'proj.p4.role': 'จัดการระบบ Database สำหรับฟาร์มกุ้งอัจฉริยะ เก็บข้อมูลคุณภาพน้ำและสภาพแวดล้อม',
    'proj.p5.title': 'ออกแบบ CPU 8-bit',
    'proj.p5.desc': 'ออกแบบการทำงานของ CPU 8 บิต เขียนโค้ดด้วยภาษา VHDL และ Verilog สำหรับ FPGA และ SoC ด้วย Xilinx',
    'proj.p5.role': 'ออกแบบโครงสร้างการทำงาน และแก้โค้ดบางส่วน',
    'proj.p6.title': 'การจัดทำเอกสาร ISO 29110',
    'proj.p6.desc': 'จัดทำและบริหารจัดการเอกสารตามมาตรฐาน ISO 29110 สำหรับกระบวนการพัฒนาซอฟต์แวร์',
    'proj.p6.role': 'Project Manager (PM)',
    'proj.p7.title': 'วิจัยการออกแบบ Network Active-Active',
    'proj.p7.desc': 'งานวิจัยการออกแบบระบบเครือข่ายแบบ Active-Active เพื่อเพิ่มความพร้อมใช้งาน (High Availability) และกระจายโหลดอย่างมีประสิทธิภาพ',
    'proj.p7.role': 'System Analyst (SA) ออกแบบ Diagram ของระบบ',
    'contact.title1': 'ติดต่อ', 'contact.title2': 'ผม',
    'contact.desc': 'สนใจร่วมงาน ติดต่อผมได้เลย!'
  },
  en: {
    'nav.home': 'Home', 'nav.about': 'About', 'nav.education': 'Education',
    'nav.skills': 'Skills', 'nav.projects': 'Projects', 'nav.certificates': 'Certificates', 'nav.contact': 'Contact',
    'cert.title1': 'Certi', 'cert.title2': 'ficates',
    'cert.c1.title': 'AWS Academy - Machine Learning Foundations', 'cert.c1.org': 'AWS Academy (20 Hours)', 'cert.c1.date': 'Feb 16, 2026',
    'cert.c2.title': 'Data Science (45 Hours)', 'cert.c2.org': 'Thai MOOC - Srinakharinwirot University', 'cert.c2.date': 'Mar 6, 2026',
    'cert.c3.title': 'Use of Technology for Research Development', 'cert.c3.org': 'Thai MOOC - Srinakharinwirot University (6 Hours)', 'cert.c3.date': 'Mar 6, 2026',
    'cert.c4.title': 'Competency for Teacher in Digital Age', 'cert.c4.org': 'Thai MOOC - Srinakharinwirot University (6 Hours)', 'cert.c4.date': 'Mar 6, 2026',
    'cert.c5.title': 'Cloud-Based Tools for 21st Century', 'cert.c5.org': 'Thai MOOC - Sripatum University (10 Hours)', 'cert.c5.date': '2026',
    'cert.c6.title': 'Introduction to Logistics & Supply Chain', 'cert.c6.org': 'Thai MOOC - Sripatum University (10 Hours)', 'cert.c6.date': '2026',
    'cert.c7.title': 'Digital Age Business Concepts', 'cert.c7.org': 'Thai MOOC - Sripatum University (10 Hours)', 'cert.c7.date': '2026',
    'cert.c8.title': 'Coding & Multimedia Skills', 'cert.c8.org': 'Darunaratchaburi School - Science Week', 'cert.c8.date': 'Academic Year 2022',
    'hero.greet': 'Hello there', 'hero.im': "I'm", 'hero.name': 'Wongsakon Sritongted',
    'hero.role': 'Computer Engineer', 'hero.desc': 'Creating beautiful, user-friendly websites that solve business challenges',
    'hero.btnProjects': 'View Projects →', 'hero.btnContact': 'Contact Me',
    'about.title1': 'About ', 'about.title2': 'Me',
    'about.p1': "Hi, I'm Wongsakon Sritongted, a Computer Engineering student passionate about creating technology and innovation.",
    'about.p2': 'Experienced in developing Web, Mobile Applications, IoT, and Hardware design such as ESP32, FPGA, along with Database management.',
    'about.p3': 'Always eager to learn new things and open to opportunities to work with a team to develop skills and produce quality work.',
    'about.phone': 'Phone:', 'about.lang': 'Languages:', 'about.langVal': 'Thai, English',
    'edu.title1': 'Edu', 'edu.title2': 'cation',
    'edu.uni': 'Sripatum University', 'edu.uniYear': '2023 - Present',
    'edu.uniDegree': "Bachelor's Degree, School of Technology", 'edu.uniMajor': 'Computer Engineering',
    'edu.hs': 'Darunaratchaburi School', 'edu.hsYear': '2020 - 2022',
    'edu.hsDegree': 'High School', 'edu.hsMajor': 'Science - Mathematics Program',
    'skills.title1': 'My ', 'skills.title2': 'Skills',
    'skill.frontend': 'Frontend', 'skill.frontendDesc': 'HTML, CSS, JavaScript, React',
    'skill.backend': 'Backend', 'skill.backendDesc': 'Node.js, Python, PHP, Express',
    'skill.db': 'Database', 'skill.dbDesc': 'MySQL, MongoDB, PostgreSQL, Supabase',
    'skill.mobile': 'Mobile', 'skill.mobileDesc': 'React Native, Expo',
    'skill.iot': 'IoT & Hardware', 'skill.iotDesc': 'ESP32, Arduino, Sensor Design',
    'skill.fpga': 'FPGA / SoC', 'skill.fpgaDesc': 'Xilinx, VHDL, Verilog, CPU 8-bit',
    'skill.tools': 'Tools', 'skill.toolsDesc': 'Git, VS Code, Figma, Xilinx ISE',
    'skill.std': 'Standard', 'skill.stdDesc': 'ISO 29110 Document Management',
    'proj.title1': 'My ', 'proj.title2': 'Projects', 'proj.roleLabel': 'Role:',
    'proj.p1.title': 'V-Fresh Application',
    'proj.p1.desc': 'Mobile app for ordering fresh produce from farm to home, supporting local farmers',
    'proj.p1.role': 'Developed the Seller-side interface and Live streaming feature with Agora, managed Database with Supabase',
    'proj.p2.title': 'Smart Agriculture System',
    'proj.p2.desc': '"Vegetable Condo" project — reduces limited planting space and maintenance time with soil moisture sensing, automatic watering, and a Dashboard for monitoring',
    'proj.p2.role': 'Custom-designed ESP32 board for real-world use with automated agricultural control',
    'proj.p3.title': 'Library Management System with SQL',
    'proj.p3.desc': 'Sample library management web app for borrowing/returning books and managing member data',
    'proj.p3.role': 'Database design and partial backend development for book and member management',
    'proj.p4.title': 'IoT Shrimp Farm',
    'proj.p4.desc': 'IoT-Farm system for giant river prawn — monitors water quality via ESP32 + sensors (pH, Temp), sends data over HTTP to the cloud, displayed on a Responsive Web Dashboard',
    'proj.p4.role': 'Database management for smart shrimp farm, collecting water quality and environmental data',
    'proj.p5.title': '8-bit CPU Design',
    'proj.p5.desc': 'Designed 8-bit CPU architecture, coded in VHDL and Verilog for FPGA and SoC using Xilinx',
    'proj.p5.role': 'Designed the architecture and edited parts of the code',
    'proj.p6.title': 'ISO 29110 Documentation',
    'proj.p6.desc': 'Prepared and managed documentation following ISO 29110 standards for software development',
    'proj.p6.role': 'Project Manager (PM)',
    'proj.p7.title': 'Active-Active Network Design Research',
    'proj.p7.desc': 'Research on designing Active-Active network architecture to improve high availability and efficiently distribute load',
    'proj.p7.role': 'System Analyst (SA) — designed the system diagram',
    'contact.title1': 'Contact ', 'contact.title2': 'Me',
    'contact.desc': 'Interested in collaborating? Feel free to reach out!'
  }
};

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChildren('fadeSection') fadeSections!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId = 0;
  private readonly mouse = { x: 0, y: 0, active: false };
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly lang = signal<Lang>((localStorage.getItem('lang') as Lang) || 'th');

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly modalImg = signal<string | null>(null);
  protected readonly pdfEmbedUrl = signal<SafeResourceUrl | null>(null);
  protected readonly pdfViewUrl = signal<string | null>(null);

  protected readonly projects: Project[] = [
    { image: 'V-Fresh.png', pdf: 'https://drive.google.com/file/d/1DANoJK3dT4KO2cx15d8tWNkyYZkYUdZi/view?usp=sharing', titleKey: 'proj.p1.title', descKey: 'proj.p1.desc', roleKey: 'proj.p1.role', tags: ['React Native', 'Expo', 'Supabase', 'Agora'] },
    { image: 'Smart Agriculture System.png', pdf: 'https://drive.google.com/file/d/1WktLarO58SoWDAysT_vOYmE4UWxIeO9Q/view?usp=sharing', titleKey: 'proj.p2.title', descKey: 'proj.p2.desc', roleKey: 'proj.p2.role', tags: ['ESP32', 'IoT', 'PCB Design'] },
    { emoji: '📚', titleKey: 'proj.p3.title', descKey: 'proj.p3.desc', roleKey: 'proj.p3.role', tags: ['SQL', 'Database Design', 'Backend'] },
    { image: 'IoT Shrimp Farm.png', pdf: 'https://drive.google.com/file/d/1VHvYFRuAO9Vy6GikAmccSmzvrfNdukvg/view?usp=sharing', titleKey: 'proj.p4.title', descKey: 'proj.p4.desc', roleKey: 'proj.p4.role', tags: ['IoT', 'ESP32', 'PostgreSQL', 'Node.js', 'React', 'Nginx'] },
    { image: '8-bit CPU Design.png', pdf: 'https://drive.google.com/file/d/1HZfBWmmP_Ip2lQzZKT2FVIm_f-hydUu0/view?usp=sharing', titleKey: 'proj.p5.title', descKey: 'proj.p5.desc', roleKey: 'proj.p5.role', tags: ['VHDL', 'Verilog', 'FPGA', 'Xilinx'] },
    { emoji: '📄', pdf: 'https://drive.google.com/file/d/1AQV4LdDOUfsZBX9IeWVjBqf1yILtf3_A/view?usp=sharing', titleKey: 'proj.p6.title', descKey: 'proj.p6.desc', roleKey: 'proj.p6.role', tags: ['ISO 29110', 'Documentation', 'PM'] },
    { emoji: '🌐', pdf: 'https://drive.google.com/file/d/1fjkqMTIZZQc9PaTKvGWuKdNiFa65fEhf/view?usp=sharing', titleKey: 'proj.p7.title', descKey: 'proj.p7.desc', roleKey: 'proj.p7.role', tags: ['Network', 'Active-Active', 'High Availability', 'SA'] }
  ];

  protected readonly certificates: Certificate[] = [
    { img: 'cert-aws.png', full: 'cert-coding.png', alt: 'AWS Academy ML', titleKey: 'cert.c1.title', orgKey: 'cert.c1.org', dateKey: 'cert.c1.date' },
    { img: 'cert-teacher.png', alt: 'Data Science', titleKey: 'cert.c2.title', orgKey: 'cert.c2.org', dateKey: 'cert.c2.date' },
    { img: 'cert-aws-full.png', alt: 'Research Tech', titleKey: 'cert.c3.title', orgKey: 'cert.c3.org', dateKey: 'cert.c3.date' },
    { img: 'cert-research.png', alt: 'Digital Teacher', titleKey: 'cert.c4.title', orgKey: 'cert.c4.org', dateKey: 'cert.c4.date' },
    { img: 'cert-datascience.png', alt: 'Cloud Based', titleKey: 'cert.c5.title', orgKey: 'cert.c5.org', dateKey: 'cert.c5.date' },
    { img: 'cert-cloudbased.png', alt: 'Logistics', titleKey: 'cert.c6.title', orgKey: 'cert.c6.org', dateKey: 'cert.c6.date' },
    { img: 'cert-logistics.png', alt: 'Digital Business', titleKey: 'cert.c7.title', orgKey: 'cert.c7.org', dateKey: 'cert.c7.date' },
    { img: 'cert-business.png', alt: 'Coding Multimedia', titleKey: 'cert.c8.title', orgKey: 'cert.c8.org', dateKey: 'cert.c8.date' }
  ];

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
          });
        },
        { threshold: 0.15 }
      );
      this.fadeSections.forEach((section) => observer.observe(section.nativeElement));
    }

    this.initGravityBackground();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeModal();
    this.closePdf();
  }

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
  protected onPointerLeave(): void {
    this.mouse.active = false;
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.resizeCanvas();
  }

  private initGravityBackground(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.ctx = ctx;
    this.resizeCanvas();
    this.spawnParticles();

    if (this.reduceMotion) {
      this.ctx.fillStyle = '#0f0f1e';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.drawFrame(0);
      return;
    }

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      this.stepParticles(dt);
      this.drawFrame(dt);
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
    const count = Math.min(90, Math.round((canvas.width * canvas.height) / 18000));
    const palette = ['#6366f1', '#8b5cf6', '#ec4899'];

    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
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
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;

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

  private drawFrame(_dt: number): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(15, 15, 30, 0.28)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.mouse.active) {
      const gradient = ctx.createRadialGradient(this.mouse.x, this.mouse.y, 0, this.mouse.x, this.mouse.y, 220);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  protected t(key: string): string {
    return TRANSLATIONS[this.lang()][key] ?? key;
  }

  protected toggleLang(): void {
    const next: Lang = this.lang() === 'th' ? 'en' : 'th';
    this.lang.set(next);
    localStorage.setItem('lang', next);
  }

  protected openModal(cert: Certificate): void {
    this.modalImg.set(cert.full ?? cert.img);
  }

  protected closeModal(): void {
    this.modalImg.set(null);
  }

  protected openPdf(project: Project): void {
    if (!project.pdf) return;
    this.pdfEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(project.pdf)));
    this.pdfViewUrl.set(this.toViewUrl(project.pdf));
    document.body.style.overflow = 'hidden';
  }

  protected closePdf(): void {
    this.pdfEmbedUrl.set(null);
    this.pdfViewUrl.set(null);
    document.body.style.overflow = '';
  }

  private toEmbedUrl(url: string): string {
    let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = url.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/]+)/);
    if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    return url;
  }

  private toViewUrl(url: string): string {
    const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/) || url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    return url;
  }
}
