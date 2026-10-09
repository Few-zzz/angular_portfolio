import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, computed, inject, input, signal
} from '@angular/core';

type Lang = 'th' | 'en';
type Cat = 'front' | 'back' | 'data' | 'hw' | 'tools';

interface Tool {
  id: string;
  name: string;
  cat: Cat;
  logo?: string;   // file in public/logos — rendered as a white mask
  text?: string;   // fallback glyph when there's no recognizable mark
  tag?: string;    // project tag this tool appears under
  th: string;
  en: string;
}

export interface ToolkitProject { no: string; title: string; tags: string[]; }

/* Muted so the caps sit next to the steel accent instead of fighting it. */
const CAT_COLOR: Record<Cat, string> = {
  front: '#5f8fc0',
  back: '#4c9a8b',
  data: '#c4924f',
  hw: '#c2675f',
  tools: '#7b74b8'
};

const CAT_NAME: Record<Lang, Record<Cat, string>> = {
  th: { front: 'Frontend & Mobile', back: 'Backend & Cloud', data: 'Database', hw: 'Hardware & FPGA', tools: 'เครื่องมือ & กระบวนการ' },
  en: { front: 'Frontend & Mobile', back: 'Backend & Cloud', data: 'Database', hw: 'Hardware & FPGA', tools: 'Tools & Process' }
};

/* Row-major, 7 × 4 — each row maps onto a row of a real keyboard. */
const KEY_ROWS = ['1234567', 'QWERTYU', 'ASDFGHJ', 'ZXCVBNM'];

