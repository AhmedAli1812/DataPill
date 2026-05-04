import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="fw-bold text-dark mb-1">سجل العمليات (Audit Logs)</h2>
        <p className="text-muted mb-0">تتبع كافة العمليات الحساسة التي تمت على النظام ومن قام بها</p>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-center">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-4 text-start">الوقت</th>
                  <th className="py-3">الموظف</th>
                  <th className="py-3">العملية</th>
                  <th className="py-3">النوع</th>
                  <th className="py-3 text-start">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="py-5">جاري التحميل...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="py-5 text-muted">لا توجد سجلات حالياً</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td className="px-4 text-start small text-muted">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border p-2">
                        <i className="bi bi-person me-1"></i> {log.user?.email || 'System'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${log.action.includes('حذف') ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} p-2 px-3`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="small text-muted">{log.entityName}</td>
                    <td className="text-start small fw-bold text-dark px-3" style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
