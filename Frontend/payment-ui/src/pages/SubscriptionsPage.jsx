import React, { useState, useEffect } from 'react';
import { getSubscriptions, createSubscription, getGroups, createEvaluation } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionsPage = () => {
  const { isAdmin, isSales, isAccountant, isCoordinator } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [filters, setFilters] = useState({ student: '', group: '', status: '' });
  const [newSubscription, setNewSubscription] = useState({
    studentName: '',
    studentPhone: '',
    courseGroupId: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [evalData, setEvalData] = useState({
    studentId: '',
    studentName: '',
    courseGroupId: '',
    courseGroupName: '',
    score: '',
    taskScore: '',
    attitudeScore: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      const [subsData, groupsData] = await Promise.all([getSubscriptions(), getGroups()]);
      setSubscriptions(subsData);
      setGroups(groupsData);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSubscription.courseGroupId) {
      toast.error('يرجى اختيار الجروب');
      return;
    }

    try {
      await createSubscription({
        studentName: newSubscription.studentName,
        studentPhone: newSubscription.studentPhone,
        courseGroupId: parseInt(newSubscription.courseGroupId),
        startDate: newSubscription.startDate
      });
      toast.success('تم تسجيل الاشتراك بنجاح');
      setShowModal(false);
      setNewSubscription({
        studentName: '',
        studentPhone: '',
        courseGroupId: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل تسجيل الاشتراك');
    }
  };

  const handleCreateEval = async (e) => {
    e.preventDefault();
    try {
      await createEvaluation({
        studentId: evalData.studentId,
        courseGroupId: evalData.courseGroupId,
        score: parseInt(evalData.score),
        taskScore: parseInt(evalData.taskScore),
        attitudeScore: parseInt(evalData.attitudeScore),
        notes: evalData.notes
      });
      toast.success('تم إضافة التقييم بنجاح');
      setShowEvalModal(false);
      setEvalData({ studentId: '', studentName: '', courseGroupId: '', courseGroupName: '', score: '', notes: '' });
    } catch (error) {
      toast.error('فشل إضافة التقييم');
    }
  };

  const openEvalModal = (sub) => {
    setEvalData({
      studentId: sub.studentId,
      studentName: sub.studentName,
      courseGroupId: sub.courseGroupId,
      courseGroupName: sub.courseGroupName || sub.courseName,
      score: '',
      taskScore: '',
      attitudeScore: '',
      notes: ''
    });
    setShowEvalModal(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchStudent = sub.studentName.toLowerCase().includes(filters.student.toLowerCase()) || 
                       sub.studentPhone.includes(filters.student);
    const matchGroup = !filters.group || sub.courseGroupId === parseInt(filters.group);
    const matchStatus = !filters.status || sub.status === filters.status;
    return matchStudent && matchGroup && matchStatus;
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
          <h2 className="fw-bold text-dark mb-1">إدارة الاشتراكات</h2>
          <p className="text-muted mb-0">متابعة اشتراكات الطلاب في الكورسات المختلفة</p>
        </div>
        {(!isAccountant || isAdmin) && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle-fill me-2"></i> إضافة اشتراك جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">بحث بالطالب</label>
              <input 
                type="text" 
                className="form-control border-0 bg-light" 
                placeholder="الاسم أو رقم الهاتف..." 
                value={filters.student}
                onChange={e => setFilters({...filters, student: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">تصفية حسب الجروب</label>
              <select 
                className="form-select border-0 bg-light"
                value={filters.group}
                onChange={e => setFilters({...filters, group: e.target.value})}
              >
                <option value="">كل الجروبات</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">حالة الدفع</label>
              <select 
                className="form-select border-0 bg-light"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="">كل الحالات</option>
                <option value="Paid بالكامل">خالص بالكامل</option>
                <option value="متبقي">متبقي مديونية</option>
              </select>
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
                  {isCoordinator ? (
                    <>
                      <th className="py-3 px-4 text-start">الاسم</th>
                      <th className="py-3">رقم الهاتف</th>
                      <th className="py-3">الإيميل</th>
                    </>
                  ) : (
                    <th className="py-3 px-4 text-start">الطالب</th>
                  )}
                  <th className="py-3">الجروب / الكود</th>
                  {(!isCoordinator) && (
                    <>
                      <th className="py-3">السعر الإجمالي</th>
                      <th className="py-3">المدفوع</th>
                      <th className="py-3">المتبقي</th>
                      <th className="py-3">الحالة</th>
                    </>
                  )}
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-muted py-5 text-center">
                      <i className="bi bi-journal-x fs-1 d-block mb-2 opacity-25"></i>
                      لا يوجد اشتراكات تطابق البحث
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map(sub => (
                    <tr key={sub.id}>
                      {isCoordinator ? (
                        <>
                          <td className="px-4 text-start fw-bold text-dark">{sub.studentName}</td>
                          <td className="text-muted">{sub.studentPhone}</td>
                          <td className="text-muted small">
                            {sub.studentEmail
                              ? <><i className="bi bi-envelope me-1 text-primary"></i>{sub.studentEmail}</>
                              : <span className="text-secondary opacity-50">—</span>
                            }
                          </td>
                        </>
                      ) : (
                        <td className="px-4 text-start">
                          <div className="fw-bold text-dark">{sub.studentName}</div>
                          <div className="text-muted small">{sub.studentPhone}</div>
                        </td>
                      )}
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis border me-1">{sub.courseGroupName || sub.courseName}</span>
                        {sub.courseGroupCode && <span className="badge bg-secondary-subtle text-secondary border small">{sub.courseGroupCode}</span>}
                      </td>
                      {(!isCoordinator) && (
                        <>
                          <td className="fw-bold">{sub.totalPrice.toLocaleString()} ج.م</td>
                          <td className="text-success fw-bold">{sub.totalPaid.toLocaleString()} ج.م</td>
                          <td className={`${sub.remaining > 0 ? 'text-danger' : 'text-muted'} fw-bold`}>
                            {sub.remaining.toLocaleString()} ج.م
                          </td>
                          <td>
                            <span className={`badge ${sub.status === 'Paid بالكامل' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {sub.status}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          {(!isCoordinator || isAdmin) && (
                            <Link to={`/payments/${sub.id}`} className="btn btn-sm btn-outline-primary px-3 rounded-pill shadow-sm">
                              <i className="bi bi-cash-stack me-1"></i> تحصيل
                            </Link>
                          )}
                          {(isAdmin || isCoordinator) && (
                            <button className="btn btn-sm btn-success px-3 rounded-pill shadow-sm" onClick={() => openEvalModal(sub)}>
                              <i className="bi bi-star-fill me-1"></i> تقييم
                            </button>
                          )}
                        </div>
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
                <h5 className="modal-title fw-bold">إضافة اشتراك جديد</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="alert alert-info border-0 shadow-sm small mb-4">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    يمكنك إدخال بيانات طالب جديد هنا مباشرة، وسيتم ربطه تلقائياً إذا كان مسجلاً مسبقاً برقم الهاتف.
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">اسم الطالب</label>
                      <input type="text" className="form-control form-control-lg bg-light border-0" required
                        value={newSubscription.studentName} onChange={e => setNewSubscription({...newSubscription, studentName: e.target.value})} placeholder="اسم الطالب الكامل" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">رقم الهاتف</label>
                      <input type="text" className="form-control form-control-lg bg-light border-0" required
                        value={newSubscription.studentPhone} onChange={e => setNewSubscription({...newSubscription, studentPhone: e.target.value})} placeholder="01xxxxxxxxx" />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">الجروب / الكورس</label>
                      <select 
                        className="form-select form-select-lg bg-light border-0" 
                        required
                        value={newSubscription.courseGroupId}
                        onChange={e => setNewSubscription({...newSubscription, courseGroupId: e.target.value})}
                      >
                        <option value="">اختر الجروب...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id} disabled={g.subscriptionsCount >= g.capacity}>
                            {g.name} - ({g.price} ج.م) {g.subscriptionsCount >= g.capacity ? '[مكتمل]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-secondary">تاريخ بداية الاشتراك</label>
                      <input type="date" className="form-control form-control-lg bg-light border-0" required
                        value={newSubscription.startDate} onChange={e => setNewSubscription({...newSubscription, startDate: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 shadow">تأكيد الاشتراك</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Evaluation Modal */}
      {showEvalModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تقييم الطالب: {evalData.studentName}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEvalModal(false)}></button>
              </div>
              <form onSubmit={handleCreateEval}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">الجروب</label>
                    <input type="text" className="form-control bg-light border-0" disabled value={evalData.courseGroupName} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">تقييم التاسكات</label>
                      <input type="number" className="form-control bg-light border-0" required min="0" max="100"
                        value={evalData.taskScore} onChange={e => setEvalData({...evalData, taskScore: e.target.value})} placeholder="0-100" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">تقييم الاتوديوت</label>
                      <input type="number" className="form-control bg-light border-0" required min="0" max="100"
                        value={evalData.attitudeScore} onChange={e => setEvalData({...evalData, attitudeScore: e.target.value})} placeholder="0-100" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">التقييم العام</label>
                      <input type="number" className="form-control bg-light border-0" required min="0" max="100"
                        value={evalData.score} onChange={e => setEvalData({...evalData, score: e.target.value})} placeholder="0-100" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">ملاحظات التقييم</label>
                    <textarea className="form-control bg-light border-0" rows="3"
                      value={evalData.notes} onChange={e => setEvalData({...evalData, notes: e.target.value})} placeholder="أدخل ملاحظاتك حول مستوى الطالب..." />
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowEvalModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-success px-5 shadow">حفظ التقييم</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
