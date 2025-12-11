/**
 * Question Templates by Assessment Level
 * ตาม PDF documentation ใน docs/questions folder
 * 
 * Categories (5 หมวดหลัก):
 * 1. พฤติกรรมการทำงาน / Work Behavior
 * 2. ความรู้ความสามารถ / Knowledge & Skills
 * 3. การทำงานเป็นทีม / Teamwork
 * 4. ความรับผิดชอบ / Responsibility  
 * 5. การพัฒนาตนเอง / Self Development
 * 
 * Scoring: 1-5 scale
 * - 1: ต้องปรับปรุง (Needs Improvement)
 * - 2: พอใช้ (Fair)
 * - 3: ดี (Good)
 * - 4: ดีมาก (Very Good)
 * - 5: ดีเยี่ยม (Excellent)
 */

export interface QuestionTemplate {
  questionTitle: string;
  description: string;
  category: string;
  weight: number;
  maxScore: number;
  order: number;
}

export interface LevelTemplate {
  code: string;
  name: string;
  questions: QuestionTemplate[];
}

// ============================================
// L2 - Operator Level (Operate)
// สำหรับพนักงานระดับปฏิบัติการ
// ============================================
export const L2_OPERATOR_QUESTIONS: QuestionTemplate[] = [
  // Category 1: พฤติกรรมการทำงาน (20%)
  {
    questionTitle: 'การปฏิบัติตามกฎระเบียบ',
    description: 'ยึดมั่นในกฎระเบียบ ข้อบังคับของบริษัท และปฏิบัติงานตามขั้นตอนที่กำหนด',
    category: 'Work Behavior',
    weight: 6,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'การตรงต่อเวลา',
    description: 'มาทำงานตรงเวลา เข้าร่วมประชุมตรงเวลา ส่งงานตามกำหนด',
    category: 'Work Behavior',
    weight: 7,
    maxScore: 5,
    order: 2
  },
  {
    questionTitle: 'ความซื่อสัตย์',
    description: 'มีความซื่อสัตย์สุจริตในการทำงาน ไม่ทุจริตหรือเอาเปรียบองค์กร',
    category: 'Work Behavior',
    weight: 7,
    maxScore: 5,
    order: 3
  },
  
  // Category 2: ความรู้ความสามารถ (25%)
  {
    questionTitle: 'ความชำนาญในงาน',
    description: 'มีความรู้ความชำนาญในงานที่รับผิดชอบ สามารถปฏิบัติงานได้อย่างถูกต้อง',
    category: 'Knowledge & Skills',
    weight: 8,
    maxScore: 5,
    order: 4
  },
  {
    questionTitle: 'คุณภาพของงาน',
    description: 'ผลงานมีคุณภาพ ถูกต้อง ครบถ้วน ไม่ต้องแก้ไขงานบ่อย',
    category: 'Knowledge & Skills',
    weight: 9,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'ปริมาณงาน',
    description: 'สามารถทำงานได้ตามปริมาณที่กำหนด หรือเกินเป้าหมาย',
    category: 'Knowledge & Skills',
    weight: 8,
    maxScore: 5,
    order: 6
  },
  
  // Category 3: การทำงานเป็นทีม (20%)
  {
    questionTitle: 'ความร่วมมือในทีม',
    description: 'ทำงานร่วมกับผู้อื่นได้ดี ช่วยเหลือเพื่อนร่วมงาน ไม่สร้างความขัดแย้ง',
    category: 'Teamwork',
    weight: 10,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'การสื่อสาร',
    description: 'สื่อสารกับผู้อื่นได้ชัดเจน เข้าใจง่าย รับฟังความคิดเห็นของผู้อื่น',
    category: 'Teamwork',
    weight: 10,
    maxScore: 5,
    order: 8
  },
  
  // Category 4: ความรับผิดชอบ (20%)
  {
    questionTitle: 'ความรับผิดชอบต่องาน',
    description: 'รับผิดชอบงานที่ได้รับมอบหมายจนสำเร็จ ไม่ทอดทิ้งงาน',
    category: 'Responsibility',
    weight: 10,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'การดูแลรักษาทรัพย์สินบริษัท',
    description: 'ดูแลรักษาเครื่องมือ อุปกรณ์ และทรัพย์สินของบริษัทเป็นอย่างดี',
    category: 'Responsibility',
    weight: 10,
    maxScore: 5,
    order: 10
  },
  
  // Category 5: การพัฒนาตนเอง (15%)
  {
    questionTitle: 'ความกระตือรือร้นในการเรียนรู้',
    description: 'มีความกระตือรือร้นในการเรียนรู้สิ่งใหม่ ศึกษาเพิ่มเติมด้วยตนเอง',
    category: 'Self Development',
    weight: 8,
    maxScore: 5,
    order: 11
  },
  {
    questionTitle: 'การนำความรู้มาประยุกต์ใช้',
    description: 'สามารถนำความรู้ที่ได้รับมาใช้ในการปฏิบัติงานได้จริง',
    category: 'Self Development',
    weight: 7,
    maxScore: 5,
    order: 12
  }
];

