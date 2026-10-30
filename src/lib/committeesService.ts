import { CommitteeDef, OFFICIAL_COMMITTEES } from './auth';

const STORAGE_KEY = 'mostaqbal_committees_v2';
const COMMITTEES_CHANGE_EVENT = 'mostaqbal-committees-changed';

export const INITIAL_COMMITTEES_EXTENDED: CommitteeDef[] = [
  ...OFFICIAL_COMMITTEES,
  {
    id: 'health',
    name: 'لجنة الصحة والسكان',
    headName: 'د. أحمد عبد الفتاح',
    rapporteur: 'د. سارة عثمان',
    description: 'متابعة المنظومة الصحية والقوافل الطبية المجانية وتوفير الرعاية للحالات الحرجة.',
    phone: '01234567890',
    status: 'active',
    createdAt: '2026-01-05',
  },
  {
    id: 'education',
    name: 'لجنة التعليم والبحث العلمي',
    headName: 'أ.د. عصام النجار',
    rapporteur: 'أ. مها الشريف',
    description: 'دعم المدارس، رعاية المتفوقين والنابغين، المبادرات التعليمية ومحو الأمية الرقمية.',
    phone: '01512345678',
    status: 'active',
    createdAt: '2026-01-12',
  },
  {
    id: 'housing',
    name: 'لجنة الإسكان والمرافق العامة',
    headName: 'م. شريف عبد العظيم',
    rapporteur: 'م. طارق بدوي',
    description: 'متابعة شبكات الصرف الصحي والمياه والكهرباء ومطالب الإسكان وتطوير الطرق.',
    phone: '01099887766',
    status: 'active',
    createdAt: '2026-01-20',
  },
];

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMMITTEES_CHANGE_EVENT));
  }
}

export const committeesService = {
  /**
   * جلب كافة اللجان المسجلة في المنظومة
   */
  getAll(): CommitteeDef[] {
    if (typeof window === 'undefined') return INITIAL_COMMITTEES_EXTENDED;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMITTEES_EXTENDED));
        return INITIAL_COMMITTEES_EXTENDED;
      }
      return JSON.parse(stored) as CommitteeDef[];
    } catch {
      return INITIAL_COMMITTEES_EXTENDED;
    }
  },

  /**
   * جلب اللجان النشطة فقط لاختيار المواطنين والمشرفين
   */
  getActive(): CommitteeDef[] {
    const all = this.getAll();
    return all.filter(c => c.status !== 'archived');
  },

  /**
   * جلب لجنة بواسطة المعرف البرمجي
   */
  getById(id: string): CommitteeDef | undefined {
    return this.getAll().find(c => c.id === id);
  },

  /**
   * إضافة لجنة جديدة بواسطة الأدمن
   */
  create(newCommittee: Omit<CommitteeDef, 'createdAt'>): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'البيئة غير مهيأة' };
    
    const all = this.getAll();
    const cleanId = newCommittee.id.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (!cleanId) return { success: false, error: 'المعرف البرمجي مطلوب' };
    if (!newCommittee.name.trim()) return { success: false, error: 'اسم اللجنة مطلوب' };
    
    // التحقق من عدم التكرار
    if (all.some(c => c.id === cleanId)) {
      return { success: false, error: 'يوجد لجنة أخرى مسجلة بنفس المعرف البرمجي' };
    }

    const created: CommitteeDef = {
      ...newCommittee,
      id: cleanId,
      name: newCommittee.name.trim(),
      headName: newCommittee.headName?.trim() || 'لم يُحدد رئيس بعد',
      rapporteur: newCommittee.rapporteur?.trim() || 'لم يُحدد مقرر بعد',
      description: newCommittee.description?.trim() || 'لا يوجد وصف مدون',
      status: newCommittee.status || 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...all, created];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      notifyChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل حفظ اللجنة' };
    }
  },

  /**
   * تعديل بيانات لجنة حالية
   */
  update(id: string, partial: Partial<CommitteeDef>): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'البيئة غير مهيأة' };

    const all = this.getAll();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'اللجنة غير موجودة' };

    const updatedCommittee = { ...all[index], ...partial };
    all[index] = updatedCommittee;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      notifyChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تحديث اللجنة' };
    }
  },

  /**
   * حذف أو أرشفة لجنة
   */
  delete(id: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'البيئة غير مهيأة' };
    
    // منع حذف اللجان الأساسية
    if (id === 'youth' || id === 'citizen_affairs') {
      return { success: false, error: 'لا يمكن حذف اللجان الأساسية التاريخية للمنظومة' };
    }

    const all = this.getAll();
    const filtered = all.filter(c => c.id !== id);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      notifyChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل حذف اللجنة' };
    }
  },

  /**
   * الاستماع لأي تغييرات في اللجان وتحديث الواجهة
   */
  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(COMMITTEES_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener(COMMITTEES_CHANGE_EVENT, callback);
    };
  },
};
