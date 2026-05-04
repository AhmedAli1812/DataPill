import React, { useState, useEffect } from 'react';
import { getReportsData, downloadReport, getFinancialTrends, getAdminStats, getSalesPerformance } from '../services/api';
import { toast } from 'react-toastify';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

const ReportsPage = () => {
  const { lang } = useLanguage();
  const { isAccountant, isAdmin } = useAuth();
  const t = translations[lang];
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    year: ''
  });

  const months = [
    { id: 1, name: 'يناير' }, { id: 2, name: 'فبراير' }, { id: 3, name: 'مارس' },
    { id: 4, name: 'أبريل' }, { id: 5, name: 'مايو' }, { id: 6, name: 'يونيو' },
    { id: 7, name: 'يوليو' }, { id: 8, name: 'أغسطس' }, { id: 9, name: 'سبتمبر' },
    { id: 10, name: 'أكتوبر' }, { id: 11, name: 'نوفمبر' }, { id: 12, name: 'ديسمبر' }
  ];

  const loadReport = async () => {
    try {
      setLoading(true);
      const [data, trendsData, statsData] = await Promise.all([
        getReportsData(filters.month || null, filters.year || null),
        getFinancialTrends(),
        getAdminStats()
      ]);
      setReport(data);
      setTrends(trendsData);
      setStats(statsData);

      if (isAdmin || isAccountant) {
        const perfData = await getSalesPerformance();
        setPerformance(perfData);
      }
    } catch (error) {
      toast.error('فشل تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filters]);

  const handleDownload = async () => {
    if (!filters.month || !filters.year) {
      toast.warning('يرجى اختيار شهر وسنة محددين لتحميل ملف Excel');
      return;
    }
    try {
      toast.info('جاري تحضير التقرير...');
      const blob = await downloadReport('excel', filters.month, filters.year);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${filters.month}_${filters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = () => {
          const errorData = JSON.parse(reader.result);
          toast.error(`فشل تحميل التقرير: ${errorData.Message || 'خطأ غير معروف'}`);
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error('فشل تحميل التقرير، تأكد من وجود بيانات لهذا الشهر');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">التقارير المالية والتحليل</h2>
          <p className="text-muted mb-0">متابعة الدخل، المصاريف، وأداء المبيعات (الكل أو مفلتر)</p>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select border-0 shadow-sm" style={{ width: '120px' }} value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
            <option value="">كل الشهور</option>
            {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="form-select border-0 shadow-sm" style={{ width: '100px' }} value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="">كل السنين</option>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-success px-4 shadow-sm" onClick={handleDownload} disabled={!filters.month || !filters.year}>
            <i className="bi bi-file-earmark-excel me-1"></i> تحميل Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '40vh' }}>
          <div className="spinner-grow text-primary" role="status"></div>
        </div>
      ) : report ? (
        <>
          {/* Main Stats */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm overflow-hidden h-100">
                <div className="card-body p-4 text-center">
                  <div className="bg-success-subtle text-success rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-graph-up-arrow fs-2"></i>
                  </div>
                  <h6 className="text-muted fw-bold text-uppercase small mb-2">إجمالي الإيرادات</h6>
                  <h2 className="fw-bold text-dark">{report.totalIncome.toLocaleString()} <small className="fs-6">ج.م</small></h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm overflow-hidden h-100">
                <div className="card-body p-4 text-center">
                  <div className="bg-danger-subtle text-danger rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-graph-down-arrow fs-2"></i>
                  </div>
                  <h6 className="text-muted fw-bold text-uppercase small mb-2">المصاريف النثرية</h6>
                  <h2 className="fw-bold text-dark">{(report.totalExpenses - report.totalSalaries).toLocaleString()} <small className="fs-6">ج.م</small></h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm overflow-hidden h-100">
                <div className="card-body p-4 text-center">
                  <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-cash-stack fs-2"></i>
                  </div>
                  <h6 className="text-muted fw-bold text-uppercase small mb-2">إجمالي الرواتب</h6>
                  <h2 className="fw-bold text-dark">{report.totalSalaries?.toLocaleString()} <small className="fs-6">ج.م</small></h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg h-100" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                <div className="card-body p-4 text-center text-white">
                  <div className="bg-white bg-opacity-25 rounded-circle d-inline-flex p-3 mb-3 text-white">
                    <i className="bi bi-piggy-bank fs-2"></i>
                  </div>
                  <h6 className="fw-bold text-uppercase small mb-2 opacity-75">صافي الربح</h6>
                  <h2 className="fw-bold">{report.netProfit.toLocaleString()} <small className="fs-6 text-white text-opacity-75">ج.م</small></h2>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4 text-center">
                  <div className="text-muted small fw-bold mb-1">إجمالي الطلاب</div>
                  <h3 className="fw-bold">{stats?.totalStudents}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4 text-center">
                  <div className="text-muted small fw-bold mb-1">إجمالي المديونيات</div>
                  <h3 className="fw-bold text-danger">{stats?.totalPending?.toLocaleString()} <small className="fs-6">ج.م</small></h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4 text-center">
                  <div className="text-muted small fw-bold mb-1">عدد الاشتراكات</div>
                  <h3 className="fw-bold text-primary">{stats?.totalSubscriptions}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4 text-center">
                  <div className="text-muted small fw-bold mb-1">عدد الموظفين</div>
                  <h3 className="fw-bold text-info">{stats?.salesUsersCount}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Trends Chart */}
          <div className="card border-0 shadow-sm mb-5 overflow-hidden animate-fade-in">
            <div className="card-header bg-white border-bottom py-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">اتجاهات الدخل والمصاريف (آخر 6 أشهر)</h5>
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
                      name="الإيرادات"
                      stroke="var(--success)" 
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      strokeWidth={3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="المصاريف"
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

          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom py-4 px-4">
                  <h5 className="mb-0 fw-bold text-dark">أداء موظفي المبيعات</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle text-center mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="py-3 px-4 text-start">الموظف</th>
                          <th className="py-3">الاشتراكات</th>
                          <th className="py-3 text-success">المحصل</th>
                          <th className="py-3 text-danger">المتبقي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performance.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 text-start fw-bold">{p.fullName}</td>
                            <td>{p.totalSubscriptions}</td>
                            <td className="text-success fw-bold">{p.totalRevenue?.toLocaleString()} ج.م</td>
                            <td className="text-danger fw-bold">{p.totalPending?.toLocaleString()} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom py-4 px-4">
                  <h5 className="mb-0 fw-bold text-dark">تحليل المصاريف</h5>
                </div>
                <div className="card-body p-4">
                  {report.expenseBreakdown.length === 0 ? (
                    <div className="text-center py-5 text-muted">لا توجد مصاريف</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {report.expenseBreakdown.map((item, idx) => (
                        <div key={idx} className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                          <span className="small fw-bold">{item.category}</span>
                          <span className="fw-bold text-danger">{item.amount.toLocaleString()} ج.م</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ReportsPage;