// ============================================
// L3 - General Level
// สำหรับพนักงานทั่วไป
// ============================================
export const L3_GENERAL_QUESTIONS: QuestionTemplate[] = [
  // Category 1: พฤติกรรมการทำงาน (20%)
  {
    questionTitle: 'การปฏิบัติตามกฎระเบียบ',
    description: 'ยึดมั่นในกฎระเบียบ ข้อบังคับของบริษัท และปฏิบัติงานตามขั้นตอนที่กำหนด',
    category: 'Work Behavior',
    weight: 6,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'การตรงต่อเวลา',
    description: 'มาทำงานตรงเวลา เข้าร่วมประชุมตรงเวลา ส่งงานตามกำหนด',
    category: 'Work Behavior',
    weight: 7,
    maxScore: 5,
    order: 2
  },
  {
    questionTitle: 'ความซื่อสัตย์และจริยธรรม',
    description: 'มีความซื่อสัตย์สุจริต มีจริยธรรมในการทำงาน',
    category: 'Work Behavior',
    weight: 7,
    maxScore: 5,
    order: 3
  },
  
  // Category 2: ความรู้ความสามารถ (25%)
  {
    questionTitle: 'ความรู้ในงาน',
    description: 'มีความรู้ความเข้าใจในงานที่รับผิดชอบเป็นอย่างดี',
    category: 'Knowledge & Skills',
    weight: 8,
    maxScore: 5,
    order: 4
  },
  {
    questionTitle: 'คุณภาพและความถูกต้องของงาน',
    description: 'ผลงานมีคุณภาพ ถูกต้อง ครบถ้วน ตรงตามมาตรฐาน',
    category: 'Knowledge & Skills',
    weight: 9,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'การแก้ไขปัญหาเบื้องต้น',
    description: 'สามารถแก้ไขปัญหาเบื้องต้นในงานที่รับผิดชอบได้ด้วยตนเอง',
    category: 'Knowledge & Skills',
    weight: 8,
    maxScore: 5,
    order: 6
  },
  
  // Category 3: การทำงานเป็นทีม (20%)
  {
    questionTitle: 'ความร่วมมือในการทำงาน',
    description: 'ทำงานร่วมกับผู้อื่นได้ดี มีน้ำใจช่วยเหลือเพื่อนร่วมงาน',
    category: 'Teamwork',
    weight: 10,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'การสื่อสารและประสานงาน',
    description: 'สื่อสารได้ชัดเจน ประสานงานกับหน่วยงานต่างๆ ได้ดี',
    category: 'Teamwork',
    weight: 10,
    maxScore: 5,
    order: 8
  },
  
  // Category 4: ความรับผิดชอบ (20%)
  {
    questionTitle: 'ความรับผิดชอบต่องาน',
    description: 'รับผิดชอบงานที่ได้รับมอบหมายจนสำเร็จ ไม่ทอดทิ้งงาน',
    category: 'Responsibility',
    weight: 10,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'การรักษาความลับ',
    description: 'รักษาความลับของบริษัทและข้อมูลที่เกี่ยวข้องกับงาน',
    category: 'Responsibility',
    weight: 10,
    maxScore: 5,
    order: 10
  },
  
  // Category 5: การพัฒนาตนเอง (15%)
  {
    questionTitle: 'ความกระตือรือร้นในการพัฒนา',
    description: 'มีความกระตือรือร้นในการพัฒนาตนเอง เรียนรู้สิ่งใหม่อยู่เสมอ',
    category: 'Self Development',
    weight: 8,
    maxScore: 5,
    order: 11
  },
  {
    questionTitle: 'การปรับตัว',
    description: 'สามารถปรับตัวเข้ากับสถานการณ์และการเปลี่ยนแปลงได้ดี',
    category: 'Self Development',
    weight: 7,
    maxScore: 5,
    order: 12
  }
];

