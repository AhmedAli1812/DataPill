import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getInstructorDashboard, recordInstructorSession } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const InstructorDashboard = () => {
  const { isAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetInstructorId = searchParams.get('id'); // For Admins viewing a specific instructor

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [sessionData, setSessionData] = useState({
    instructorId: targetInstructorId || (user ? user.id : ''),
    courseGroupId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    hoursWorked: ''
  });

  const loadDashboard = async () => {
    try {
      const result = await getInstructorDashboard(targetInstructorId);
      setData(result);
      if (targetInstructorId) {
        setSessionData(prev => ({ ...prev, instructorId: targetInstructorId }));
      }
    } catch (error) {
      toast.error('فشل تحميل بيانات المحاضر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [targetInstructorId]);

  const handleRecordSession = async (e) => {
    e.preventDefault();
    try {
      await recordInstructorSession({
        ...sessionData,
        hoursWorked: parseFloat(sessionData.hoursWorked)
      });
      toast.success('تم تسجيل الجلسة بنجاح');
      setShowRecordModal(false);
      setSessionData({ ...sessionData, hoursWorked: '' });
      loadDashboard();
    } catch (error) {
      toast.error('فشل تسجيل الجلسة');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
        <div className="spinner-grow text-primary" role="status"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-5">لا توجد بيانات متاحة</div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">لوحة تحكم المحاضر</h2>
          <p className="text-muted mb-0">متابعة الجروبات، الساعات المستحقة، والمدفوعات</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowRecordModal(true)}>
            <i className="bi bi-clock-history me-2"></i> تسجيل ساعات عمل
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body p-4 text-center">
              <h6 className="opacity-75 mb-2">إجمالي الساعات</h6>
              <h2 className="fw-bold mb-0">{data.stats.totalHours} <small className="fs-6">ساعة</small></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body p-4 text-center">
              <h6 className="opacity-75 mb-2">إجمالي المستحقات</h6>
              <h2 className="fw-bold mb-0">{data.stats.totalEarned.toLocaleString()} <small className="fs-6">ج.م</small></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body p-4 text-center">
              <h6 className="opacity-75 mb-2">المبالغ المستلمة</h6>
              <h2 className="fw-bold mb-0">{data.stats.totalPaid.toLocaleString()} <small className="fs-6">ج.م</small></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-white">
            <div className="card-body p-4 text-center">
              <h6 className="opacity-75 mb-2">المتبقي</h6>
              <h2 className="fw-bold mb-0">{data.stats.pendingAmount.toLocaleString()} <small className="fs-6">ج.م</small></h2>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Student Sessions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark"><i className="bi bi-calendar-event me-2 text-primary"></i> السيشنات المجدولة (للطلاب)</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="bg-light border-bottom">
                    <tr>
                      <th className="py-3 px-4 text-start">الجروب</th>
                      <th className="py-3">عنوان السيشن</th>
                      <th className="py-3">التاريخ والوقت</th>
                      <th className="py-3">رابط الميتينج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data.upcomingSessions || data.upcomingSessions.length === 0) ? (
                      <tr><td colSpan="4" className="py-4 text-muted">لا توجد سيشنات مجدولة لك حالياً</td></tr>
                    ) : (
                      data.upcomingSessions.map(s => (
                        <tr key={s.id}>
                          <td className="px-4 text-start fw-bold text-primary">{s.courseGroupName}</td>
                          <td className="fw-medium">{s.title}</td>
                          <td>
                            <div className="fw-bold">{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</div>
                            <div className="text-muted small" dir="ltr">{s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}</div>
                          </td>
                          <td>
                            {s.meetingLink ? (
                              <a href={s.meetingLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary rounded-pill px-4 shadow-sm">
                                <i className="bi bi-camera-video-fill me-1"></i> انضمام
                              </a>
                            ) : (
                              <span className="text-muted small">غير متاح</span>
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
      </div>

      <div className="row g-4">
        {/* Assigned Groups */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark"><i className="bi bi-collection me-2 text-primary"></i> جروباتي الحالية</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="bg-light border-bottom">
                    <tr>
                      <th className="py-3 px-4 text-start">الجروب</th>
                      <th className="py-3">المواعيد</th>
                      <th className="py-3">الطلاب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.length === 0 ? (
                      <tr><td colSpan="3" className="py-4 text-muted">لا توجد جروبات مسجلة لك حالياً</td></tr>
                    ) : (
                      data.groups.map(g => (
                        <tr key={g.id}>
                          <td className="px-4 text-start fw-bold">{g.name}</td>
                          <td><span className="badge bg-light text-dark border">{g.schedule || '-'}</span></td>
                          <td><span className="badge bg-primary rounded-pill">{g.studentCount}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark"><i className="bi bi-journal-text me-2 text-primary"></i> سجل الساعات (Sessions)</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="bg-light border-bottom">
                    <tr>
                      <th className="py-3 px-4 text-start">التاريخ / التفاصيل</th>
                      <th className="py-3">الجروب</th>
                      <th className="py-3">الساعات</th>
                      <th className="py-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSessions.length === 0 ? (
                      <tr><td colSpan="4" className="py-4 text-muted">لم يتم تسجيل جلسات عمل بعد</td></tr>
                    ) : (
                      data.recentSessions.map(s => (
                        <tr key={s.id}>
                          <td className="px-4 text-start">
                            <div className="fw-bold small">{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</div>
                            {s.sessionNote && <div className="text-muted" style={{fontSize: '11px'}}>{s.sessionNote}</div>}
                          </td>
                          <td className="fw-medium">{s.courseGroupName}</td>
                          <td className="fw-bold">{s.hoursWorked}</td>
                          <td>
                            {s.isPaid ? (
                              <span className="badge bg-success-subtle text-success border-success-subtle px-2 py-1">تم الاستلام</span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning-emphasis border-warning-subtle px-2 py-1">معلق</span>
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
      </div>

      {/* Record Session Modal */}
      {showRecordModal && isAdmin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="fw-bold">تسجيل ساعات عمل للمحاضر</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowRecordModal(false)}></button>
              </div>
              <form onSubmit={handleRecordSession}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">الجروب</label>
                    <select className="form-select bg-light border-0" required
                      value={sessionData.courseGroupId} onChange={e => setSessionData({...sessionData, courseGroupId: e.target.value})}>
                      <option value="">اختر الجروب...</option>
                      {data.groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">التاريخ</label>
                    <input type="date" className="form-control bg-light border-0" required
                      value={sessionData.sessionDate} onChange={e => setSessionData({...sessionData, sessionDate: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">عدد الساعات</label>
                    <input type="number" step="0.5" className="form-control bg-light border-0" required placeholder="0.0"
                      value={sessionData.hoursWorked} onChange={e => setSessionData({...sessionData, hoursWorked: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-link text-muted" onClick={() => setShowRecordModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 shadow">تسجيل الساعات</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
