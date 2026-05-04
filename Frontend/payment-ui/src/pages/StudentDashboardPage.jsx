import React, { useState, useEffect } from 'react';
import { getStudentDashboard, getStudentGroupSessions, joinStudentSession } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const StudentDashboardPage = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ groups: [], attendance: {}, evaluations: [] });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await getStudentDashboard();
      setData(res);
      if (res.groups && res.groups.length > 0) {
        handleSelectGroup(res.groups[0].groupId);
      }
    } catch (err) {
      toast.error('فشل تحميل بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (groupId) => {
    setSelectedGroup(groupId);
    try {
      setLoadingSessions(true);
      const res = await getStudentGroupSessions(groupId);
      setSessions(res);
    } catch (err) {
      toast.error('فشل تحميل السيشنات');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleJoin = async (sessionId) => {
    try {
      const res = await joinStudentSession(sessionId);
      if (res.meetingLink) {
        // Record attendance locally
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, isAttended: true } : s));
        window.open(res.meetingLink, '_blank');
      } else {
        toast.info('لا يوجد رابط ميتينج متاح حالياً');
      }
    } catch (err) {
      toast.error('فشل الانضمام للسيشن');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '100vh', background: '#f8fafc'}}>
        <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-vh-100" style={{ background: '#f8fafc', paddingBottom: '2rem' }}>
      {/* Premium Header */}
      <div className="bg-white shadow-sm mb-4 sticky-top" style={{ zIndex: 1000 }}>
        <div className="container-fluid" style={{ maxWidth: '1200px' }}>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {user?.fullName?.charAt(0) || 'S'}
              </div>
              <div>
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  مرحباً، {user?.fullName} <span className="fs-5">👋</span>
                </h4>
                <p className="text-muted mb-0 small">بوابة الطالب - متابعة الجروبات والسيشنات</p>
              </div>
            </div>
            <div>
              <button onClick={logout} className="btn btn-outline-danger shadow-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-sm-inline">تسجيل خروج</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid" style={{ maxWidth: '1200px' }}>

      <div className="row g-4 mb-4">
        {/* Attendance Widget */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">نسبة الحضور العامة</h6>
                <div className="bg-white bg-opacity-25 rounded p-2">
                  <i className="bi bi-calendar-check fs-5"></i>
                </div>
              </div>
              <h2 className="display-4 fw-bold mb-1">{data.attendance.percentage}%</h2>
              <p className="mb-0 text-white-50">حضرت {data.attendance.attended} من أصل {data.attendance.totalSessions} سيشن</p>
            </div>
          </div>
        </div>

        {/* Groups Widget */}
        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3">جروباتي</h5>
              <div className="d-flex gap-2 overflow-auto pb-2">
                {data.groups.map(g => (
                  <button 
                    key={g.groupId}
                    className={`btn ${selectedGroup === g.groupId ? 'btn-primary' : 'btn-outline-primary'} flex-shrink-0`}
                    onClick={() => handleSelectGroup(g.groupId)}
                  >
                    <div className="fw-bold">{g.groupName}</div>
                    <small className={selectedGroup === g.groupId ? 'text-white-50' : 'text-muted'}>{g.groupCode}</small>
                  </button>
                ))}
                {data.groups.length === 0 && <span className="text-muted">لا توجد جروبات مسجلة</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Sessions List */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">سيشنات الجروب المحدد</h5>
            </div>
            <div className="card-body">
              {loadingSessions ? (
                <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-5 text-muted">لا توجد سيشنات مجدولة حالياً</div>
              ) : (
                <div className="list-group list-group-flush">
                  {sessions.map(s => (
                    <div key={s.id} className="list-group-item d-flex justify-content-between align-items-center py-3 px-0 border-light-subtle">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center ${s.isAttended ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`} style={{width: '40px', height: '40px'}}>
                          <i className={`bi ${s.isAttended ? 'bi-check-lg fs-4' : 'bi-camera-video-fill'}`}></i>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">{s.title}</h6>
                          <small className="text-muted d-block">
                            {new Date(s.sessionDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </small>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <small className="text-primary fw-bold" dir="ltr">
                              <i className="bi bi-clock me-1"></i>
                              {s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}
                            </small>
                            {(s.materialLink || s.MaterialLink || s.materiallink) && (
                              <a href={s.materialLink || s.MaterialLink || s.materiallink} target="_blank" rel="noreferrer" className="badge bg-success text-decoration-none rounded-pill px-2 py-1">
                                <i className="bi bi-cloud-arrow-down-fill me-1"></i> الماتريال
                              </a>
                            )}
                            {(s.recordLink || s.RecordLink || s.recordlink) && (
                              <a href={s.recordLink || s.RecordLink || s.recordlink} target="_blank" rel="noreferrer" className="badge bg-info text-decoration-none rounded-pill px-2 py-1">
                                <i className="bi bi-play-circle-fill me-1"></i> الريكورد
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-2">
                        <div className="d-flex gap-2">
                          {(s.materialLink || s.MaterialLink || s.materiallink) && (
                            <a href={s.materialLink || s.MaterialLink || s.materiallink} target="_blank" rel="noreferrer" className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm">
                              <i className="bi bi-cloud-arrow-down-fill"></i> الماتريال
                            </a>
                          )}
                          {(s.recordLink || s.RecordLink || s.recordlink) && (
                            <a href={s.recordLink || s.RecordLink || s.recordlink} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm">
                              <i className="bi bi-play-circle-fill"></i> الريكورد
                            </a>
                          )}
                        </div>
                        {s.isAttended ? (
                          <span className="badge bg-success rounded-pill px-3 py-2"><i className="bi bi-check-circle me-1"></i> تم الحضور</span>
                        ) : s.canJoin ? (
                          <button className="btn btn-primary shadow-sm rounded-pill px-4" onClick={() => handleJoin(s.id)}>
                            <i className="bi bi-play-fill me-1"></i> انضمام للميتينج
                          </button>
                        ) : new Date(s.sessionDate) >= new Date(new Date().setHours(0,0,0,0)) ? (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2">
                            <i className="bi bi-lock-fill me-1"></i> يفتح الساعة {s.startTime?.substring(0,5)}
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">فات الميعاد</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evaluations */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">التقييمات</h5>
            </div>
            <div className="card-body">
              {data.evaluations.length === 0 ? (
                <div className="text-center py-5 text-muted">لا توجد تقييمات مسجلة</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.evaluations.map((e, idx) => (
                    <div key={idx} className="border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold text-dark">{e.groupName}</span>
                        <small className="text-muted">{new Date(e.createdAt).toLocaleDateString('ar-EG')}</small>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                          <span>المهام (Tasks)</span>
                          <span className="fw-bold">{e.taskScore}%</span>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div className="progress-bar bg-info" style={{ width: `${e.taskScore}%` }}></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span>السلوك والتفاعل</span>
                          <span className="fw-bold">{e.attitudeScore}%</span>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div className="progress-bar bg-warning" style={{ width: `${e.attitudeScore}%` }}></div>
                        </div>
                      </div>
                      {e.notes && (
                        <div className="bg-white p-2 rounded small text-muted border">
                          <i className="bi bi-chat-left-text me-1 text-primary"></i> {e.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default StudentDashboardPage;
