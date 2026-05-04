import React, { useState, useEffect } from 'react';
import { getGroups, createGroup, updateGroup, deleteGroup, getSalesUsers, recordInstructorSession, getGroupSessions, createGroupSession, updateGroupSession, deleteGroupSession } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GroupsPage = () => {
  const { isAdmin, isAccountant, isCoordinator } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]); // Instructors/Employees
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showStudentSessionModal, setShowStudentSessionModal] = useState(false);
  const [studentSessions, setStudentSessions] = useState([]);
  const [newStudentSession, setNewStudentSession] = useState({ title: '', sessionDate: new Date().toISOString().split('T')[0], startTime: '19:00', endTime: '21:00', instructorId: '', meetingLink: '' });
  const [isEditingStudentSession, setIsEditingStudentSession] = useState(false);
  const [editingStudentSessionId, setEditingStudentSessionId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessionData, setSessionData] = useState({
    instructorId: '',
    hoursWorked: '',
    sessionDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({ name: '', wave: '' });
  const [newGroup, setNewGroup] = useState({
    name: '',
    waveName: '',
    groupCode: '',
    totalHours: '',
    price: '',
    startDate: new Date().toISOString().split('T')[0],
    capacity: 20,
    instructorIds: [],
    day1: '',
    day1Time: '',
    day2: '',
    day2Time: '',
    schedule: ''
  });

  const loadData = async () => {
    try {
      const groupsData = await getGroups();
      setGroups(groupsData);

      if (isAdmin || isCoordinator || isAccountant) {
        try {
          const usersData = await getSalesUsers();
          setUsers(usersData);
        } catch (e) {
          console.error('Failed to load users', e);
        }
      }
    } catch (error) {
      toast.error('فشل تحميل الجروبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const groupPayload = {
        ...newGroup,
        price: parseFloat(newGroup.price),
        capacity: parseInt(newGroup.capacity)
      };

      if (isEditing) {
        await updateGroup(editingId, groupPayload);
        toast.success('تم تحديث الجروب بنجاح');
      } else {
        await createGroup(groupPayload);
        toast.success('تم إنشاء الجروب بنجاح');
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(isEditing ? 'فشل تحديث الجروب' : 'فشل إنشاء الجروب');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewGroup({
      name: '',
      waveName: '',
      groupCode: '',
      totalHours: '',
      price: '',
      startDate: new Date().toISOString().split('T')[0],
      capacity: 20,
      instructorIds: [],
      day1: '',
      day1Time: '',
      day2: '',
      day2Time: '',
      schedule: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setIsEditing(true);
    setEditingId(group.id);
    setNewGroup({
      name: group.name,
      waveName: group.waveName || '',
      groupCode: group.groupCode || '',
      totalHours: group.totalHours || '',
      price: group.price.toString(),
      startDate: group.startDate.split('T')[0],
      capacity: group.capacity,
      instructorIds: group.instructorIds || [],
      day1: group.day1 || '',
      day1Time: group.day1Time || '',
      day2: group.day2 || '',
      day2Time: group.day2Time || '',
      schedule: group.schedule || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجروب؟')) {
      try {
        await deleteGroup(id);
        toast.success('تم حذف الجروب');
        loadData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'فشل حذف الجروب');
      }
    }
  };

  const openSessionModal = (group) => {
    setSelectedGroup(group);
    setSessionData({
      instructorId: group.instructorIds?.length === 1 ? group.instructorIds[0] : '',
      hoursWorked: '',
      sessionDate: new Date().toISOString().split('T')[0]
    });
    setShowSessionModal(true);
  };

  const openStudentSessionModal = async (group) => {
    setSelectedGroup(group);
    setShowStudentSessionModal(true);
    setStudentSessions([]);
    setAttendanceReport([]);
    setActiveTab('sessions');
    setSelectedStudent(null);
    setIsEditingStudentSession(false);
    setEditingStudentSessionId(null);
    setNewStudentSession({ title: '', sessionDate: new Date().toISOString().split('T')[0], startTime: '19:00', endTime: '21:00', instructorId: '', meetingLink: '', materialLink: '', recordLink: '' });
    try {
      const res = await getGroupSessions(group.id);
      setStudentSessions(res);

      const token = localStorage.getItem('token');
      const resReport = await fetch(`http://localhost:5089/api/Mentor/group/${group.id}/attendance-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resReport.ok) {
        const reportData = await resReport.json();
        setAttendanceReport(reportData);
      }
    } catch (e) {
      toast.error('فشل تحميل سيشنات الطلاب');
    }
  };

  const handleAddStudentSession = async (e) => {
    e.preventDefault();
    try {
      if (isEditingStudentSession) {
        await updateGroupSession(editingStudentSessionId, { ...newStudentSession, courseGroupId: selectedGroup.id });
        toast.success('تم تحديث السيشن بنجاح');
      } else {
        await createGroupSession({ ...newStudentSession, courseGroupId: selectedGroup.id });
        toast.success('تم إضافة السيشن بنجاح');
      }
      const res = await getGroupSessions(selectedGroup.id);
      setStudentSessions(res);
      setNewStudentSession({ title: '', sessionDate: new Date().toISOString().split('T')[0], startTime: '19:00', endTime: '21:00', instructorId: '', meetingLink: '', materialLink: '', recordLink: '' });
      setIsEditingStudentSession(false);
      setEditingStudentSessionId(null);
    } catch (e) {
      toast.error('فشل حفظ السيشن');
    }
  };

  const handleEditStudentSession = (session) => {
    setIsEditingStudentSession(true);
    setEditingStudentSessionId(session.id);
    setNewStudentSession({
      title: session.title,
      sessionDate: session.sessionDate.split('T')[0],
      startTime: session.startTime?.substring(0,5) || '19:00',
      endTime: session.endTime?.substring(0,5) || '21:00',
      instructorId: session.instructorId || '',
      meetingLink: session.meetingLink || session.MeetingLink || '',
      materialLink: session.materialLink || session.MaterialLink || '',
      recordLink: session.recordLink || session.RecordLink || ''
    });
  };

  const handleDeleteStudentSession = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السيشن؟')) return;
    try {
      await deleteGroupSession(id);
      setStudentSessions(studentSessions.filter(s => s.id !== id));
      toast.success('تم الحذف بنجاح');
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  const handleRecordSession = async (e) => {
    e.preventDefault();
    try {
      await recordInstructorSession({
        ...sessionData,
        courseGroupId: selectedGroup.id,
        hoursWorked: parseFloat(sessionData.hoursWorked)
      });
      toast.success('تم تسجيل السيشن بنجاح');
      setShowSessionModal(false);
    } catch (error) {
      toast.error('فشل تسجيل السيشن');
    }
  };

  const filteredGroups = groups.filter(g => {
    const matchName = g.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchWave = g.waveName.toLowerCase().includes(filters.wave.toLowerCase());
    return matchName && matchWave;
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
          <h2 className="fw-bold text-dark mb-1">إدارة الجروبات والويفز</h2>
          <p className="text-muted mb-0">إعداد وتنظيم مجموعات التدريب والدورات</p>
        </div>
        {(isAdmin || isCoordinator) && (
          <button className="btn btn-primary shadow-sm px-4" onClick={openAddModal}>
            <i className="bi bi-plus-circle-fill me-2"></i> إضافة جروب جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <input 
                type="text" 
                className="form-control border-0 bg-light" 
                placeholder="بحث باسم الجروب..." 
                value={filters.name}
                onChange={e => setFilters({...filters, name: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <input 
                type="text" 
                className="form-control border-0 bg-light" 
                placeholder="بحث بالويف (Wave)..." 
                value={filters.wave}
                onChange={e => setFilters({...filters, wave: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead>
                <tr className="bg-light">
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">الجروب / الكورس</th>
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">الويف (Wave)</th>
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">المواعيد</th>
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold text-center">عدد الساعات</th>
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">المحاضرين</th>
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">المينتورز</th>
                  {(!isCoordinator || isAdmin) && <th className="px-4 py-3 border-0 text-secondary small fw-bold">السعر</th>}
                  <th className="px-4 py-3 border-0 text-secondary small fw-bold">المشتركين</th>
                  {(isAdmin || isCoordinator) && <th className="px-4 py-3 border-0 text-secondary small fw-bold text-center">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="border-top-0">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">لا توجد جروبات حالياً</td>
                  </tr>
                ) : (
                  filteredGroups.map(group => (
                    <tr key={group.id} className="align-middle border-bottom border-light-subtle">
                      <td className="px-4 py-3">
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-dark">{group.name}</span>
                          {group.groupCode && <span className="badge bg-light text-primary border border-primary-subtle align-self-start mt-1 small" style={{fontSize: '10px'}}>{group.groupCode}</span>}
                          <small className="text-muted">سعة: {group.capacity}</small>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="badge bg-info-subtle text-info rounded-pill px-3">{group.waveName || '-'}</span>
                      </td>
                      <td className="px-4">
                        <div className="d-flex flex-column">
                          <small className="fw-medium">{group.schedule || '-'}</small>
                          <small className="text-muted" style={{fontSize: '11px'}}>يبدأ: {new Date(group.startDate).toLocaleDateString('ar-EG')}</small>
                        </div>
                      </td>
                      <td className="px-4 text-center">
                        <span className="fw-bold text-secondary">{group.totalHours || '0'} ساعة</span>
                      </td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">
                              {users
                                .filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'instructor')
                                .map(u => u.fullName)
                                .join(', ') || 'لم يحدد'}
                            </span>
                            {users.filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'instructor').length > 1 && (
                              <small className="text-muted" style={{fontSize: '10px'}}>
                                {users.filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'instructor').length} محاضرين
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-sm bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-person-badge"></i>
                          </div>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">
                              {users
                                .filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'mentor')
                                .map(u => u.fullName)
                                .join(', ') || 'لم يحدد'}
                            </span>
                            {users.filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'mentor').length > 1 && (
                              <small className="text-muted" style={{fontSize: '10px'}}>
                                {users.filter(u => group.instructorIds?.includes(u.id) && u.role && u.role.toLowerCase() === 'mentor').length} مينتورز
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      {(!isCoordinator || isAdmin) && (
                        <td className="px-4">
                          <span className="fw-bold text-primary">{group.price.toLocaleString()} ج.م</span>
                        </td>
                      )}
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{height: '6px', minWidth: '60px'}}>
                            <div className="progress-bar bg-success" style={{width: `${Math.min((group.subscriptionsCount/group.capacity)*100, 100)}%`}}></div>
                          </div>
                          <span className="badge bg-success rounded-pill">{group.subscriptionsCount}</span>
                        </div>
                      </td>
                      {(isAdmin || isCoordinator) && (
                        <td className="px-4 text-center">
                          <div className="d-flex justify-content-center gap-2">
                             <button className="btn btn-link text-info p-0" onClick={() => openStudentSessionModal(group)} title="إدارة سيشنات الطلاب">
                               <i className="bi bi-calendar2-week fs-5"></i>
                             </button>
                             <button className="btn btn-link text-success p-0" onClick={() => openSessionModal(group)} title="تسجيل أجر المحاضر">
                               <i className="bi bi-cash-stack fs-5"></i>
                             </button>
                            <button className="btn btn-link text-primary p-0" onClick={() => openEditModal(group)} title="تعديل">
                              <i className="bi bi-pencil-square fs-5"></i>
                            </button>
                            {isAdmin && (
                              <button className="btn btn-link text-danger p-0" onClick={() => handleDelete(group.id)} title="حذف">
                                <i className="bi bi-trash-fill fs-5"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{isEditing ? 'تعديل الجروب' : 'إضافة جروب جديد'}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">كود الجروب</label>
                      <input type="text" className="form-control bg-light border-0" placeholder="مثال: CS101"
                        value={newGroup.groupCode} onChange={e => setNewGroup({...newGroup, groupCode: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">اسم الجروب / الكورس</label>
                      <input type="text" className="form-control bg-light border-0" required
                        value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">اسم الويف (Wave)</label>
                      <input type="text" className="form-control bg-light border-0"
                        value={newGroup.waveName} onChange={e => setNewGroup({...newGroup, waveName: e.target.value})} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">المحاضرين</label>
                      <div className="border rounded bg-light p-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {users.filter(u => u.role && u.role.toLowerCase() === 'instructor').map(u => (
                          <div key={u.id} className="form-check small mb-1">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`inst-${u.id}`}
                              checked={newGroup.instructorIds.includes(u.id)}
                              onChange={(e) => {
                                const ids = e.target.checked 
                                  ? [...newGroup.instructorIds, u.id]
                                  : newGroup.instructorIds.filter(id => id !== u.id);
                                setNewGroup({...newGroup, instructorIds: ids});
                              }}
                            />
                            <label className="form-check-label" htmlFor={`inst-${u.id}`}>
                              {u.fullName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">المينتورز</label>
                      <div className="border rounded bg-light p-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {users.filter(u => u.role && u.role.toLowerCase() === 'mentor').map(u => (
                          <div key={u.id} className="form-check small mb-1">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`ment-${u.id}`}
                              checked={newGroup.instructorIds.includes(u.id)}
                              onChange={(e) => {
                                const ids = e.target.checked 
                                  ? [...newGroup.instructorIds, u.id]
                                  : newGroup.instructorIds.filter(id => id !== u.id);
                                setNewGroup({...newGroup, instructorIds: ids});
                              }}
                            />
                            <label className="form-check-label" htmlFor={`ment-${u.id}`}>
                              {u.fullName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-12 border-top pt-3 mt-3">
                      <h6 className="fw-bold mb-3">تفاصيل المواعيد والساعات</h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">إجمالي عدد الساعات</label>
                      <input type="number" className="form-control bg-light border-0" placeholder="0"
                        value={newGroup.totalHours} onChange={e => setNewGroup({...newGroup, totalHours: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">تاريخ البداية</label>
                      <input type="date" className="form-control bg-light border-0" required
                        value={newGroup.startDate} onChange={e => setNewGroup({...newGroup, startDate: e.target.value})} />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-bold small text-secondary">اليوم الأول</label>
                      <input type="text" className="form-control bg-light border-0" placeholder="الأحد"
                        value={newGroup.day1} onChange={e => setNewGroup({...newGroup, day1: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold small text-secondary">الساعة</label>
                      <input type="text" className="form-control bg-light border-0" placeholder="4م"
                        value={newGroup.day1Time} onChange={e => setNewGroup({...newGroup, day1Time: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold small text-secondary">اليوم الثاني</label>
                      <input type="text" className="form-control bg-light border-0" placeholder="الثلاثاء"
                        value={newGroup.day2} onChange={e => setNewGroup({...newGroup, day2: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold small text-secondary">الساعة</label>
                      <input type="text" className="form-control bg-light border-0" placeholder="4م"
                        value={newGroup.day2Time} onChange={e => setNewGroup({...newGroup, day2Time: e.target.value})} />
                    </div>

                    <div className="col-md-12 border-top pt-3 mt-3">
                      <h6 className="fw-bold mb-3">البيانات المالية والسعة</h6>
                    </div>

                    {(!isCoordinator || isAdmin) && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-secondary">السعر (ج.م)</label>
                        <input type="number" className="form-control bg-light border-0" required
                          value={newGroup.price} onChange={e => setNewGroup({...newGroup, price: e.target.value})} />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">السعة (عدد الطلاب)</label>
                      <input type="number" className="form-control bg-light border-0" required
                        value={newGroup.capacity} onChange={e => setNewGroup({...newGroup, capacity: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 shadow">{isEditing ? 'تعديل الجروب' : 'إنشاء الجروب'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Session Modal */}
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
                  <p className="small text-muted mb-3">تسجيل ساعات العمل لمحاضر في جروب: <strong>{selectedGroup?.name}</strong></p>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">اختر المحاضر</label>
                    <select 
                      className="form-select bg-light border-0" 
                      required
                      value={sessionData.instructorId}
                      onChange={e => setSessionData({...sessionData, instructorId: e.target.value})}
                    >
                      <option value="">-- اختر المحاضر --</option>
                      {users.filter(u => selectedGroup?.instructorIds?.includes(u.id)).map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">عدد الساعات</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className="form-control bg-light border-0" 
                        required
                        placeholder="مثال: 3"
                        value={sessionData.hoursWorked}
                        onChange={e => setSessionData({...sessionData, hoursWorked: e.target.value})}
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

      {/* Student Session Modal */}
      {showStudentSessionModal && selectedGroup && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light border-0">
                <h5 className="modal-title fw-bold">إدارة سيشنات الجروب: {selectedGroup.name}</h5>
                <button type="button" className="btn-close m-0" onClick={() => { setShowStudentSessionModal(false); setIsEditingStudentSession(false); }}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleAddStudentSession} className="row g-3 mb-4 bg-light p-3 rounded">
                  <h6 className="fw-bold mb-0">إضافة سيشن جديدة للطلاب</h6>
                  <div className="col-md-3">
                    <label className="form-label small">عنوان السيشن</label>
                    <input type="text" className="form-control" placeholder="مثال: Session 1" value={newStudentSession.title} onChange={e => setNewStudentSession({...newStudentSession, title: e.target.value})} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">التاريخ</label>
                    <input type="date" className="form-control" value={newStudentSession.sessionDate} onChange={e => setNewStudentSession({...newStudentSession, sessionDate: e.target.value})} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">من الساعة</label>
                    <input type="time" className="form-control" value={newStudentSession.startTime} onChange={e => setNewStudentSession({...newStudentSession, startTime: e.target.value})} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">إلى الساعة</label>
                    <input type="time" className="form-control" value={newStudentSession.endTime} onChange={e => setNewStudentSession({...newStudentSession, endTime: e.target.value})} required />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">المحاضر المسئول (اختياري)</label>
                    <select className="form-select" value={newStudentSession.instructorId || ''} onChange={e => setNewStudentSession({...newStudentSession, instructorId: e.target.value})}>
                      <option value="">بدون محاضر</option>
                      {selectedGroup?.instructorIds?.map((id, index) => {
                         const name = selectedGroup.instructorNames && selectedGroup.instructorNames[index] ? selectedGroup.instructorNames[index] : 'محاضر';
                         return (
                           <option key={id} value={id}>{name}</option>
                         );
                      })}
                    </select>
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label small">رابط الميتينج</label>
                    <input type="url" className="form-control" placeholder="https://meet.google.com/..." value={newStudentSession.meetingLink} onChange={e => setNewStudentSession({...newStudentSession, meetingLink: e.target.value})} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label small">رابط الماتريال</label>
                    <input type="url" className="form-control" placeholder="https://drive.google.com/..." value={newStudentSession.materialLink || ''} onChange={e => setNewStudentSession({...newStudentSession, materialLink: e.target.value})} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label small">رابط الريكورد</label>
                    <input type="url" className="form-control" placeholder="https://drive.google.com/..." value={newStudentSession.recordLink || ''} onChange={e => setNewStudentSession({...newStudentSession, recordLink: e.target.value})} />
                  </div>
                  <div className="col-12 text-end mt-3">
                    {isEditingStudentSession && (
                      <button type="button" className="btn btn-secondary btn-sm px-4 me-2" onClick={() => { setIsEditingStudentSession(false); setEditingStudentSessionId(null); setNewStudentSession({ title: '', sessionDate: new Date().toISOString().split('T')[0], startTime: '19:00', endTime: '21:00', instructorId: '', meetingLink: '', materialLink: '', recordLink: '' }); }}>إلغاء</button>
                    )}
                    <button type="submit" className="btn btn-primary btn-sm px-4">
                      {isEditingStudentSession ? 'تحديث السيشن' : 'إضافة سيشن'}
                    </button>
                  </div>
                </form>

                <ul className="nav nav-tabs mb-4" id="sessionTabs">
                  <li className="nav-item">
                    <button className={`nav-link fw-bold ${activeTab === 'sessions' ? 'active text-primary' : 'text-muted'}`} onClick={() => { setActiveTab('sessions'); setSelectedStudent(null); }}>السيشنات المجدولة ({studentSessions.length})</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link fw-bold ${activeTab === 'attendance' ? 'active text-primary' : 'text-muted'}`} onClick={() => setActiveTab('attendance')}>تقرير الحضور والغياب ({attendanceReport.length})</button>
                  </li>
                </ul>

                {activeTab === 'sessions' && (
                  <>
                    <h6 className="fw-bold mb-3">السيشنات المجدولة ({studentSessions.length})</h6>
                    {studentSessions.length === 0 ? (
                      <div className="text-center text-muted py-3">لا توجد سيشنات مجدولة حالياً.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle text-center">
                          <thead className="table-light">
                            <tr>
                              <th>العنوان</th>
                              <th>المحاضر</th>
                              <th>التاريخ</th>
                              <th>الوقت</th>
                              <th>الرابط</th><th>الماتريال</th><th>الريكورد</th>
                              <th>حضور الطلاب</th>
                              <th>الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentSessions.map(s => (
                              <tr key={s.id}>
                                <td className="fw-bold">{s.title}</td>
                                <td>{s.instructorName || <span className="text-muted small">غير محدد</span>}</td>
                                <td>{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</td>
                                <td dir="ltr">{s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}</td>
                                <td>{(s.meetingLink || s.MeetingLink || s.meetinglink) ? <a href={s.meetingLink || s.MeetingLink || s.meetinglink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary py-0 px-2" title={s.meetingLink || s.MeetingLink || s.meetinglink}><i className="bi bi-link-45deg"></i> الرابط</a> : '-'}</td><td>{(s.materialLink || s.MaterialLink || s.materiallink) ? <a href={s.materialLink || s.MaterialLink || s.materiallink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success py-0 px-2" title={s.materialLink || s.MaterialLink || s.materiallink}><i className="bi bi-cloud-arrow-down"></i> الماتريال</a> : '-'}</td><td>{(s.recordLink || s.RecordLink || s.recordlink) ? <a href={s.recordLink || s.RecordLink || s.recordlink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info py-0 px-2" title={s.recordLink || s.RecordLink || s.recordlink}><i className="bi bi-play-circle"></i> الريكورد</a> : '-'}</td>
                                <td><span className="badge bg-success rounded-pill">{s.attendancesCount}</span></td>
                                <td>
                                  <button className="btn btn-link text-primary p-0 me-3" onClick={() => handleEditStudentSession(s)} title="تعديل">
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button className="btn btn-link text-danger p-0" onClick={() => handleDeleteStudentSession(s.id)} title="حذف">
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'attendance' && (
                  <div>
                    {!selectedStudent ? (
                      <>
                        <h6 className="fw-bold mb-3">تفاصيل الحضور والغياب للطلاب</h6>
                        {attendanceReport.length === 0 ? (
                          <div className="text-center text-muted py-3">لا توجد سجلات حضور للطلاب حالياً.</div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle text-center">
                              <thead className="table-light">
                                <tr>
                                  <th>اسم الطالب</th>
                                  <th>رقم الهاتف</th>
                                  <th>حضور</th>
                                  <th>غياب</th>
                                  <th>إجمالي السيشنات</th>
                                  <th>نسبة الحضور</th>
                                  <th>التفاصيل</th>
                                </tr>
                              </thead>
                              <tbody>
                                {attendanceReport.map(student => (
                                  <tr key={student.studentId}>
                                    <td className="fw-bold">{student.studentName}</td>
                                    <td>{student.phoneNumber}</td>
                                    <td><span className="badge bg-success">{student.attendedCount}</span></td>
                                    <td><span className="badge bg-danger">{student.absentCount}</span></td>
                                    <td>{student.totalSessions}</td>
                                    <td className="fw-bold text-primary">{student.attendancePercentage}%</td>
                                    <td>
                                      <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => setSelectedStudent(student)}>
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
                          <h6 className="fw-bold mb-0">تفاصيل السيشنات للطالب: {selectedStudent.studentName}</h6>
                          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(null)}>عودة لتقرير الحضور</button>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover align-middle text-center">
                            <thead className="table-light">
                              <tr>
                                <th>عنوان السيشن</th>
                                <th>تاريخ السيشن</th>
                                <th>الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStudent.sessions?.map((s, idx) => (
                                <tr key={idx}>
                                  <td className="fw-bold">{s.title}</td>
                                  <td>{new Date(s.sessionDate).toLocaleDateString('ar-EG')}</td>
                                  <td>
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
        </div>
      )}

    </div>
  );
};

export default GroupsPage;
