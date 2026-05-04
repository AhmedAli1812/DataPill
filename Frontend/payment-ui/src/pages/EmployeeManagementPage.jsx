import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSalesUsers, createSalesUser, updateSalesUser, deleteSalesUser, getUserAuditLogs, recordInstructorSession, getGroups } from '../services/api';
import { toast } from 'react-toastify';

const EmployeeManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState({ id: '', fullName: '', email: '', password: '', role: 'Sales', hourlyRate: 0 });
  const [recordData, setRecordData] = useState({ instructorId: '', courseGroupId: '', sessionDate: new Date().toISOString().split('T')[0], hoursWorked: '' });
  const [auditLogs, setAuditLogs] = useState([]);
  const [filters, setFilters] = useState({ name: '', role: '' });
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'Sales', hourlyRate: 0 });

  const loadData = async () => {
    try {
      const [usersData, groupsData] = await Promise.all([
        getSalesUsers(),
        getGroups()
      ]);
      setUsers(usersData);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createSalesUser({
        ...newUser,
        hourlyRate: parseFloat(newUser.hourlyRate) || 0
      });
      toast.success('تمت إضافة الموظف بنجاح');
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'Sales', hourlyRate: 0 });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشلت إضافة الموظف');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateSalesUser(editUser.id, {
        ...editUser,
        hourlyRate: parseFloat(editUser.hourlyRate) || 0
      });
      toast.success('تم تحديث بيانات الموظف');
      setShowEditModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    }
  };

  const handleRecordSession = async (e) => {
    e.preventDefault();
    try {
      await recordInstructorSession({
        ...recordData,
        hoursWorked: parseFloat(recordData.hoursWorked)
      });
      toast.success('تم تسجيل الساعات بنجاح');
      setShowRecordModal(false);
      setRecordData({ ...recordData, hoursWorked: '' });
    } catch (error) {
      toast.error('فشل تسجيل الساعات');
    }
  };

  const openEditModal = (user) => {
    setEditUser({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      hourlyRate: user.hourlyRate || 0
    });
    setShowEditModal(true);
  };

  const openRecordModal = (user) => {
    setRecordData({
      instructorId: user.id,
      courseGroupId: '',
      sessionDate: new Date().toISOString().split('T')[0],
      hoursWorked: ''
    });
    setSelectedUser(user);
    setShowRecordModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await deleteSalesUser(userId);
        toast.success('تم حذف الموظف بنجاح');
        loadUsers();
      } catch (error) {
        toast.error('فشل حذف الموظف');
      }
    }
  };

  const handleShowAudit = async (user) => {
    setSelectedUser(user);
    try {
      const logs = await getUserAuditLogs(user.id);
      setAuditLogs(logs);
      setShowAuditModal(true);
    } catch (error) {
      toast.error('فشل تحميل سجل النشاط');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchName = user.fullName.toLowerCase().includes(filters.name.toLowerCase());
    const matchRole = !filters.role || user.role === filters.role;
    return matchName && matchRole;
  });

  const getRoleLabel = (role) => {
    switch(role) {
      case 'Admin': return 'مدير النظام';
      case 'Accountant': return 'محاسب';
      case 'Sales': return 'مبيعات';
      case 'Instructor': return 'محاضر (Instructor)';
      case 'Mentor': return 'مساعد (Mentor)';
      case 'Coordinator': return 'كوردنيتور (Coordinator)';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'Admin': return 'bg-dark';
      case 'Accountant': return 'bg-info-subtle text-info';
      case 'Sales': return 'bg-primary-subtle text-primary';
      case 'Instructor': return 'bg-success-subtle text-success';
      case 'Mentor': return 'bg-warning-subtle text-warning-emphasis';
      case 'Coordinator': return 'bg-danger-subtle text-danger';
      default: return 'bg-light text-dark';
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
          <h2 className="fw-bold text-dark mb-1">إدارة الموظفين</h2>
          <p className="text-muted mb-0">التحكم في حسابات الموظفين وصلاحياتهم ومتابعة نشاطهم</p>
        </div>
        <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-person-plus-fill me-2"></i> إضافة موظف جديد
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-secondary">بحث بالاسم</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light"
                  placeholder="ابحث عن موظف..."
                  value={filters.name}
                  onChange={e => setFilters({...filters, name: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">تصنيف حسب الدور</label>
              <select 
                className="form-select border-0 bg-light"
                value={filters.role}
                onChange={e => setFilters({...filters, role: e.target.value})}
              >
                <option value="">كل الأدوار</option>
                <option value="Sales">مبيعات (Sales)</option>
                <option value="Accountant">محاسب (Accountant)</option>
                <option value="Instructor">محاضر (Instructor)</option>
                <option value="Mentor">مساعد (Mentor)</option>
                <option value="Coordinator">كوردنيتور (Coordinator)</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button 
                className="btn btn-link text-secondary text-decoration-none small"
                onClick={() => setFilters({ name: '', role: '' })}
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
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-4 text-start">الاسم الكامل</th>
                  <th className="py-3">البريد الإلكتروني</th>
                  <th className="py-3">الصلاحية</th>
                  <th className="py-3">سعر الساعة</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-muted py-5">لا يوجد موظفين يطابقون البحث</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 text-start">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: '35px', height: '35px'}}>
                            {user.fullName.charAt(0)}
                          </div>
                          <span className="fw-bold text-dark">{user.fullName}</span>
                        </div>
                      </td>
                      <td dir="ltr" className="text-muted">{user.email}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-2 ${getRoleBadgeClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="fw-bold text-success">
                        {user.hourlyRate > 0 ? `${user.hourlyRate} ج.م` : '-'}
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2 justify-content-center">
                          {user.role === 'Instructor' && (
                            <>
                              <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => openRecordModal(user)} title="تسجيل ساعات">
                                <i className="bi bi-clock"></i>
                              </button>
                              <Link to={`/instructor?id=${user.id}`} className="btn btn-sm btn-info rounded-pill px-3" title="عرض الداشبورد">
                                <i className="bi bi-speedometer2"></i>
                              </Link>
                            </>
                          )}
                          <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => openEditModal(user)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-info rounded-pill px-3" onClick={() => handleShowAudit(user)}>
                            <i className="bi bi-clock-history"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDeleteUser(user.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
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

      {/* Record Hours Modal */}
      {showRecordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تسجيل ساعات للمحاضر: {selectedUser?.fullName}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowRecordModal(false)}></button>
              </div>
              <form onSubmit={handleRecordSession}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">الجروب</label>
                    <select className="form-select bg-light border-0" required
                      value={recordData.courseGroupId} onChange={e => setRecordData({...recordData, courseGroupId: e.target.value})}>
                      <option value="">اختر الجروب...</option>
                      {groups.filter(g => g.instructorIds?.includes(selectedUser?.id)).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                      {groups.filter(g => !g.instructorIds?.includes(selectedUser?.id)).length > 0 && (
                        <optgroup label="جروبات أخرى">
                          {groups.filter(g => !g.instructorIds?.includes(selectedUser?.id)).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">التاريخ</label>
                    <input type="date" className="form-control bg-light border-0" required
                      value={recordData.sessionDate} onChange={e => setRecordData({...recordData, sessionDate: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">عدد الساعات</label>
                    <input type="number" step="0.5" className="form-control bg-light border-0" required placeholder="مثال: 2"
                      value={recordData.hoursWorked} onChange={e => setRecordData({...recordData, hoursWorked: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted" onClick={() => setShowRecordModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 shadow">تسجيل الساعات</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">إضافة موظف جديد</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label">الاسم الكامل للموظف</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-person-badge text-primary"></i></span>
                      <input type="text" className="form-control" required 
                        value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} placeholder="أدخل الاسم الثلاثي" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">البريد الإلكتروني (لتسجيل الدخول)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-envelope-at text-secondary"></i></span>
                      <input type="email" className="form-control" required dir="ltr"
                        value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@company.com" />
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-md-7">
                      <label className="form-label">صلاحية الوصول للنظام</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0"><i className="bi bi-shield-lock text-warning"></i></span>
                        <select className="form-select" required
                          value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                          <option value="Sales">موظف مبيعات (Sales)</option>
                          <option value="Accountant">محاسب (Accountant)</option>
                          <option value="Instructor">محاضر (Instructor)</option>
                          <option value="Mentor">مساعد (Mentor)</option>
                          <option value="Coordinator">كوردنيتور (Coordinator)</option>
                          <option value="Admin">مدير النظام (Admin)</option>
                        </select>
                      </div>
                    </div>
                    {(newUser.role === 'Instructor' || newUser.role === 'Mentor') && (
                      <div className="col-md-5 animate-fade-in">
                        <label className="form-label">سعر الساعة (ج.م)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0"><i className="bi bi-currency-dollar text-success"></i></span>
                          <input type="number" className="form-control"
                            value={newUser.hourlyRate} onChange={e => setNewUser({...newUser, hourlyRate: e.target.value})} placeholder="0" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label">كلمة المرور</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-key text-danger"></i></span>
                      <input type="password" placeholder="6 خانات على الأقل" className="form-control" required dir="ltr"
                        value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-link text-muted text-decoration-none fw-bold" onClick={() => setShowAddModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary px-5 rounded-pill shadow fw-bold">تأكيد الإضافة</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تعديل بيانات الموظف</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label">الاسم الكامل</label>
                    <input type="text" className="form-control bg-light border-0" required 
                      value={editUser.fullName} onChange={e => setEditUser({...editUser, fullName: e.target.value})} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">البريد الإلكتروني</label>
                    <input type="email" className="form-control bg-light border-0" required dir="ltr"
                      value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} />
                  </div>
                  <div className="row mb-4">
                    <div className="col-md-7">
                      <label className="form-label">الصلاحية</label>
                      <select className="form-select bg-light border-0" required
                        value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}>
                        <option value="Sales">موظف مبيعات (Sales)</option>
                        <option value="Accountant">محاسب (Accountant)</option>
                        <option value="Instructor">محاضر (Instructor)</option>
                        <option value="Mentor">مساعد (Mentor)</option>
                        <option value="Coordinator">كوردنيتور (Coordinator)</option>
                        <option value="Admin">مدير النظام (Admin)</option>
                      </select>
                    </div>
                    {(editUser.role === 'Instructor' || editUser.role === 'Mentor') && (
                      <div className="col-md-5 animate-fade-in">
                        <label className="form-label">سعر الساعة (ج.م)</label>
                        <input type="number" className="form-control bg-light border-0"
                          value={editUser.hourlyRate} onChange={e => setEditUser({...editUser, hourlyRate: e.target.value})} />
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label">كلمة المرور الجديدة (اختياري)</label>
                    <input type="password" placeholder="اتركها فارغة لعدم التغيير" className="form-control bg-light border-0" dir="ltr"
                      value={editUser.password} onChange={e => setEditUser({...editUser, password: e.target.value})} />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-link text-muted text-decoration-none fw-bold" onClick={() => setShowEditModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-success px-5 rounded-pill shadow fw-bold">حفظ التغييرات</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-clock-history me-2 text-primary"></i> سجل نشاط: {selectedUser?.fullName}
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowAuditModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 text-center">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 px-4 text-start">التوقيت</th>
                        <th className="py-3">النوع</th>
                        <th className="py-3 text-start">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr><td colSpan="3" className="text-muted py-5 text-center">لا يوجد نشاط مسجل</td></tr>
                      ) : (
                        auditLogs.map(log => (
                          <tr key={log.id}>
                            <td className="px-4 text-start">
                              <div className="fw-bold">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</div>
                              <small className="text-muted">{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</small>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border px-3 py-2">{log.action}</span>
                            </td>
                            <td className="text-start text-muted small">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button type="button" className="btn btn-secondary px-5" onClick={() => setShowAuditModal(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementPage;
