import React, { useState, useEffect } from 'react';
import { getSalaries, createSalary, deleteSalary, getSalesUsers } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const PayrollPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [users, setUsers] = useState([]); // System users
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { isAdmin, isAccountant } = useAuth();
  
  const [formData, setFormData] = useState({
    employeeName: '',
    recipientId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0,
    bonus: 0,
    deductions: 0,
    note: ''
  });

  const loadSalaries = async () => {
    try {
      const data = await getSalaries(formData.month, formData.year);
      setSalaries(data);
    } catch (error) {
      toast.error('فشل تحميل كشف الرواتب');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getSalesUsers();
      setUsers(data);
    } catch (e) {}
  };

  useEffect(() => {
    loadSalaries();
    loadUsers();
  }, [formData.month, formData.year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSalary(formData);
      toast.success('تم تسجيل الراتب بنجاح');
      setShowModal(false);
      setFormData({ ...formData, employeeName: '', recipientId: '', baseSalary: 0, bonus: 0, deductions: 0, note: '' });
      loadSalaries();
    } catch (error) {
      toast.error('فشل تسجيل الراتب');
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setFormData({
        ...formData,
        recipientId: user.id,
        employeeName: user.fullName
      });
    } else {
      setFormData({
        ...formData,
        recipientId: '',
        employeeName: ''
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      try {
        await deleteSalary(id);
        toast.success('تم الحذف بنجاح');
        loadSalaries();
      } catch (error) {
        toast.error('فشل الحذف');
      }
    }
  };

  const totalNet = salaries.reduce((sum, s) => sum + (s.baseSalary + s.bonus - s.deductions), 0);

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">إدارة الرواتب (Payroll)</h2>
          <p className="text-muted mb-0">تسجيل الرواتب والحوافز والخصومات الشهرية للموظفين</p>
        </div>
        <div className="d-flex gap-2">
          <select 
            className="form-select border-0 shadow-sm" 
            style={{width: '120px'}}
            value={formData.month} 
            onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            className="form-select border-0 shadow-sm" 
            style={{width: '100px'}}
            value={formData.year} 
            onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary px-4 shadow-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> تسجيل راتب
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4 text-center">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body p-4">
              <h6 className="opacity-75 mb-2">إجمالي الرواتب الصافية</h6>
              <h2 className="fw-bold mb-0">{totalNet.toLocaleString()} <small className="fs-6">ج.م</small></h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="text-muted mb-2">عدد الموظفين المقيدين</h6>
              <h2 className="fw-bold mb-0 text-dark">{salaries.length}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-center">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-4 text-start">اسم الموظف</th>
                  <th className="py-3">الراتب الأساسي</th>
                  <th className="py-3 text-success">الحوافز</th>
                  <th className="py-3 text-danger">الخصومات</th>
                  <th className="py-3 fw-bold">الصافي</th>
                  <th className="py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="py-5">جاري التحميل...</td></tr>
                ) : salaries.length === 0 ? (
                  <tr><td colSpan="6" className="py-5 text-muted">لا توجد سجلات رواتب لهذا الشهر</td></tr>
                ) : salaries.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 text-start fw-bold">{s.employeeName}</td>
                    <td>{s.baseSalary.toLocaleString()} ج.م</td>
                    <td className="text-success">+{s.bonus.toLocaleString()} ج.م</td>
                    <td className="text-danger">-{s.deductions.toLocaleString()} ج.م</td>
                    <td className="fw-bold text-dark">{(s.baseSalary + s.bonus - s.deductions).toLocaleString()} ج.م</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger border-0 rounded-pill" onClick={() => handleDelete(s.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold">تسجيل راتب موظف</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">اختر موظف من النظام (اختياري للربط)</label>
                    <select className="form-select border-0 bg-light py-2 mb-2" value={formData.recipientId} onChange={e => handleUserSelect(e.target.value)}>
                      <option value="">-- موظف خارجي / يدوي --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                      ))}
                    </select>
                    
                    <label className="form-label small fw-bold">اسم الموظف</label>
                    <input type="text" className="form-control border-0 bg-light py-2" required value={formData.employeeName} onChange={e => setFormData({...formData, employeeName: e.target.value})} placeholder="أدخل اسم الموظف" />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">الراتب الأساسي</label>
                      <input type="number" className="form-control border-0 bg-light py-2" required value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value)})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">الحوافز</label>
                      <input type="number" className="form-control border-0 bg-light py-2" value={formData.bonus} onChange={e => setFormData({...formData, bonus: parseFloat(e.target.value)})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">الخصومات</label>
                      <input type="number" className="form-control border-0 bg-light py-2" value={formData.deductions} onChange={e => setFormData({...formData, deductions: parseFloat(e.target.value)})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">الشهر</label>
                      <select className="form-select border-0 bg-light py-2" value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold">ملاحظات</label>
                    <textarea className="form-control border-0 bg-light py-2" rows="2" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">حفظ السجل</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
