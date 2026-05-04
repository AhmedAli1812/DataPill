import React, { useEffect, useState } from 'react';
import { getPaymentsBySubscription, createPayment, getSubscriptions } from '../services/api';
import { toast } from 'react-toastify';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PaymentsPage = () => {
  const { isAdmin, isSales, isAccountant } = useAuth();
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subscriptionIdParam = searchParams.get('subscriptionId');

  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash'
  });

  useEffect(() => {
    fetchSubscriptions();
    if (subscriptionIdParam) {
      setSelectedSubId(subscriptionIdParam);
    }
  }, [subscriptionIdParam]);

  useEffect(() => {
    if (selectedSubId) {
      fetchPayments(selectedSubId);
    } else {
      setPayments([]);
      setLoading(false);
    }
  }, [selectedSubId]);

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الاشتراكات');
    }
  };

  const fetchPayments = async (subId) => {
    setLoading(true);
    try {
      const data = await getPaymentsBySubscription(subId);
      setPayments(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPayment({
        courseSubscriptionId: parseInt(selectedSubId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod
      });
      
      toast.success('تم تسجيل الدفعة بنجاح وإصدار الإيصال');
      setShowModal(false);
      setPaymentResult(result);
      
      setFormData(prev => ({ ...prev, amount: '' }));
      fetchPayments(selectedSubId);
      // Refresh current sub in local state if needed (optional)
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل في تسجيل الدفعة.');
    }
  };

  const handleSharePdf = async () => {
    if (!paymentResult) return;
    try {
      const response = await fetch(paymentResult.receiptUrl);
      const blob = await response.blob();
      const file = new File([blob], `${paymentResult.payment.receiptId}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'إيصال دفع - Data Pill',
          text: `إيصال دفع الطالب: ${paymentResult.studentName}`
        });
      } else {
        // Fallback: Just download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${paymentResult.payment.receiptId}.pdf`;
        link.click();
        toast.info('تم تحميل الملف، يمكنك الآن إرساله يدوياً');
      }
    } catch (error) {
      toast.error('فشل في مشاركة الملف');
    }
  };

  const selectedSub = subscriptions.find(s => s.id === parseInt(selectedSubId));

  if (loading && !selectedSubId) {
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
          <h2 className="fw-bold text-dark mb-1">المدفوعات والأقساط</h2>
          <p className="text-muted mb-0">تسجيل ومتابعة التحصيلات المالية للطلاب</p>
        </div>
        {selectedSubId && selectedSub?.status !== 'Paid بالكامل' && (!isAccountant || isAdmin) && (
          <button className="btn btn-primary shadow-sm px-4" onClick={() => setShowModal(true)}>
            <i className="bi bi-cash-stack me-2"></i> دفع قسط جديد
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <label className="form-label fw-bold small text-secondary">اختر الاشتراك للمتابعة:</label>
              <select 
                className="form-select form-select-lg bg-light border-0" 
                value={selectedSubId} 
                onChange={(e) => setSelectedSubId(e.target.value)}
              >
                <option value="">-- اختر اشتراك الطالب من هنا --</option>
                {subscriptions.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.studentName} - {sub.courseName} (متبقي: {sub.remaining?.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>
            {selectedSubId && (
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <span className={`badge rounded-pill fs-6 px-4 py-2 ${selectedSub?.status === 'Paid بالكامل' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                  {selectedSub?.status === 'Paid بالكامل' ? 'خالص بالكامل' : 'يوجد مديونية'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {paymentResult && (
        <div className="card border-0 shadow-lg bg-success-subtle mb-4 animate-fade-in">
          <div className="card-body p-4 p-md-5 text-center">
            <div className="bg-success rounded-circle d-inline-flex p-3 mb-3 text-white">
              <i className="bi bi-check-lg fs-1"></i>
            </div>
            <h3 className="fw-bold text-success mb-2">تم تسجيل الدفع بنجاح!</h3>
            <p className="fs-5 text-dark">تم استلام مبلغ <strong>{paymentResult.payment.amount} ج.م</strong> من الطالب <strong>{paymentResult.studentName}</strong>.</p>
            <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
              <button onClick={handleSharePdf} className="btn btn-success px-4 shadow">
                <i className="bi bi-share-fill me-2"></i> مشاركة الإيصال (PDF)
              </button>
              <a href={paymentResult.whatsAppLink} target="_blank" rel="noreferrer" className="btn btn-outline-success px-4 shadow">
                <i className="bi bi-whatsapp me-2"></i> إرسال رسالة واتساب
              </a>
              <button onClick={() => setPaymentResult(null)} className="btn btn-outline-secondary px-4">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {selectedSubId && (
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-3 fw-bold text-dark">
                <i className="bi bi-info-circle me-2 text-primary"></i> ملخص مالي للاشتراك
              </div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                  <span className="text-muted">إجمالي السعر</span>
                  <span className="fw-bold">{selectedSub?.totalPrice?.toLocaleString()} ج.م</span>
                </div>
                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                  <span className="text-muted">المدفوع حالياً</span>
                  <span className="fw-bold text-success">{selectedSub?.totalPaid?.toLocaleString()} ج.م</span>
                </div>
                <div className="d-flex justify-content-between mb-4">
                  <span className="text-muted">المبلغ المتبقي</span>
                  <span className="fw-bold text-danger fs-5">{selectedSub?.remaining?.toLocaleString()} ج.م</span>
                </div>
                
                <div className="bg-light rounded-3 p-3">
                  <small className="text-muted d-block mb-1">اسم الطالب:</small>
                  <div className="fw-bold mb-2">{selectedSub?.studentName}</div>
                  <small className="text-muted d-block mb-1">الكورس:</small>
                  <div className="fw-bold">{selectedSub?.courseName}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-3 fw-bold text-dark">
                <i className="bi bi-list-check me-2 text-primary"></i> تاريخ الدفعات
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle text-center mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="py-3 px-4 text-start">رقم الإيصال</th>
                          <th className="py-3">تاريخ الدفع</th>
                          <th className="py-3">المبلغ</th>
                          <th className="py-3 px-4">الطريقة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length > 0 ? (
                          payments.map(payment => (
                            <tr key={payment.id}>
                              <td className="px-4 text-start">
                                <a 
                                  href={`http://localhost:5089/receipts/${payment.receiptId}.pdf`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn btn-sm btn-light border text-primary fw-bold"
                                >
                                  <i className="bi bi-file-earmark-pdf me-1"></i>
                                  {payment.receiptId}
                                </a>
                              </td>
                              <td className="text-muted">{new Date(payment.paymentDate).toLocaleDateString('ar-EG')}</td>
                              <td className="fw-bold text-success">{payment.amount.toLocaleString()} ج.م</td>
                              <td className="px-4">
                                <span className="badge bg-light text-dark border px-3 py-2">{payment.paymentMethod}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-muted py-5">
                              <i className="bi bi-wallet-fill fs-1 d-block mb-2 opacity-25"></i>
                              لا توجد دفعات سابقة مسجلة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg animate-fade-in">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">تسجيل دفعة جديدة</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="bg-warning-subtle p-3 rounded-3 mb-4 text-center">
                    <span className="text-warning-emphasis fw-bold">المبلغ المتبقي للتحصيل: {selectedSub?.remaining?.toLocaleString()} ج.م</span>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">المبلغ المدفوع (ج.م)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-lg bg-light border-0" 
                      name="amount" 
                      value={formData.amount} 
                      onChange={handleChange} 
                      min="1" 
                      max={selectedSub?.remaining}
                      step="0.01"
                      required 
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">طريقة الدفع</label>
                    <select className="form-select form-select-lg bg-light border-0" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                      <option value="Cash">كاش (Cash)</option>
                      <option value="Vodafone Cash">فودافون كاش</option>
                      <option value="InstaPay">إنستاباي (InstaPay)</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">تاريخ الدفع</label>
                    <input type="date" className="form-control form-control-lg bg-light border-0" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-success px-5 shadow">تأكيد الدفع وإصدار إيصال</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