// ============================================
// L4 - Supervise Level
// สำหรับหัวหน้างาน/ผู้ควบคุมงาน
// ============================================
export const L4_SUPERVISE_QUESTIONS: QuestionTemplate[] = [
  // Category 1: ภาวะผู้นำ (25%)
  {
    questionTitle: 'ความสามารถในการนำทีม',
    description: 'สามารถนำทีมงานให้บรรลุเป้าหมาย กำหนดทิศทางการทำงานได้ชัดเจน',
    category: 'Leadership',
    weight: 8,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'การมอบหมายและติดตามงาน',
    description: 'มอบหมายงานได้เหมาะสมกับความสามารถของผู้ใต้บังคับบัญชา และติดตามผลอย่างสม่ำเสมอ',
    category: 'Leadership',
    weight: 9,
    maxScore: 5,
    order: 2
  },
  {
    questionTitle: 'การสร้างแรงจูงใจ',
    description: 'สามารถสร้างแรงจูงใจให้ทีมงาน กระตุ้นให้เกิดความมุ่งมั่นในการทำงาน',
    category: 'Leadership',
    weight: 8,
    maxScore: 5,
    order: 3
  },
  
  // Category 2: การบริหารจัดการ (25%)
  {
    questionTitle: 'การวางแผนงาน',
    description: 'สามารถวางแผนการทำงานได้อย่างเป็นระบบ คาดการณ์ปัญหาล่วงหน้า',
    category: 'Management',
    weight: 8,
    maxScore: 5,
    order: 4
  },
  {
    questionTitle: 'การแก้ปัญหาและตัดสินใจ',
    description: 'สามารถวิเคราะห์ ตัดสินใจ และแก้ไขปัญหาได้อย่างมีประสิทธิภาพ',
    category: 'Management',
    weight: 9,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'การบริหารทรัพยากร',
    description: 'ใช้ทรัพยากร (คน เงิน เวลา) อย่างมีประสิทธิภาพและคุ้มค่า',
    category: 'Management',
    weight: 8,
    maxScore: 5,
    order: 6
  },
  
  // Category 3: การพัฒนาทีมงาน (20%)
  {
    questionTitle: 'การสอนงานและพัฒนาลูกน้อง',
    description: 'สอนงาน ให้คำแนะนำ และพัฒนาศักยภาพผู้ใต้บังคับบัญชาอย่างต่อเนื่อง',
    category: 'Team Development',
    weight: 10,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'การให้ Feedback',
    description: 'ให้ feedback ที่สร้างสรรค์แก่ทีมงาน ทั้งชมเชยและแนะนำข้อปรับปรุง',
    category: 'Team Development',
    weight: 10,
    maxScore: 5,
    order: 8
  },
  
  // Category 4: การสื่อสารและประสานงาน (15%)
  {
    questionTitle: 'การสื่อสารกับทีมงาน',
    description: 'สื่อสารกับทีมงานได้ชัดเจน ถ่ายทอดนโยบาย เป้าหมายได้เข้าใจ',
    category: 'Communication',
    weight: 8,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'การประสานงานข้ามหน่วยงาน',
    description: 'ประสานงานกับหน่วยงานอื่นๆ ได้อย่างมีประสิทธิภาพ',
    category: 'Communication',
    weight: 7,
    maxScore: 5,
    order: 10
  },
  
  // Category 5: ความรับผิดชอบและจริยธรรม (15%)
  {
    questionTitle: 'ความรับผิดชอบต่อผลงานทีม',
    description: 'รับผิดชอบต่อผลงานของทีม ทั้งความสำเร็จและความล้มเหลว',
    category: 'Responsibility',
    weight: 8,
    maxScore: 5,
    order: 11
  },
  {
    questionTitle: 'การเป็นแบบอย่างที่ดี',
    description: 'เป็นแบบอย่างที่ดีให้กับผู้ใต้บังคับบัญชา ทั้งในเรื่องการทำงานและความประพฤติ',
    category: 'Responsibility',
    weight: 7,
    maxScore: 5,
    order: 12
  }
];

