import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const Navbar = () => {
  const { user, logout, isAdmin, isSales, isAccountant, isInstructor, isMentor, isCoordinator } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = translations[lang];
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const canViewManagement = isAdmin || isSales || isAccountant || isMentor || isCoordinator;

  const isPureInstructor = isInstructor && !isAdmin && !isSales && !isAccountant && !isMentor && !isCoordinator;
  const isPureMentor = isMentor && !isAdmin && !isSales && !isAccountant && !isInstructor && !isCoordinator;

  // Primary nav items (always visible, role-filtered)
  const primaryLinks = [];

  if (isPureMentor) {
    primaryLinks.push({ to: '/mentor', icon: 'grid-1x2', label: 'الرئيسية', end: true });
  } else if (isPureInstructor) {
    primaryLinks.push({ to: '/instructor', icon: 'mortarboard', label: t.instructor_dashboard || 'لوحتي' });
  } else if (isCoordinator && !isAdmin) {
    primaryLinks.push({ to: '/instructor-mgmt', icon: 'mortarboard', label: 'إدارة المحاضرين' });
    primaryLinks.push({ to: '/subscriptions', icon: 'journal-bookmark', label: t.subscriptions });
    primaryLinks.push({ to: '/groups', icon: 'collection', label: t.groups });
  } else if (!isInstructor && !isMentor || isAdmin) {
    if (!isAccountant) {
      primaryLinks.push({ to: '/', icon: 'grid-1x2', label: t.dashboard, end: true });
    }
    if (!isAccountant) {
      primaryLinks.push({ to: '/students', icon: 'person-lines-fill', label: t.students });
    }
    primaryLinks.push({ to: '/subscriptions', icon: 'journal-bookmark', label: t.subscriptions });
    primaryLinks.push({ to: '/groups', icon: 'collection', label: t.groups });
    if (!isAccountant) {
      primaryLinks.push({ to: '/payments', icon: 'wallet2', label: t.payments });
    }
  }

  // Secondary links (shown in dropdown for admin/accountant)
  const secondaryLinks = [];

  if (isAdmin) {
    secondaryLinks.push({ to: '/instructor-mgmt', icon: 'mortarboard-fill', label: 'إدارة المحاضرين' });
  }
  if (isAdmin || isAccountant) {
    secondaryLinks.push({ to: '/expenses', icon: 'cart3', label: t.expenses });
    secondaryLinks.push({ to: '/payroll', icon: 'cash-stack', label: t.payroll });
    secondaryLinks.push({ to: '/reports', icon: 'file-earmark-bar-graph', label: t.reports });
    secondaryLinks.push({ to: '/audit-logs', icon: 'list-check', label: t.audit_logs });
  }
  if (canViewManagement && !isCoordinator && !isAccountant && !isMentor && !isInstructor) {
    secondaryLinks.push({ to: '/reminders', icon: 'bell', label: t.reminders });
    secondaryLinks.push({ to: '/mass-message', icon: 'whatsapp', label: t.mass_message });
  }
  if (isAdmin) {
    secondaryLinks.push({ to: '/employees', icon: 'people', label: t.employees });
    secondaryLinks.push({ to: '/admin', icon: 'shield-lock', label: t.admin_panel });
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top py-2 mt-3 mx-3 rounded-4 shadow-lg border-bottom-0">
      <div className="container-fluid px-3">
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center me-0 ms-2 flex-shrink-0" to={isCoordinator ? "/instructor-mgmt" : "/"}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
          </div>
        </Link>

        {/* Mobile Toggler */}
        <button className="navbar-toggler border-0 shadow-none ms-auto me-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <i className="bi bi-list fs-2 text-white"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Primary Nav Links */}
          <ul className="navbar-nav mx-auto gap-1 align-items-center flex-wrap">
            {primaryLinks.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink className="nav-link" to={link.to} end={link.end}>
                  <i className={`bi bi-${link.icon}`}></i>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}

            {/* More Dropdown (for secondary links) */}
            {secondaryLinks.length > 0 && (
              <li className="nav-item position-relative" ref={moreRef}>
                <button
                  className={`nav-link border-0 bg-transparent ${moreOpen ? 'active' : ''}`}
                  onClick={() => setMoreOpen(o => !o)}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                  <span>المزيد</span>
                </button>
                {moreOpen && (
                  <div className="navbar-more-menu">
                    {secondaryLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className="navbar-more-item"
                        onClick={() => setMoreOpen(false)}
                      >
                        <i className={`bi bi-${link.icon}`}></i>
                        <span>{link.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>

          {/* Right Side Actions */}
          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 flex-shrink-0">
            <div className="user-info d-none d-xl-flex flex-column text-end me-1">
              <span className="fw-bold text-white" style={{ fontSize: '0.82rem' }}>{user.fullName}</span>
              <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{user.roles?.join(', ')}</span>
            </div>

            <button className="btn btn-outline-light border-0 rounded-circle p-2" onClick={toggleTheme} title="تغيير المظهر">
              <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}-fill`}></i>
            </button>

            <button className="btn btn-outline-light border-0 rounded-pill px-3 fw-bold small" onClick={toggleLanguage}>
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            <button className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm small" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
