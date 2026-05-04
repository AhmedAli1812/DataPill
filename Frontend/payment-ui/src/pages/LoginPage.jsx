import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = translations[lang];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5089/api/auth/login', {
        email,
        password
      });
      const responseData = response.data;
      
      login(responseData);
      toast.success(lang === 'ar' ? 'مرحباً بك مجدداً!' : 'Welcome back!');
      
      if (responseData.roles.includes('Admin') || responseData.roles.includes('Accountant')) {
        navigate('/admin');
      } else if (responseData.roles.includes('Instructor')) {
        navigate('/instructor');
      } else if (responseData.roles.includes('Mentor')) {
        navigate('/mentor');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden" 
      style={{ 
        backgroundImage: `url('/login-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      
      {/* Toggles */}
      <div className="position-absolute top-0 end-0 p-4 d-flex gap-2" style={{ zIndex: 100 }}>
        <button className="btn btn-white shadow-sm rounded-circle p-2" onClick={toggleTheme}>
          <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}-fill`}></i>
        </button>
        <button className="btn btn-white shadow-sm rounded-pill px-3 fw-bold" onClick={toggleLanguage}>
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4 position-relative animate-fade-in">
        <div className="card border-0 shadow-2xl overflow-hidden" style={{ background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-5">
              <div className="mb-4 d-flex justify-content-center">
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                  <img 
                    src="/logo.png" 
                    alt="Data Pill" 
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }} 
                  />
                </div>
              </div>
              <h3 className="fw-bold text-dark">{t.system_name}</h3>
              <p className="text-muted fw-bold">بوابة تسجيل دخول الموظفين</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase tracking-wider">
                  {t.email_placeholder}
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                  <input
                    type="email"
                    className="form-control form-control-lg bg-light border-0"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase tracking-wider">{t.password_placeholder}</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><i className="bi bi-shield-lock text-muted"></i></span>
                  <input
                    type="password"
                    className="form-control form-control-lg bg-light border-0"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 fw-bold fs-5 shadow-lg border-0 mb-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  </span>
                ) : (
                  t.login_btn
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