// ============================================
// L5 - Interpreter Level
// สำหรับผู้แปล/ล่าม
// ============================================
export const L5_INTERPRETER_QUESTIONS: QuestionTemplate[] = [
  // Category 1: ทักษะการแปล (30%)
  {
    questionTitle: 'ความถูกต้องในการแปล',
    description: 'แปลได้ถูกต้อง ตรงตามความหมายเดิม ไม่ผิดเพี้ยน',
    category: 'Translation Skills',
    weight: 10,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'ความคล่องแคล่วในการแปล',
    description: 'แปลได้รวดเร็ว ลื่นไหล เหมาะสมกับสถานการณ์',
    category: 'Translation Skills',
    weight: 10,
    maxScore: 5,
    order: 2
  },
  {
    questionTitle: 'การใช้ศัพท์เทคนิค',
    description: 'ใช้ศัพท์เทคนิคเฉพาะทางได้ถูกต้อง เหมาะสม',
    category: 'Translation Skills',
    weight: 10,
    maxScore: 5,
    order: 3
  },
  
  // Category 2: ทักษะการสื่อสาร (25%)
  {
    questionTitle: 'การสื่อสารกับชาวต่างชาติ',
    description: 'สื่อสารกับชาวต่างชาติได้อย่างมีประสิทธิภาพ เข้าใจวัฒนธรรมของคู่สนทนา',
    category: 'Communication',
    weight: 8,
    maxScore: 5,
    order: 4
  },
  {
    questionTitle: 'การถ่ายทอดความเข้าใจ',
    description: 'สามารถถ่ายทอดความเข้าใจระหว่างทั้งสองฝ่ายได้อย่างชัดเจน',
    category: 'Communication',
    weight: 9,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'การรายงานผล',
    description: 'รายงานผลการประชุม/การแปลได้ครบถ้วน ถูกต้อง',
    category: 'Communication',
    weight: 8,
    maxScore: 5,
    order: 6
  },
  
  // Category 3: ความรู้และความเชี่ยวชาญ (20%)
  {
    questionTitle: 'ความรู้ด้านภาษา',
    description: 'มีความรู้ด้านภาษาที่รับผิดชอบอย่างลึกซึ้ง ทั้งไวยากรณ์และคำศัพท์',
    category: 'Knowledge',
    weight: 10,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'ความรู้เฉพาะทาง',
    description: 'มีความรู้เกี่ยวกับธุรกิจและอุตสาหกรรมที่เกี่ยวข้อง',
    category: 'Knowledge',
    weight: 10,
    maxScore: 5,
    order: 8
  },
  
  // Category 4: ความรับผิดชอบ (15%)
  {
    questionTitle: 'การรักษาความลับ',
    description: 'รักษาความลับของข้อมูลที่ได้รับจากการแปลอย่างเคร่งครัด',
    category: 'Responsibility',
    weight: 8,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'ความตรงต่อเวลา',
    description: 'ส่งงานแปลตามกำหนดเวลา พร้อมปฏิบัติงานเมื่อต้องการ',
    category: 'Responsibility',
    weight: 7,
    maxScore: 5,
    order: 10
  },
  
  // Category 5: การพัฒนาตนเอง (10%)
  {
    questionTitle: 'การพัฒนาทักษะภาษา',
    description: 'พัฒนาทักษะภาษาอย่างต่อเนื่อง ติดตามคำศัพท์ใหม่ๆ',
    category: 'Self Development',
    weight: 5,
    maxScore: 5,
    order: 11
  },
  {
    questionTitle: 'การเรียนรู้วัฒนธรรม',
    description: 'ศึกษาวัฒนธรรมของประเทศที่เกี่ยวข้องอย่างสม่ำเสมอ',
    category: 'Self Development',
    weight: 5,
    maxScore: 5,
    order: 12
  }
];

