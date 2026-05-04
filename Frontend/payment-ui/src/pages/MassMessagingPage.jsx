import React, { useState, useEffect } from 'react';
import { getStudents } from '../services/api';
import { toast } from 'react-toastify';

const MassMessagingPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      toast.error('فشل تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  const formatPhone = (phone) => {
    let p = phone.replace("+", "").replace(/\s/g, "");
    if (p.startsWith("0")) p = "2" + p;
    return p;
  };

  const sendNext = () => {
    if (selectedStudents.length === 0) {
      toast.warning('يرجى اختيار طلاب أولاً');
      return;
    }
    if (!message.trim()) {
      toast.warning('يرجى كتابة نص الرسالة');
      return;
    }

    const nextId = selectedStudents[0];
    const student = students.find(s => s.id === nextId);
    
    if (student) {
      const phone = formatPhone(student.phone);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      
      setSelectedStudents(selectedStudents.slice(1));
    }
  };

  const sendAll = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('يرجى اختيار طلاب أولاً');
      return;
    }
    if (!message.trim()) {
      toast.warning('يرجى كتابة نص الرسالة');
      return;
    }

    toast.info('بدء الإرسال الجماعي... يرجى التأكد من السماح بالنوافذ المنبثقة (Popups)');
    
    const studentsToMessage = [...selectedStudents];
    for (let i = 0; i < studentsToMessage.length; i++) {
      const studentId = studentsToMessage[i];
      const student = students.find(s => s.id === studentId);
      if (student) {
        const phone = formatPhone(student.phone);
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        
        // Small delay to help browser handle multiple windows
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    setSelectedStudents([]);
    toast.success('تم فتح كافة المحادثات بنجاح');
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
          <h2 className="fw-bold text-dark mb-1">الرسائل الجماعية</h2>
          <p className="text-muted mb-0">إرسال رسائل واتساب للطلاب المختارين (CRM)</p>
        </div>
        <div className="bg-primary-subtle text-primary px-4 py-2 rounded-pill fw-bold shadow-sm">
          مختار: {selectedStudents.length} طلاب
        </div>
      </div>

      <div className="row g-4">
        {/* Message Editor */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{top: '100px', zIndex: 10}}>
            <div className="card-header bg-white border-bottom py-3 fw-bold">
              <i className="bi bi-chat-dots me-2 text-primary"></i> نص الرسالة
            </div>
            <div className="card-body p-4">
              <textarea 
                className="form-control border-0 bg-light mb-3" 
                rows="8" 
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{resize: 'none'}}
              ></textarea>
              <div className="alert alert-info small border-0 py-2 mb-3">
                <i className="bi bi-info-circle me-1"></i> سيقوم النظام بفتح محادثة واتساب لكل طالب مختار بالترتيب.
              </div>
              <button 
                className="btn btn-primary w-100 py-3 fw-bold shadow mb-2"
                onClick={sendNext}
                disabled={selectedStudents.length === 0}
              >
                <i className="bi bi-whatsapp me-2"></i> إرسال للفرد التالي
              </button>
              <button 
                className="btn btn-success w-100 py-3 fw-bold shadow mb-3"
                onClick={sendAll}
                disabled={selectedStudents.length === 0}
              >
                <i className="bi bi-rocket-takeoff me-2"></i> إرسال للكل (تلقائي)
              </button>
              <div className="alert alert-warning small border-0 py-2 mb-3">
                <i className="bi bi-exclamation-triangle me-1"></i> <strong>هام:</strong> عند اختيار "إرسال للكل"، يرجى التأكد من أن متصفحك يسمح بفتح "النوافذ المنبثقة" (Popups).
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">اختيار الطلاب</h5>
              <div className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm border-0 bg-light shadow-none" 
                  placeholder="بحث..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{width: '150px'}}
                />
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{maxHeight: '600px'}}>
                <table className="table table-hover align-middle mb-0 text-center">
                  <thead className="bg-light sticky-top" style={{top: 0, zIndex: 11}}>
                    <tr>
                      <th className="py-3 px-4 text-start">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} 
                            onChange={handleSelectAll}
                          />
                          <label className="form-check-label small ms-1">الكل</label>
                        </div>
                      </th>
                      <th className="py-3 text-start">الاسم</th>
                      <th className="py-3">رقم الهاتف</th>
                      <th className="py-3">الاشتراكات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id} className={selectedStudents.includes(s.id) ? 'table-primary-subtle' : ''}>
                        <td className="px-4 text-start">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={selectedStudents.includes(s.id)} 
                              onChange={() => handleSelectOne(s.id)}
                            />
                          </div>
                        </td>
                        <td className="text-start">
                          <div className="fw-bold text-dark">{s.name}</div>
                        </td>
                        <td dir="ltr" className="text-muted small">{s.phone}</td>
                        <td>
                          <span className="badge bg-light text-dark border rounded-pill">{s.subscriptionCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassMessagingPage;
