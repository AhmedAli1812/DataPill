import React, { useEffect, useState } from 'react';
import { getStudents, createStudent, deleteStudent } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendWhatsAppMessage, messages } from '../utils/whatsappHelper';

const StudentsPage = () => {
  const { isAdmin, isSales, isAccountant } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب ${name}؟ سيؤدي ذلك لحذف كافة اشتراكاته ومدفوعاته أيضاً.`)) {
      try {
        await deleteStudent(id);
        toast.success('تم حذف الطالب بنجاح');
        fetchStudents();
      } catch (error) {
        toast.error('فشل في حذف الطالب');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStudent(formData);
      toast.success('تمت إضافة الطالب بنجاح');
      
      // Automatic WhatsApp Welcome
      setTimeout(() => {
        if (window.confirm(`هل تريد إرسال رسالة ترحيب عبر الواتساب للطالب ${formData.name}؟`)) {
          sendWhatsAppMessage(formData.phone, messages.welcome(formData.name));
        }
      }, 500);

      setShowModal(false);
      setFormData({ name: '', phone: '', email: '' });
      fetchStudents();
    } catch (error) {
      toast.error('فشل في إضافة الطالب. تأكد من صحة البيانات.');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPhone = s.phone.includes(phoneSearch);
    return matchName && matchPhone;
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">إدارة الطلاب</h2>
          <p className="text-muted mb-0">إدارة سجلات الطلاب والبيانات الشخصية والاشتراكات</p>
        </div>
        {(!isAccountant || isAdmin) && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus-fill me-2"></i> إضافة طالب جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light" 
                  placeholder="بحث باسم الطالب..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-telephone text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light" 
                  placeholder="بحث برقم الهاتف..." 
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                />
              </div>
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
                  <th className="py-3 px-4 text-start">م</th>
                  <th className="py-3 text-start">اسم الطالب</th>
                  <th className="py-3">رقم الهاتف</th>
                  <th className="py-3">الاشتراكات</th>
                  <th className="py-3 text-muted fw-normal">تاريخ الإضافة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td className="px-4 text-start text-muted">{index + 1}</td>
                      <td className="text-start">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                            <span className="text-primary fw-bold">{student.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{student.name}</div>
                            <small className="text-muted">{student.email || 'بدون بريد'}</small>
                          </div>
                        </div>
                      </td>
                      <td dir="ltr" className="fw-semibold text-secondary">{student.phone}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3">
                          {student.subscriptionCount} اشتراكات
                        </span>
                      </td>
                      <td className="text-muted small">{new Date(student.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4">
                        <div className="d-flex gap-2 justify-content-center">
                          <Link to={`/subscriptions?studentId=${student.id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">
                            <i className="bi bi-eye me-1"></i> عرض
                          </Link>
                          <button 
                            className="btn btn-sm btn-outline-success rounded-pill px-2"
                            onClick={() => sendWhatsAppMessage(student.phone, messages.welcome(student.name))}
                            title="إرسال ترحيب واتساب"
                          >
                            <i className="bi bi-whatsapp"></i>
                          </button>
                          {(isAdmin || isSales) && (
                            <button 
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => handleDelete(student.id, student.name)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted py-5">
                      <i className="bi bi-search fs-1 d-block mb-2 opacity-25"></i>
                      لا يوجد نتائج للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">إضافة طالب جديد</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-4">
                    <label className="form-label">اسم الطالب بالكامل</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-person text-primary"></i></span>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required placeholder="أدخل اسم الطالب الرباعي" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">رقم الهاتف (واتساب)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-whatsapp text-success"></i></span>
                      <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} dir="ltr" required placeholder="01xxxxxxxxx" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">البريد الإلكتروني (اختياري)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-secondary"></i></span>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} dir="ltr" placeholder="example@mail.com" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none fw-bold" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 rounded-pill shadow fw-bold">حفظ بيانات الطالب</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