// ============================================
// L6 - Management Level
// สำหรับผู้บริหาร
// ============================================
export const L6_MANAGEMENT_QUESTIONS: QuestionTemplate[] = [
  // Category 1: วิสัยทัศน์และกลยุทธ์ (25%)
  {
    questionTitle: 'การกำหนดวิสัยทัศน์',
    description: 'กำหนดวิสัยทัศน์ ทิศทาง และเป้าหมายขององค์กร/หน่วยงานได้ชัดเจน',
    category: 'Strategic Vision',
    weight: 8,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'การวางแผนกลยุทธ์',
    description: 'วางแผนกลยุทธ์ระยะยาวได้สอดคล้องกับเป้าหมายองค์กร',
    category: 'Strategic Vision',
    weight: 9,
    maxScore: 5,
    order: 2
  },
  {
    questionTitle: 'การนำกลยุทธ์สู่การปฏิบัติ',
    description: 'แปลงกลยุทธ์เป็นแผนปฏิบัติการที่เป็นรูปธรรมและติดตามผล',
    category: 'Strategic Vision',
    weight: 8,
    maxScore: 5,
    order: 3
  },
  
  // Category 2: ภาวะผู้นำระดับสูง (25%)
  {
    questionTitle: 'การสร้างแรงบันดาลใจ',
    description: 'สร้างแรงบันดาลใจให้ทีมงานและผู้ใต้บังคับบัญชาทุกระดับ',
    category: 'Executive Leadership',
    weight: 8,
    maxScore: 5,
    order: 4
  },
  {
    questionTitle: 'การตัดสินใจเชิงกลยุทธ์',
    description: 'ตัดสินใจในประเด็นสำคัญได้รวดเร็ว รอบคอบ และมีข้อมูลสนับสนุน',
    category: 'Executive Leadership',
    weight: 9,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'การจัดการการเปลี่ยนแปลง',
    description: 'นำการเปลี่ยนแปลงได้อย่างมีประสิทธิภาพ สื่อสารให้ทีมเข้าใจและพร้อมปรับตัว',
    category: 'Executive Leadership',
    weight: 8,
    maxScore: 5,
    order: 6
  },
  
  // Category 3: การบริหารผลลัพธ์ (20%)
  {
    questionTitle: 'การบรรลุเป้าหมายธุรกิจ',
    description: 'นำทีมงานบรรลุเป้าหมายธุรกิจที่กำหนด ทั้งในเชิงปริมาณและคุณภาพ',
    category: 'Results Management',
    weight: 10,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'การบริหารงบประมาณ',
    description: 'บริหารงบประมาณได้ตามแผน ใช้ทรัพยากรอย่างคุ้มค่า',
    category: 'Results Management',
    weight: 10,
    maxScore: 5,
    order: 8
  },
  
  // Category 4: การพัฒนาองค์กร (15%)
  {
    questionTitle: 'การวางแผนสืบทอดตำแหน่ง',
    description: 'พัฒนาผู้สืบทอดตำแหน่งและเตรียมความพร้อมผู้บริหารรุ่นใหม่',
    category: 'Organization Development',
    weight: 8,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'การสร้างวัฒนธรรมองค์กร',
    description: 'สร้างและส่งเสริมวัฒนธรรมองค์กรที่ดี ตอบสนองต่อค่านิยมของบริษัท',
    category: 'Organization Development',
    weight: 7,
    maxScore: 5,
    order: 10
  },
  
  // Category 5: ความสัมพันธ์กับผู้มีส่วนได้ส่วนเสีย (15%)
  {
    questionTitle: 'การสร้างความสัมพันธ์ภายนอก',
    description: 'สร้างและรักษาความสัมพันธ์ที่ดีกับลูกค้า คู่ค้า และพันธมิตรธุรกิจ',
    category: 'Stakeholder Relations',
    weight: 8,
    maxScore: 5,
    order: 11
  },
  {
    questionTitle: 'การดูแลภาพลักษณ์องค์กร',
    description: 'รักษาและส่งเสริมภาพลักษณ์ที่ดีขององค์กรต่อสาธารณะ',
    category: 'Stakeholder Relations',
    weight: 7,
    maxScore: 5,
    order: 12
  }
];

