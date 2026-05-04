import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../services/api';
import { toast } from 'react-toastify';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    vendor: ''
  });
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'أخرى',
    paymentMethod: 'Cash',
    vendor: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Withdrawal (سحب)',
    'Salaries (رواتب)',
    'Mentor Fees (رسوم مرشدين)',
    'Editing Videos (مونتاج فيديو)',
    'Marketing (تسويق)',
    'Instructor Fees (رسوم محاضرين)',
    'Tools & Software (أدوات وبرامج)',
    'Operations (تشغيل)',
    'Venue (مكان / قاعة)',
    'Advertising (إعلانات)',
    'Design (تصميم)',
    'Internet (إنترنت)',
    'أخرى'
  ];

  const paymentMethods = ['Cash', 'Vodafone Cash', 'InstaPay', 'Bank Transfer', 'Visa'];

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      toast.error('فشل تحميل المصاريف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      toast.success('تم تسجيل المصروف بنجاح');
      setShowModal(false);
      setNewExpense({ 
        description: '', 
        amount: '', 
        category: 'أخرى', 
        paymentMethod: 'Cash', 
        vendor: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      loadExpenses();
    } catch (error) {
      toast.error('فشل تسجيل المصروف');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await deleteExpense(id);
        toast.success('تم حذف المصروف');
        loadExpenses();
      } catch (error) {
        toast.error('فشل حذف المصروف');
      }
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchCategory = !filters.category || exp.category === filters.category;
    const matchVendor = !filters.vendor || (exp.vendor && exp.vendor.toLowerCase().includes(filters.vendor.toLowerCase()));
    return matchCategory && matchVendor;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
        <div className="spinner-grow text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">إدارة المصاريف</h2>
          <p className="text-muted mb-0">تسجيل ومتابعة مصاريف المركز التشغيلية</p>
        </div>
        <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowModal(true)}>
          <i className="bi bi-cart-plus-fill me-2"></i> تسجيل مصروف جديد
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger-subtle text-danger-emphasis">
            <div className="card-body p-4 text-center">
              <h6 className="text-uppercase fw-bold small opacity-75 mb-2">إجمالي المصاريف المفلترة</h6>
              <h2 className="fw-bold mb-0">{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <small className="fs-6">ج.م</small></h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info-subtle text-info-emphasis">
            <div className="card-body p-4 text-center">
              <h6 className="text-uppercase fw-bold small opacity-75 mb-2">عدد العمليات المفلترة</h6>
              <h2 className="fw-bold mb-0">{filteredExpenses.length} <small className="fs-6">عملية</small></h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">فلترة بالفئة</label>
              <select 
                className="form-select border-0 bg-light"
                value={filters.category}
                onChange={e => setFilters({...filters, category: e.target.value})}
              >
                <option value="">كل الفئات</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">فلترة بالجهة / المورد</label>
              <input 
                type="text" 
                className="form-control border-0 bg-light"
                placeholder="بحث عن مورد..."
                value={filters.vendor}
                onChange={e => setFilters({...filters, vendor: e.target.value})}
              />
            </div>
            <div className="col-md-4 text-end">
              <button 
                className="btn btn-link text-secondary text-decoration-none small"
                onClick={() => setFilters({ category: '', vendor: '' })}
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="py-3 px-4 text-start">التاريخ</th>
                  <th className="py-3 text-start">الوصف / البيان</th>
                  <th className="py-3">الفئة</th>
                  <th className="py-3">المورد / الجهة</th>
                  <th className="py-3">وسيلة الدفع</th>
                  <th className="py-3">المبلغ</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-muted py-5 text-center">
                      <i className="bi bi-cart-x fs-1 d-block mb-2 opacity-25"></i>
                      لا يوجد مصاريف تطابق البحث
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="px-4 text-start text-muted small">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                      <td className="text-start fw-bold text-dark">{exp.description}</td>
                      <td>
                        <span className="badge bg-light text-secondary border px-2 py-1 small">{exp.category}</span>
                      </td>
                      <td className="text-muted">{exp.vendor || '-'}</td>
                      <td>
                        <span className="small text-primary fw-bold">{exp.paymentMethod}</span>
                      </td>
                      <td className="text-danger fw-bold">{exp.amount.toLocaleString()} ج.م</td>
                      <td className="px-4">
                        <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(exp.id)} title="حذف">
                          <i className="bi bi-trash-fill fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تسجيل مصروف جديد</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">الوصف / البيان</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" required
                      value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="مثال: فاتورة كهرباء شهر مايو" />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">المورد / الجهة</label>
                      <input type="text" className="form-control form-control-lg bg-light border-0"
                        value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value})} placeholder="اسم الشركة أو المورد" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">المبلغ (ج.م)</label>
                      <input type="number" step="0.01" className="form-control form-control-lg bg-light border-0" required
                        value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold small text-secondary">الفئة</label>
                      <select className="form-select form-select-lg bg-light border-0" required
                        value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold small text-secondary">وسيلة الدفع</label>
                      <select className="form-select form-select-lg bg-light border-0" required
                        value={newExpense.paymentMethod} onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value})}>
                        {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold small text-secondary">التاريخ</label>
                      <input type="date" className="form-control form-control-lg bg-light border-0" required
                        value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-danger px-5 shadow">تأكيد تسجيل المصروف</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