const TOOLS: Tool[] = [
  { id: 'html', name: 'HTML5', cat: 'front', logo: 'html5', th: 'วางโครงสร้างหน้าเว็บแบบ semantic', en: 'Semantic page structure' },
  { id: 'css', name: 'CSS3', cat: 'front', logo: 'css3', th: 'จัดเลย์เอาต์และ responsive design', en: 'Layout and responsive design' },
  { id: 'js', name: 'JavaScript', cat: 'front', logo: 'javascript', th: 'ตรรกะฝั่งหน้าเว็บและ interaction', en: 'Front-end logic and interaction' },
  { id: 'react', name: 'React', cat: 'front', logo: 'react', tag: 'React', th: 'สร้าง UI แบบ component เช่น Dashboard ของฟาร์มกุ้ง IoT', en: 'Component-based UIs, like the IoT shrimp-farm dashboard' },
  { id: 'rn', name: 'React Native', cat: 'front', text: 'RN', tag: 'React Native', th: 'พัฒนาแอปมือถือข้ามแพลตฟอร์ม — แอป V-Fresh', en: 'Cross-platform mobile apps — the V-Fresh app' },
  { id: 'expo', name: 'Expo', cat: 'front', logo: 'expo', tag: 'Expo', th: 'build และทดสอบแอป React Native บนเครื่องจริง', en: 'Build and test React Native apps on real devices' },
  { id: 'figma', name: 'Figma', cat: 'tools', logo: 'figma', th: 'ออกแบบ UI และทำ prototype ก่อนลงมือเขียนโค้ด', en: 'UI design and prototypes before writing code' },

  { id: 'node', name: 'Node.js', cat: 'back', logo: 'nodejs', tag: 'Node.js', th: 'เขียน API รับข้อมูลเซ็นเซอร์จาก ESP32', en: 'APIs that receive ESP32 sensor data' },
  { id: 'express', name: 'Express', cat: 'back', logo: 'express', th: 'จัดการ route และ middleware ของ API', en: 'Routing and middleware for APIs' },
  { id: 'python', name: 'Python', cat: 'back', logo: 'python', th: 'สคริปต์ประมวลผลข้อมูลและงานอัตโนมัติ', en: 'Data processing and automation scripts' },
  { id: 'php', name: 'PHP', cat: 'back', logo: 'php', th: 'เว็บฝั่งเซิร์ฟเวอร์และการเชื่อมต่อฐานข้อมูล', en: 'Server-side web and database access' },
  { id: 'nginx', name: 'Nginx', cat: 'back', logo: 'nginx', tag: 'Nginx', th: 'reverse proxy และ deploy เว็บ Dashboard', en: 'Reverse proxy and dashboard deployment' },
  { id: 'agora', name: 'Agora', cat: 'back', text: 'AG', tag: 'Agora', th: 'ระบบไลฟ์สดในแอป V-Fresh', en: 'Live streaming inside the V-Fresh app' },
  { id: 'aws', name: 'AWS', cat: 'back', logo: 'amazonwebservices', th: 'พื้นฐาน Cloud และ Generative AI — AWS Academy Graduate', en: 'Cloud and Generative AI foundations — AWS Academy Graduate' },

  { id: 'mysql', name: 'MySQL', cat: 'data', logo: 'mysql', tag: 'SQL', th: 'ออกแบบตารางและเขียน SQL query', en: 'Schema design and SQL queries' },
  { id: 'pg', name: 'PostgreSQL', cat: 'data', logo: 'postgresql', tag: 'PostgreSQL', th: 'เก็บข้อมูลคุณภาพน้ำของฟาร์มกุ้ง IoT', en: 'Water-quality data for the IoT shrimp farm' },
  { id: 'mongo', name: 'MongoDB', cat: 'data', logo: 'mongodb', th: 'ฐานข้อมูลแบบ document สำหรับข้อมูลที่ยืดหยุ่น', en: 'Document database for flexible data' },
  { id: 'supabase', name: 'Supabase', cat: 'data', logo: 'supabase', tag: 'Supabase', th: 'Auth และฐานข้อมูลของแอป V-Fresh', en: 'Auth and database for the V-Fresh app' },
  { id: 'git', name: 'Git', cat: 'tools', logo: 'git', th: 'version control และทำงานร่วมกับทีม', en: 'Version control and team collaboration' },
  { id: 'vscode', name: 'VS Code', cat: 'tools', logo: 'visualstudiocode', th: 'editor หลักของทุกโปรเจกต์', en: 'Main editor for every project' },
  { id: 'iso', name: 'ISO 29110', cat: 'tools', text: 'ISO', tag: 'ISO 29110', th: 'จัดทำเอกสารกระบวนการพัฒนาซอฟต์แวร์ ในบทบาท PM', en: 'Software process documentation, as project manager' },

  { id: 'esp32', name: 'ESP32', cat: 'hw', logo: 'espressif', tag: 'ESP32', th: 'ไมโครคอนโทรลเลอร์หลักของงาน IoT', en: 'The go-to microcontroller for IoT work' },
  { id: 'arduino', name: 'Arduino', cat: 'hw', logo: 'arduino', th: 'ทำต้นแบบวงจรและเขียนเฟิร์มแวร์', en: 'Circuit prototyping and firmware' },
  { id: 'pcb', name: 'PCB Design', cat: 'hw', text: 'PCB', tag: 'PCB Design', th: 'ออกแบบบอร์ด ESP32 และสั่งผลิตเพื่อใช้งานจริง', en: 'Custom ESP32 boards, fabricated for real use' },
  { id: 'plc', name: 'PLC', cat: 'hw', text: 'PLC', th: 'Wecon PLC Editor และ PIStudio สำหรับงานควบคุมอุตสาหกรรม', en: 'Wecon PLC Editor and PIStudio for industrial control' },
  { id: 'vhdl', name: 'VHDL', cat: 'hw', text: 'VHDL', tag: 'VHDL', th: 'เขียน hardware description ของ CPU 8-bit', en: 'Hardware description for the 8-bit CPU' },
  { id: 'verilog', name: 'Verilog', cat: 'hw', text: 'V', tag: 'Verilog', th: 'ออกแบบโมดูลดิจิทัลบน FPGA', en: 'Digital modules on FPGA' },
  { id: 'xilinx', name: 'Xilinx', cat: 'hw', logo: 'xilinx', tag: 'Xilinx', th: 'Xilinx ISE — synthesis และลงโปรแกรม FPGA', en: 'Xilinx ISE — synthesis and FPGA programming' }
];

