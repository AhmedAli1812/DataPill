import React, { useState, useEffect } from 'react';
import { getPendingPayments } from '../services/api';
import { toast } from 'react-toastify';

const RemindersPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      const data = await getPendingPayments();
      setPending(data);
    } catch (error) {
      toast.error('فشل تحميل قائمة المتأخرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const sendWhatsAppReminder = (item) => {
    const message = `مرحباً ${item.studentName}،\n\nنود تذكيركم بأن لديكم مبلغ متبقي من اشتراك كورس (${item.courseName}) بقيمة ${item.remaining.toLocaleString()} ج.م.\n\nيرجى التوجه للمركز للسداد في أقرب وقت.\nشكراً لكم.`;
    
    let phone = item.studentPhone.replace("+", "").replace(/\s/g, "");
    if (phone.startsWith("0")) phone = "2" + phone;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
          <h2 className="fw-bold text-dark mb-1">متابعة المتأخرات</h2>
          <p className="text-muted mb-0">قائمة الطلاب الذين لديهم مبالغ متبقية لم يتم سدادها</p>
        </div>
        <div className="bg-warning-subtle text-warning-emphasis px-4 py-2 rounded-pill fw-bold shadow-sm">
          إجمالي الحالات: {pending.length}
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="py-3 px-4 text-start">الطالب</th>
                  <th className="py-3">الكورس</th>
                  <th className="py-3">إجمالي السعر</th>
                  <th className="py-3">المدفوع</th>
                  <th className="py-3">المتبقي</th>
                  <th className="py-3 px-4">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-muted py-5 text-center">
                      <i className="bi bi-check-circle-fill fs-1 d-block mb-2 text-success opacity-25"></i>
                      لا يوجد طلاب لديهم مبالغ متأخرة حالياً. عمل رائع!
                    </td>
                  </tr>
                ) : (
                  pending.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 text-start">
                        <div className="fw-bold text-dark">{item.studentName}</div>
                        <small className="text-muted" dir="ltr">{item.studentPhone}</small>
                      </td>
                      <td>
                        <span className="bg-light px-3 py-1 rounded-pill text-dark fw-medium border">{item.courseName}</span>
                      </td>
                      <td className="text-muted">{item.totalPrice.toLocaleString()} ج.م</td>
                      <td className="text-success">{item.totalPaid.toLocaleString()} ج.م</td>
                      <td className="text-danger fw-bold fs-5">{item.remaining.toLocaleString()} ج.م</td>
                      <td className="px-4">
                        <button className="btn btn-success rounded-pill px-4 shadow-sm" onClick={() => sendWhatsAppReminder(item)}>
                          <i className="bi bi-whatsapp me-2"></i> إرسال تذكير
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 rounded-3 bg-primary-subtle text-primary-emphasis shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-info-circle-fill fs-3"></i>
          <div>
            <h6 className="fw-bold mb-1">نصيحة للمتابعة:</h6>
            <p className="mb-0 small">عند الضغط على زر "إرسال تذكير"، سيفتح النظام واتساب برسالة معدة مسبقاً تحتوي على كافة تفاصيل المديونية للطالب.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
