import React, { useState, useEffect } from 'react';
import { getAllInstructorsWithGroups, recordInstructorSession, getAllInstructorSessions, updateInstructorSession, deleteInstructorSession, createInstructor } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const InstructorManagementPage = () => {
  const { isAdmin, isCoordinator } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [newInstructorData, setNewInstructorData] = useState({
    fullName: '', email: '', password: '', role: 'Instructor', hourlyRate: ''
  });
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [sessionData, setSessionData] = useState({
    courseGroupId: '',
    hoursWorked: '',
    sessionDate: new Date().toISOString().split('T')[0],
    day: '',
    timeFrom: '',
    timeTo: '',
    sessionNote: ''
  });

  const loadData = async () => {
    try {
      const [instData, sessionDataList] = await Promise.all([
        getAllInstructorsWithGroups(),
        getAllInstructorSessions()
      ]);
      setInstructors(instData);
      setSessions(sessionDataList);
    } catch (error) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstructor = async (e) => {
    e.preventDefault();
    try {
      await createInstructor({
        ...newInstructorData,
        hourlyRate: parseFloat(newInstructorData.hourlyRate) || 0
      });
      toast.success('تم إضافة المحاضر بنجاح');
      setShowAddInstructorModal(false);
      setNewInstructorData({ fullName: '', email: '', password: '', role: 'Instructor', hourlyRate: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إضافة المحاضر');
    }
  };

  const calculateHours = (from, to) => {
    if (!from || !to) return '';
    const [h1, m1] = from.split(':').map(Number);
    const [h2, m2] = to.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // Handle overnight
    return (diff / 60).toFixed(2);
  };

  useEffect(() => {
    if (sessionData.timeFrom && sessionData.timeTo) {
      const hrs = calculateHours(sessionData.timeFrom, sessionData.timeTo);
      setSessionData(prev => ({ ...prev, hoursWorked: hrs }));
    }
  }, [sessionData.timeFrom, sessionData.timeTo]);

  useEffect(() => {
    loadData();
  }, []);

  const openSessionModal = (instructor) => {
    setSelectedInstructor(instructor);
    setSessionData({
      courseGroupId: instructor.groups?.length === 1 ? instructor.groups[0].id : '',
      hoursWorked: '',
      sessionDate: new Date().toISOString().split('T')[0],
      day: '',
      timeFrom: '',
      timeTo: '',
      sessionNote: ''
    });
    setShowSessionModal(true);
    setIsEditingSession(false);
    setEditingSessionId(null);
  };

  const handleEditSession = (session) => {
    const inst = instructors.find(i => i.id === session.instructorId);
    if (!inst) return;
    
    setSelectedInstructor(inst);
    setSessionData({
      courseGroupId: session.courseGroupId,
      hoursWorked: session.hoursWorked,
      sessionDate: session.sessionDate.split('T')[0],
      day: session.sessionNote?.split(' من ')[0] || '',
      timeFrom: session.sessionNote?.split(' من ')[1]?.split(' إلى ')[0] || '',
      timeTo: session.sessionNote?.split(' إلى ')[1] || '',
      sessionNote: session.sessionNote || ''
    });
    setIsEditingSession(true);
    setEditingSessionId(session.id);
    setShowSessionModal(true);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السيشن؟')) return;
    try {
      await deleteInstructorSession(id);
      toast.success('تم حذف السيشن بنجاح');
      loadData();
    } catch (error) {
      toast.error('فشل حذف السيشن');
    }
  };

  const handleRecordSession = async (e) => {
    e.preventDefault();
    try {
      const note = `${sessionData.day} من ${sessionData.timeFrom} إلى ${sessionData.timeTo}`.trim();
      const payload = {
        ...sessionData,
        instructorId: selectedInstructor.id,
        hoursWorked: parseFloat(sessionData.hoursWorked),
        sessionNote: note || sessionData.sessionNote
      };

      if (isEditingSession) {
        await updateInstructorSession(editingSessionId, payload);
        toast.success('تم تعديل السيشن بنجاح');
      } else {
        await recordInstructorSession(payload);
        toast.success('تم تسجيل السيشن بنجاح');
      }
      setShowSessionModal(false);
      loadData();
    } catch (error) {
      toast.error('فشل تسجيل السيشن');
    }
  };

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
          <h2 className="fw-bold text-dark mb-1">إدارة المحاضرين والسيشنات</h2>
          <p className="text-muted mb-0">متابعة المحاضرين، الجروبات المسندة إليهم، وتسجيل ساعات العمل</p>
        </div>
        {(isAdmin || isCoordinator) && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowAddInstructorModal(true)}>
            <i className="bi bi-person-plus-fill me-2"></i> إضافة محاضر جديد
          </button>
        )}
      </div>

      <div className="row g-4">
        {instructors.map(instructor => (
          <div key={instructor.id} className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100 premium-hover">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="avatar-lg bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-person-workspace fs-3"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">{instructor.fullName}</h5>
                    <small className="text-muted">{instructor.email}</small>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="small fw-bold text-secondary mb-2">الجروبات المسندة:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {instructor.groups?.length > 0 ? (
                      instructor.groups.map(g => (
                        <span key={g.id} className="badge bg-light text-dark border py-2 px-3">
                          {g.name} <span className="text-primary small ms-1">({g.groupCode})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-muted small italic">لا يوجد جروبات مسندة حالياً</span>
                    )}
                  </div>
                </div>

                {(isAdmin || isCoordinator) && (
                  <button 
                    className="btn btn-outline-primary w-100 rounded-pill"
                    onClick={() => openSessionModal(instructor)}
                    disabled={instructor.groups?.length === 0}
                  >
                    <i className="bi bi-clock-history me-2"></i> تسجيل سيشن جديدة
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 mb-5 animate-fade-in">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-primary"></i> آخر السيشنات المسجلة</h5>
            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={loadData}>
              <i className="bi bi-arrow-clockwise me-1"></i> تحديث
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-center">
                <thead className="bg-light border-bottom">
                  <tr>
                    <th className="py-3 px-4 text-start">المحاضر</th>
                    <th className="py-3">الجروب</th>
                    <th className="py-3">التاريخ / التفاصيل</th>
                    <th className="py-3">الساعات</th>
                    <th className="py-3">الحالة</th>
                    <th className="py-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan="6" className="py-4 text-muted">لم يتم تسجيل جلسات عمل بعد</td></tr>
                  ) : (
                    sessions.map(s => (
                      <tr key={s.id}>
                        <td className="px-4 text-start">
                          <div className="fw-bold">{s.instructorName}</div>
                        </td>
                        <td className="fw-medium text-primary">{s.courseGroupName}</td>
                        <td className="small">
                          <div className="fw-bold">{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</div>
                          {s.sessionNote && <div className="text-muted" style={{fontSize: '11px'}}>{s.sessionNote}</div>}
                        </td>
                        <td className="fw-bold">{s.hoursWorked}</td>
                        <td>
                          {s.isPaid ? (
                            <span className="badge bg-success-subtle text-success border-success-subtle px-2 py-1">تم الاستلام</span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning-emphasis border-warning-subtle px-2 py-1">معلق</span>
                          )}
                        </td>
                        <td>
                          {!s.isPaid && (
                            <div className="d-flex justify-content-center gap-2">
                              <button className="btn btn-link text-primary p-0" onClick={() => handleEditSession(s)}>
                                <i className="bi bi-pencil-square fs-5"></i>
                              </button>
                              <button className="btn btn-link text-danger p-0" onClick={() => handleDeleteSession(s.id)}>
                                <i className="bi bi-trash fs-5"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showSessionModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تسجيل سيشن للمحاضر</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowSessionModal(false)}></button>
              </div>
              <form onSubmit={handleRecordSession}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">تسجيل ساعات عمل للمحاضر: <strong>{selectedInstructor?.fullName}</strong></p>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">اختر الجروب</label>
                    <select 
                      className="form-select bg-light border-0" 
                      required
                      value={sessionData.courseGroupId}
                      onChange={e => setSessionData({...sessionData, courseGroupId: e.target.value})}
                    >
                      <option value="">-- اختر الجروب --</option>
                      {selectedInstructor?.groups?.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.groupCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">اليوم</label>
                      <input 
                        type="text" 
                        className="form-control bg-light border-0" 
                        placeholder="مثال: السبت"
                        value={sessionData.day}
                        onChange={e => setSessionData({...sessionData, day: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">تاريخ السيشن</label>
                      <input 
                        type="date" 
                        className="form-control bg-light border-0" 
                        required
                        value={sessionData.sessionDate}
                        onChange={e => setSessionData({...sessionData, sessionDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">من (الساعة)</label>
                      <input 
                        type="time" 
                        className="form-control bg-light border-0" 
                        value={sessionData.timeFrom}
                        onChange={e => setSessionData({...sessionData, timeFrom: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">إلى (الساعة)</label>
                      <input 
                        type="time" 
                        className="form-control bg-light border-0" 
                        value={sessionData.timeTo}
                        onChange={e => setSessionData({...sessionData, timeTo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowSessionModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-success px-4 shadow">تأكيد التسجيل</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Instructor Modal */}
      {showAddInstructorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold"><i className="bi bi-person-plus-fill me-2 text-primary"></i>إضافة محاضر جديد</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowAddInstructorModal(false)}></button>
              </div>
              <form onSubmit={handleAddInstructor}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">الاسم الكامل</label>
                      <input type="text" className="form-control bg-light border-0" required
                        placeholder="اسم المحاضر"
                        value={newInstructorData.fullName}
                        onChange={e => setNewInstructorData({...newInstructorData, fullName: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">البريد الإلكتروني</label>
                      <input type="email" className="form-control bg-light border-0" required
                        placeholder="email@example.com"
                        value={newInstructorData.email}
                        onChange={e => setNewInstructorData({...newInstructorData, email: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">كلمة المرور</label>
                      <input type="password" className="form-control bg-light border-0" required minLength={6}
                        placeholder="6 أحرف على الأقل"
                        value={newInstructorData.password}
                        onChange={e => setNewInstructorData({...newInstructorData, password: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">سعر الساعة (ج.م)</label>
                      <input type="number" className="form-control bg-light border-0" min="0"
                        placeholder="0"
                        value={newInstructorData.hourlyRate}
                        onChange={e => setNewInstructorData({...newInstructorData, hourlyRate: e.target.value})} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-secondary">الدور الوظيفي</label>
                      <select className="form-select bg-light border-0"
                        value={newInstructorData.role}
                        onChange={e => setNewInstructorData({...newInstructorData, role: e.target.value})}>
                        <option value="Instructor">محاضر (Instructor)</option>
                        <option value="Mentor">مساعد (Mentor)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowAddInstructorModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 shadow">إضافة المحاضر</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorManagementPage;
