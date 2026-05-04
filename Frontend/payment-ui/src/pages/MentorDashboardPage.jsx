import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const MentorDashboardPage = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [materialLink, setMaterialLink] = useState('');
  const [recordLink, setRecordLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadMentorData();
  }, []);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      const token = user?.token || JSON.parse(localStorage.getItem('user') || '{}').token;
      const res = await axios.get('http://localhost:5089/api/Mentor/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
      if (res.data.length > 0) {
        handleGroupChange(res.data[0]);
      }
    } catch (err) {
      toast.error('فشل تحميل بيانات المينتور');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = async (group) => {
    setSelectedGroup(group);
    setSelectedStudent(null);
    setAttendanceReport([]);
    try {
      setLoadingSessions(true);
      const token = user?.token || JSON.parse(localStorage.getItem('user') || '{}').token;
      const res = await axios.get(`http://localhost:5089/api/Mentor/group/${group.id}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);

      try {
        const resReport = await axios.get(`http://localhost:5089/api/Mentor/group/${group.id}/attendance-report`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendanceReport(resReport.data);
      } catch (e) {
        console.error('Failed to fetch attendance report', e);
      }
    } catch (err) {
      toast.error('فشل تحميل السيشنات');
    } finally {
      setLoadingSessions(false);
    }
  };

  const openMaterialModal = (session) => {
    setCurrentSession(session);
    setMaterialLink(session.materialLink || session.MaterialLink || session.materiallink || '');
    setRecordLink(session.recordLink || session.RecordLink || session.recordlink || '');
    setModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!currentSession) return;
    try {
      setSaving(true);
      const token = user?.token || JSON.parse(localStorage.getItem('user') || '{}').token;
      await axios.put(`http://localhost:5089/api/Mentor/session/${currentSession.id}/material`, 
        { materialLink, recordLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('تم الحفظ بنجاح');
      setSessions(sessions.map(s => s.id === currentSession.id ? { ...s, materialLink, recordLink } : s));
      setModalOpen(false);
    } catch (err) {
      toast.error('فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: '#f8fafc' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-vh-100" style={{ background: '#f8fafc', paddingBottom: '3rem' }}>
      {/* Premium Header */}
      <div className="bg-white shadow-sm mb-4 sticky-top" style={{ zIndex: 1000 }}>
        <div className="container-fluid" style={{ maxWidth: '1200px' }}>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {user?.fullName?.charAt(0) || 'M'}
              </div>
              <div>
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  مرحباً، {user?.fullName} <span className="fs-5">👋</span>
                </h4>
                <p className="text-muted mb-0 small">بوابة المينتور - متابعة الجروبات ورفع الماتريال</p>
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
        {groups.length === 0 ? (
          <div className="alert alert-info border-0 rounded-4 p-4 shadow-sm text-center">
            <i className="bi bi-info-circle-fill fs-3 d-block mb-2 text-info"></i>
            <span className="fw-bold">لم يتم تعيينك لأي جروبات حالياً.</span>
          </div>
        ) : (
          <div className="row g-4">
            {/* Sidebar with groups selection */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 rounded-4 shadow-sm h-100 p-4">
                <h5 className="fw-bold text-dark mb-3"><i className="bi bi-collection me-2"></i>الجروبات الخاصة بك</h5>
                <div className="list-group list-group-flush d-flex flex-column gap-2">
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGroupChange(g)}
                      className={`list-group-item list-group-item-action border-0 rounded-3 px-3 py-3 d-flex flex-column gap-1 transition-all ${selectedGroup?.id === g.id ? 'bg-primary bg-opacity-10 text-primary border-start border-primary border-4' : 'text-dark bg-light bg-opacity-50'}`}
                      style={{ transition: 'all 0.2s' }}
                    >
                      <div className="d-flex justify-content-between align-items-center w-100">
                        <span className="fw-bold fs-5">{g.name}</span>
                        {g.groupCode && <span className="badge bg-secondary text-white rounded-pill">{g.groupCode}</span>}
                      </div>
                      <div className="small text-muted"><i className="bi bi-calendar2-week me-1"></i> {g.schedule || 'لم يحدد'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Group details */}
            <div className="col-12 col-lg-8">
              <div className="d-flex flex-column gap-4">
                {/* Students list */}
                <div className="card border-0 rounded-4 shadow-sm p-4">
                  <h5 className="fw-bold text-dark mb-3">
                    <i className="bi bi-people me-2"></i>الطلاب المسجلين في الجروب ({selectedGroup?.students?.length || 0})
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th className="px-4">الاسم</th>
                          <th className="px-4">رقم الهاتف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedGroup?.students || selectedGroup.students.length === 0 ? (
                          <tr><td colSpan="2" className="py-4 text-center text-muted">لا يوجد طلاب مسجلين</td></tr>
                        ) : (
                          selectedGroup.students.map(s => (
                            <tr key={s.id}>
                              <td className="px-4 fw-bold">{s.name}</td>
                              <td className="px-4" dir="ltr">{s.phone}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <ul className="nav nav-pills mb-3 gap-2">
                  <li className="nav-item">
                    <button className={`nav-link rounded-pill fw-bold px-4 ${activeTab === 'sessions' ? 'active bg-primary text-white' : 'bg-white text-muted border'}`} onClick={() => { setActiveTab('sessions'); setSelectedStudent(null); }}>
                      السيشنات والماتريال
                    </button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link rounded-pill fw-bold px-4 ${activeTab === 'attendance' ? 'active bg-primary text-white' : 'bg-white text-muted border'}`} onClick={() => { setActiveTab('attendance'); setSelectedStudent(null); }}>
                      تقرير الحضور والغياب للطلاب
                    </button>
                  </li>
                </ul>

                {activeTab === 'sessions' && (
                  <div className="card border-0 rounded-4 shadow-sm p-4">
                    <h5 className="fw-bold text-dark mb-3">
                      <i className="bi bi-calendar2-check me-2"></i>السيشنات والماتريال
                    </h5>
                    {loadingSessions ? (
                      <div className="d-flex justify-content-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light text-secondary">
                            <tr>
                              <th className="px-4">السيشن</th>
                              <th className="px-4">التاريخ والوقت</th>
                              <th className="px-4">الماتريال والريكورد</th>
                              <th className="px-4 text-center">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.length === 0 ? (
                              <tr><td colSpan="4" className="py-4 text-center text-muted">لا توجد سيشنات مجدولة</td></tr>
                            ) : (
                              sessions.map(s => (
                                <tr key={s.id}>
                                  <td className="px-4 fw-bold text-dark">{s.title}</td>
                                  <td className="px-4 text-muted">
                                    <div><i className="bi bi-calendar-event me-1"></i> {new Date(s.sessionDate).toLocaleDateString('ar-EG')}</div>
                                    <div className="small"><i className="bi bi-clock me-1"></i> {s.startTime} - {s.endTime}</div>
                                  </td>
                                  <td className="px-4">
                                    <div className="d-flex flex-column gap-1">
                                      {(s.materialLink || s.MaterialLink || s.materiallink) ? (
                                        <a href={s.materialLink || s.MaterialLink || s.materiallink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold d-flex align-items-center gap-1 w-fit py-1">
                                          <i className="bi bi-cloud-arrow-down fs-5"></i>
                                          <span>عرض الماتريال</span>
                                        </a>
                                      ) : (
                                        <span className="badge bg-light text-muted border px-2 py-1 w-fit">بدون ماتريال</span>
                                      )}
                                      {(s.recordLink || s.RecordLink || s.recordlink) ? (
                                        <a href={s.recordLink || s.RecordLink || s.recordlink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold d-flex align-items-center gap-1 w-fit py-1">
                                          <i className="bi bi-play-circle fs-5"></i>
                                          <span>عرض الريكورد</span>
                                        </a>
                                      ) : (
                                        <span className="badge bg-light text-muted border px-2 py-1 w-fit">بدون ريكورد</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                      {s.meetingLink && (
                                        <a href={s.meetingLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1">
                                          <i className="bi bi-box-arrow-up-right"></i> دخول السيشن
                                        </a>
                                      )}
                                      <button onClick={() => openMaterialModal(s)} className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm">
                                        <i className="bi bi-cloud-arrow-up me-1"></i> {s.materialLink || s.recordLink ? 'تعديل البيانات' : 'رفع البيانات'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="card border-0 rounded-4 shadow-sm p-4">
                    {!selectedStudent ? (
                      <>
                        <h5 className="fw-bold text-dark mb-3">
                          <i className="bi bi-check2-circle me-2"></i>تفاصيل الحضور والغياب للطلاب
                        </h5>
                        {attendanceReport.length === 0 ? (
                          <div className="text-center text-muted py-3">لا توجد سجلات حضور للطلاب حالياً.</div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                              <thead className="table-light text-secondary">
                                <tr>
                                  <th className="px-4">اسم الطالب</th>
                                  <th className="px-4">رقم الهاتف</th>
                                  <th className="px-4 text-center">حضور</th>
                                  <th className="px-4 text-center">غياب</th>
                                  <th className="px-4 text-center">إجمالي السيشنات</th>
                                  <th className="px-4 text-center">نسبة الحضور</th>
                                  <th className="px-4 text-center">التفاصيل</th>
                                </tr>
                              </thead>
                              <tbody>
                                {attendanceReport.map(student => (
                                  <tr key={student.studentId}>
                                    <td className="px-4 fw-bold">{student.studentName}</td>
                                    <td className="px-4">{student.phoneNumber}</td>
                                    <td className="px-4 text-center"><span className="badge bg-success">{student.attendedCount}</span></td>
                                    <td className="px-4 text-center"><span className="badge bg-danger">{student.absentCount}</span></td>
                                    <td className="px-4 text-center">{student.totalSessions}</td>
                                    <td className="px-4 text-center fw-bold text-primary">{student.attendancePercentage}%</td>
                                    <td className="px-4 text-center">
                                      <button className="btn btn-sm btn-outline-primary py-1 px-3 rounded-pill" onClick={() => setSelectedStudent(student)}>
                                        عرض السيشنات
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold text-dark mb-0">
                            <i className="bi bi-info-circle me-2"></i>تفاصيل السيشنات للطالب: {selectedStudent.studentName}
                          </h5>
                          <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setSelectedStudent(null)}>عودة للتقرير</button>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-secondary">
                              <tr>
                                <th className="px-4">عنوان السيشن</th>
                                <th className="px-4">تاريخ السيشن</th>
                                <th className="px-4 text-center">الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.sessions?.map((s, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 fw-bold">{s.title}</td>
                                  <td className="px-4">{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</td>
                                  <td className="px-4 text-center">
                                    <span className={`badge ${s.isAttended ? 'bg-success' : 'bg-danger'}`}>
                                      {s.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom-0 p-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-cloud-arrow-up-fill text-primary"></i>
                  رفع أو تعديل الماتريال والريكورد
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSaveMaterial}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">عنوان السيشن</label>
                    <input type="text" className="form-control bg-light border-0 fw-bold" value={currentSession?.title || ''} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">رابط الماتريال (Drive, GitHub, etc.)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-link-45deg"></i></span>
                      <input
                        type="url"
                        className="form-control bg-light border-0"
                        placeholder="https://drive.google.com/..."
                        value={materialLink}
                        onChange={(e) => setMaterialLink(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">رابط الريكورد (Drive, YouTube, Zoom)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-camera-video"></i></span>
                      <input
                        type="url"
                        className="form-control bg-light border-0"
                        placeholder="https://drive.google.com/..."
                        value={recordLink}
                        onChange={(e) => setRecordLink(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 p-4 pt-0 justify-content-end gap-2">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setModalOpen(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" role="status"></span> : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboardPage;
