export const sendWhatsAppMessage = (phone, message) => {
  // Ensure phone starts with country code (e.g., 20 for Egypt)
  let formattedPhone = phone.replace(/\s+/g, '');
  if (!formattedPhone.startsWith('20') && formattedPhone.startsWith('01')) {
    formattedPhone = '20' + formattedPhone;
  }
  
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const messages = {
  welcome: (name) => `مرحباً ${name}، تم تسجيلك بنجاح في مركزنا. نحن سعيدون بانضمامك إلينا! 💊✨`,
  paymentReceipt: (name, amount, course) => `عزيزي ${name}، تم استلام مبلغ ${amount} ج.م مقابل اشتراك كورس ${course}. شكراً لك! ✅`,
  reminder: (name, amount, date) => `عزيزي ${name}، نود تذكيرك بموعد القسط القادم بقيمة ${amount} ج.م في تاريخ ${date}. يرجى السداد في الموعد. 🔔`
};