const COPY = {
  th: {
    kicker: 'Toolkit', title1: 'เครื่องมือเปลี่ยนได้', title2: 'ความอยากรู้ไม่เคยหยุด',
    sub: 'คีย์บอร์ดเล็กๆ หนึ่งอัน กับทักษะทั้งหมดที่ใช้ทำงานจริง',
    meta: 'คีย์บอร์ด 3D แบบ interactive', tools: 'เครื่องมือ',
    hint: 'แตะหรือคลิกที่คีย์แคป หรือกดคีย์บอร์ดจริงเพื่อดูรายละเอียด',
    usedIn: 'ใช้ในผลงาน', how: 'Hover / Click / Key'
  },
  en: {
    kicker: 'Toolkit', title1: 'Tools change.', title2: 'Curiosity stays.',
    sub: 'A little keyboard. A whole stack of skills.',
    meta: 'Interactive 3D keyboard', tools: 'tools',
    hint: 'Tap or click a keycap — or press a key on your real keyboard.',
    usedIn: 'Used in', how: 'Hover / Click / Key'
  }
};

@Component({
  selector: 'app-toolkit',
  templateUrl: './toolkit.html',
  styleUrl: './toolkit.css'
})
export class Toolkit implements AfterViewInit, OnDestroy {
  readonly lang = input<Lang>('th');
  readonly projects = input<ToolkitProject[]>([]);

  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly keys = TOOLS.map((t, i) => ({
    ...t,
    key: KEY_ROWS[Math.floor(i / 7)][i % 7],
    color: CAT_COLOR[t.cat],
    logoUrl: t.logo ? `url(logos/${t.logo}.svg)` : ''
  }));
  protected readonly cats = Object.keys(CAT_COLOR) as Cat[];
  protected readonly catColor = CAT_COLOR;

  protected readonly selected = signal('react');
  protected readonly hovered = signal<string | null>(null);
  protected readonly pressed = signal<string | null>(null);
  protected readonly focusCat = signal<Cat | null>(null);
  protected readonly tilt = signal({ x: 0, y: 0 });

  protected readonly copy = computed(() => COPY[this.lang()]);
  protected readonly catName = computed(() => CAT_NAME[this.lang()]);

  protected readonly shown = computed(() => {
    const id = this.hovered() ?? this.selected();
    return this.keys.find((k) => k.id === id) ?? this.keys[0];
  });

  protected readonly usedIn = computed(() => {
    const tag = this.shown().tag;
    return tag ? this.projects().filter((p) => p.tags.includes(tag)) : [];
  });

  private inView = false;
  private observer?: IntersectionObserver;
  private releaseTimer = 0;
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(([e]) => (this.inView = e.isIntersecting), { threshold: 0.35 });
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearTimeout(this.releaseTimer);
  }

  protected press(id: string): void {
    this.selected.set(id);
    this.pressed.set(id);
    clearTimeout(this.releaseTimer);
    this.releaseTimer = window.setTimeout(() => this.pressed.set(null), 160);
  }

  /* Real keyboard → keycap, only while the board is actually on screen. */
  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    if (!this.inView || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    const k = this.keys.find((x) => x.key === e.key.toUpperCase());
    if (!k) return;
    this.hovered.set(null);
    this.press(k.id);
  }

  protected onTilt(e: PointerEvent): void {
    if (this.reduceMotion || e.pointerType !== 'mouse') return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    this.tilt.set({ x: x * 10, y: -y * 8 });
  }

  protected resetTilt(): void { this.tilt.set({ x: 0, y: 0 }); }
}
