import React, { useEffect, useState } from 'react';
import { getDashboardStats, getFinancialTrends } from '../services/api';
import { toast } from 'react-toastify';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DashboardPage = () => {
  const { isAccountant, isAdmin, isInstructor, isSales, isMentor } = useAuth();

  // Redirect pure instructors to their own dashboard
  if (isInstructor && !isAdmin && !isSales && !isAccountant && !isMentor && !isCoordinator) {
    return <Navigate to="/instructor" replace />;
  }

  // Redirect pure mentors to their own dashboard
  if (isMentor && !isAdmin && !isSales && !isAccountant && !isInstructor && !isCoordinator) {
    return <Navigate to="/mentor" replace />;
  }
  const { lang } = useLanguage();
  const t = translations[lang];
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await getDashboardStats();
      setStats(statsData);
      
      if (isAdmin || isAccountant) {
        const trendsData = await getFinancialTrends();
        setTrends(trendsData);
      }
    } catch (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
        <div className="spinner-grow text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold text-dark mb-1">لوحة القيادة</h2>
          <p className="text-muted mb-0">نظرة عامة على نشاط المركز والتحصيلات المالية</p>
        </div>
        <button onClick={fetchStats} className="btn btn-light shadow-sm">
          <i className="bi bi-arrow-clockwise me-1"></i> تحديث البيانات
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card h-100 border-0 overflow-hidden shadow-sm stats-card">
            <div className="card-body p-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary-subtle p-3 rounded-3 text-primary">
                  <i className="bi bi-cash-stack fs-3"></i>
                </div>
                <span className="badge bg-success-subtle text-success">+12%</span>
              </div>
              <h6 className="text-muted fw-semibold mb-1">إجمالي الإيرادات</h6>
              <h3 className="fw-bold mb-0 text-dark">{stats?.totalRevenue?.toLocaleString()} <small className="fs-6">ج.م</small></h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 overflow-hidden shadow-sm stats-card">
            <div className="card-body p-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success-subtle p-3 rounded-3 text-success">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
                <span className="badge bg-info-subtle text-info">جديد</span>
              </div>
              <h6 className="text-muted fw-semibold mb-1">إجمالي الطلاب</h6>
              <h3 className="fw-bold mb-0 text-dark">{stats?.totalStudents} <small className="fs-6">طالب</small></h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 overflow-hidden shadow-sm stats-card">
            <div className="card-body p-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info-subtle p-3 rounded-3 text-info">
                  <i className="bi bi-journal-bookmark-fill fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-semibold mb-1">الاشتراكات النشطة</h6>
              <h3 className="fw-bold mb-0 text-dark">{stats?.totalSubscriptions} <small className="fs-6">كورس</small></h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-0 overflow-hidden shadow-sm">
            <div className="card-body p-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning-subtle p-3 rounded-3 text-warning">
                  <i className="bi bi-hourglass-split fs-3"></i>
                </div>
              </div>
              <h6 className="text-muted fw-semibold mb-1">مدفوعات معلقة</h6>
              <h3 className="fw-bold mb-0 text-dark">{stats?.pendingPayments} <small className="fs-6">دفعة</small></h3>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Trends Chart - Admin & Accountant Only */}
      {(isAdmin || isAccountant) && (
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
      )}

      {/* Recent Subscriptions Table */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-bottom py-4 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold text-dark">أحدث الاشتراكات</h5>
            <small className="text-muted">آخر 10 عمليات تسجيل تمت في النظام</small>
          </div>
          <Link to="/subscriptions" className="btn btn-primary btn-sm px-3">
            عرض كل الاشتراكات <i className="bi bi-arrow-left ms-1"></i>
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-center">
                  <th className="py-3 px-4 text-start">الطالب</th>
                  <th className="py-3">الكورس</th>
                  <th className="py-3">السعر الإجمالي</th>
                  <th className="py-3">المدفوع</th>
                  <th className="py-3">المتبقي</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSubscriptions?.length > 0 ? (
                  stats.recentSubscriptions.map(sub => (
                    <tr key={sub.id} className="text-center">
                      <td className="py-3 px-4 text-start">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-person text-primary small"></i>
                          </div>
                          <span className="fw-semibold text-dark">{sub.studentName}</span>
                        </div>
                      </td>
                      <td><span className="text-muted">{sub.courseName}</span></td>
                      <td className="fw-semibold">{sub.totalPrice?.toLocaleString()} ج.م</td>
                      <td className="text-success fw-semibold">{sub.totalPaid?.toLocaleString()} ج.م</td>
                      <td className="text-danger fw-bold">{sub.remaining?.toLocaleString()} ج.م</td>
                      <td className="py-3 px-4">
                        <span className={`badge rounded-pill ${
                          sub.status === 'Paid بالكامل' 
                          ? 'bg-success-subtle text-success' 
                          : 'bg-warning-subtle text-warning'
                        } px-3 py-2`}>
                          {sub.status === 'Paid بالكامل' ? 'مكتمل السداد' : 'دفع جزئي'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted py-5 text-center">
                      <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                      لا توجد اشتراكات مسجلة حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
