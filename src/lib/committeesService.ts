import { CommitteeDef, OFFICIAL_COMMITTEES, YOUTH_SECRETARIAT } from './auth';

/**
 * أمانة الشباب هي الأمانة الوحيدة في المنظومة، لذلك لا يوجد تخزين محلي
 * لقائمة أمانات ولا عمليات إضافة أو حذف. القائمة ثابتة وموحّدة في كل مكان.
 */
export const committeesService = {
  /** جلب الأمانة الوحيدة المسجلة في المنظومة. */
  getAll(): CommitteeDef[] {
    return [...OFFICIAL_COMMITTEES];
  },

  /** جلب الأمانات النشطة (أمانة الشباب). */
  getActive(): CommitteeDef[] {
    return [...OFFICIAL_COMMITTEES];
  },

  /** جلب الأمانة بواسطة المعرف البرمجي. */
  getById(id: string): CommitteeDef | undefined {
    return id === YOUTH_SECRETARIAT.id ? YOUTH_SECRETARIAT : undefined;
  },

  /**
   * واجهة استماع للتوافق مع الواجهات القائمة.
   * لا تتغير القائمة، لذا لا تُطلق أي أحداث.
   */
  subscribe(callback: () => void): () => void {
    void callback;
    return () => {};
  },
};