// ============================================
// L1 - Supplier Level
// สำหรับซัพพลายเออร์/ผู้รับเหมา
// ============================================
export const L1_SUPPLIER_QUESTIONS: QuestionTemplate[] = [
  // Category 1: คุณภาพงาน (30%)
  {
    questionTitle: 'คุณภาพสินค้า/บริการ',
    description: 'สินค้า/บริการที่ส่งมอบมีคุณภาพตามมาตรฐานที่กำหนด',
    category: 'Quality',
    weight: 15,
    maxScore: 5,
    order: 1
  },
  {
    questionTitle: 'ความถูกต้องของข้อมูล',
    description: 'เอกสาร ข้อมูลที่ส่งมอบมีความถูกต้อง ครบถ้วน',
    category: 'Quality',
    weight: 15,
    maxScore: 5,
    order: 2
  },
  
  // Category 2: การส่งมอบ (25%)
  {
    questionTitle: 'ความตรงต่อเวลา',
    description: 'ส่งมอบสินค้า/บริการตรงตามเวลาที่กำหนด',
    category: 'Delivery',
    weight: 15,
    maxScore: 5,
    order: 3
  },
  {
    questionTitle: 'ความครบถ้วนของการส่งมอบ',
    description: 'ส่งมอบได้ครบตามจำนวนและรายละเอียดที่สั่ง',
    category: 'Delivery',
    weight: 10,
    maxScore: 5,
    order: 4
  },
  
  // Category 3: การสื่อสารและตอบสนอง (20%)
  {
    questionTitle: 'การตอบสนองต่อปัญหา',
    description: 'ตอบสนองและแก้ไขปัญหาได้รวดเร็วเมื่อมีข้อร้องเรียน',
    category: 'Communication',
    weight: 10,
    maxScore: 5,
    order: 5
  },
  {
    questionTitle: 'การสื่อสารและรายงานผล',
    description: 'สื่อสารและรายงานความคืบหน้าได้ชัดเจน สม่ำเสมอ',
    category: 'Communication',
    weight: 10,
    maxScore: 5,
    order: 6
  },
  
  // Category 4: ความน่าเชื่อถือ (15%)
  {
    questionTitle: 'ความซื่อสัตย์ในการดำเนินงาน',
    description: 'มีความซื่อสัตย์ โปร่งใส ในการดำเนินงาน',
    category: 'Reliability',
    weight: 8,
    maxScore: 5,
    order: 7
  },
  {
    questionTitle: 'การปฏิบัติตามสัญญา',
    description: 'ปฏิบัติตามข้อตกลงและสัญญาอย่างเคร่งครัด',
    category: 'Reliability',
    weight: 7,
    maxScore: 5,
    order: 8
  },
  
  // Category 5: มูลค่าเพิ่มและการพัฒนา (10%)
  {
    questionTitle: 'การเสนอแนวคิดใหม่',
    description: 'เสนอแนวคิดหรือวิธีการใหม่ๆ ที่เป็นประโยชน์ต่อบริษัท',
    category: 'Value Added',
    weight: 5,
    maxScore: 5,
    order: 9
  },
  {
    questionTitle: 'การปรับปรุงอย่างต่อเนื่อง',
    description: 'มีการปรับปรุงพัฒนาสินค้า/บริการอย่างต่อเนื่อง',
    category: 'Value Added',
    weight: 5,
    maxScore: 5,
    order: 10
  }
];

// ============================================
// All Templates Collection
// ============================================
export const ALL_QUESTION_TEMPLATES: Record<string, QuestionTemplate[]> = {
  'L1-Supplier': L1_SUPPLIER_QUESTIONS,
  'L2-Operator': L2_OPERATOR_QUESTIONS,
  'L3-General': L3_GENERAL_QUESTIONS,
  'L4-Supervise': L4_SUPERVISE_QUESTIONS,
  'L5-Interpreter': L5_INTERPRETER_QUESTIONS,
  'L6-Management': L6_MANAGEMENT_QUESTIONS,
};

// ============================================
// Helper Functions
// ============================================
export function getQuestionsForLevel(level: string): QuestionTemplate[] {
  return ALL_QUESTION_TEMPLATES[level] || [];
}

export function getCategoriesForLevel(level: string): string[] {
  const questions = getQuestionsForLevel(level);
  const categories = [...new Set(questions.map(q => q.category))];
  return categories;
}

export function getTotalWeightForLevel(level: string): number {
  const questions = getQuestionsForLevel(level);
  return questions.reduce((sum, q) => sum + q.weight, 0);
}

export function validateTemplateWeights(): Record<string, { total: number; valid: boolean }> {
  const results: Record<string, { total: number; valid: boolean }> = {};
  
  for (const [level, questions] of Object.entries(ALL_QUESTION_TEMPLATES)) {
    const total = questions.reduce((sum, q) => sum + q.weight, 0);
    results[level] = {
      total,
      valid: total === 100
    };
  }
  
  return results;
}
