import React, { useState, useEffect } from 'react';
import { getAdminStats, getSalesPerformance, getUserAuditLogs, createSalesUser, deleteSalesUser, getFinancialTrends } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboardPage = () => {
  const { isAdmin, isAccountant } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [trends, setTrends] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'Sales' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load basic stats
      try {
        const statsData = await getAdminStats();
        setStats(statsData);
      } catch (e) { console.error("Stats fail", e); }

      // Load financial trends
      try {
        const trendsData = await getFinancialTrends();
        setTrends(trendsData);
      } catch (e) { console.error("Trends fail", e); }

      // Load performance (Admin and Accountant)
      if (isAdmin || isAccountant) {
        try {
          const perfData = await getSalesPerformance();
          setPerformance(perfData);
        } catch (e) { console.error("Perf fail", e); }
      }
    } catch (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء تحميل بعض البيانات' : 'Error loading some data');
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
      await createSalesUser(newUser);
      toast.success('تمت إضافة المستخدم بنجاح');
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'Sales' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشلت إضافة المستخدم');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteSalesUser(userId);
        toast.success('تم حذف المستخدم');
        loadData();
      } catch (error) {
        toast.error('فشل حذف المستخدم');
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
        <div className="spinner-grow text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold text-dark mb-1">{(isAdmin || isAccountant) ? 'لوحة تحكم الإدارة' : 'التقارير المالية'}</h2>
          <p className="text-muted mb-0">{(isAdmin || isAccountant) ? 'مراقبة الأداء، الإحصائيات الشاملة، والنشاط' : 'إحصائيات شاملة للأداء المالي والاشتراكات'}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-person-plus-fill me-2"></i> إضافة موظف جديد
          </button>
        )}
      </div>

      {/* Admin Stats Grid */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm overflow-hidden stats-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary-subtle p-3 rounded-3 text-primary">
                  <i className="bi bi-people fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-bold small text-uppercase mb-1">{t.total_students}</h6>
              <h3 className="fw-bold text-dark mb-0">{stats?.totalStudents}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm overflow-hidden stats-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success-subtle p-3 rounded-3 text-success">
                  <i className="bi bi-cash-stack fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-bold small text-uppercase mb-1">{t.total_revenue}</h6>
              <h3 className="fw-bold text-dark mb-0">{stats?.totalRevenue?.toLocaleString()} <small className="fs-6">{t.currency}</small></h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm overflow-hidden stats-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning-subtle p-3 rounded-3 text-warning">
                  <i className="bi bi-hourglass-split fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-bold small text-uppercase mb-1">{t.total_pending}</h6>
              <h3 className="fw-bold text-dark mb-0">{stats?.totalPending?.toLocaleString()} <small className="fs-6">{t.currency}</small></h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm overflow-hidden stats-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info-subtle p-3 rounded-3 text-info">
                  <i className="bi bi-person-badge fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-bold small text-uppercase mb-1">{t.employees}</h6>
              <h3 className="fw-bold text-dark mb-0">{stats?.salesUsersCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Trends Chart */}
      <div className="card border-0 shadow-sm mb-5 overflow-hidden">
        <div className="card-header bg-white border-bottom py-4 px-4">
          <h5 className="mb-0 fw-bold text-dark">{t.financial_trends}</h5>
        </div>
        <div className="card-body p-4">
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey={lang === 'ar' ? "month" : "monthEn"} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-light)', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-light)', fontSize: 12}}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name={t.income}
                  stroke="var(--success)" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name={t.expenses}
                  stroke="var(--danger)" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Table - Admin & Accountant */}
      {(isAdmin || isAccountant) && (
        <div className="card border-0 shadow-sm mb-5 overflow-hidden">
          <div className="card-header bg-white border-bottom py-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">أداء الموظفين ونشاطهم</h5>
            <span className="badge bg-light text-dark border px-3">متابعة دقيقة لكل عملية</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle text-center mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 px-4 text-start">الموظف</th>
                    <th className="py-3">الاشتراكات</th>
                    <th className="py-3">المحصل</th>
                    <th className="py-3 text-danger">المتبقي</th>
                    <th className="py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.length === 0 ? (
                    <tr><td colSpan="5" className="text-muted py-5 text-center">لا يوجد بيانات أداء مسجلة</td></tr>
                  ) : (
                    performance.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 text-start">
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: '40px', height: '40px'}}>
                              {p.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{p.fullName}</div>
                              <small className="text-muted">{p.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="bg-primary-subtle text-primary px-3 py-1 rounded-pill fw-bold">
                            {p.totalSubscriptions}
                          </span>
                        </td>
                        <td className="text-success fw-bold">{p.totalRevenue?.toLocaleString()} ج.م</td>
                        <td className="text-danger fw-bold">{p.totalPending?.toLocaleString()} ج.م</td>
                        <td className="px-4">
                          <div className="d-flex gap-2 justify-content-center">
                            <button className="btn btn-sm btn-outline-info rounded-pill px-3" onClick={() => handleShowAudit(p)}>
                              <i className="bi bi-clock-history me-1"></i> النشاط
                            </button>
                            {isAdmin && (
                              <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleDeleteUser(p.id)}>
                                <i className="bi bi-trash"></i>
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
                  <div className="mb-4">
                    <label className="form-label">صلاحية الوصول للنظام</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-shield-lock text-warning"></i></span>
                      <select className="form-select" required
                        value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                        <option value="Sales">موظف مبيعات (Sales)</option>
                        <option value="Accountant">محاسب (Accountant)</option>
                        <option value="Admin">مدير النظام (Admin)</option>
                      </select>
                    </div>
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
                              <span className={`badge rounded-pill px-3 py-2 ${
                                log.action === 'إضافة طالب' ? 'bg-info-subtle text-info' : 
                                log.action === 'إضافة اشتراك' ? 'bg-primary-subtle text-primary' : 
                                'bg-success-subtle text-success'
                              }`}>
                                {log.action}
                              </span>
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

export default AdminDashboardPage;
