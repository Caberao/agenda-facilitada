import { Cake, CalendarDays, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getRegistrationRequest, resolveApiAssetUrl } from '../../lib/api';
import type { WorkspaceTabRequest } from '../../lib/workspace-tabs';
import { useAppStore } from '../../store/app-store';

const baseNavLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/appointments', label: 'Agenda', icon: CalendarDays },
  { to: '/admin', label: 'Administração', icon: ShieldCheck },
  { to: '/settings', label: 'Configurações', icon: Settings2 },
];

const birthdaysNavLink = { to: '/birthdays', label: 'Aniversariantes', icon: Cake } as const;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const birthdaysModuleEnabled = useAppStore((state) => state.settings.birthdaysModuleEnabled);
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen);
  const toggleMobileNav = useAppStore((state) => state.toggleMobileNav);
  const logout = useAppStore((state) => state.logout);
  const navLinks = useMemo(() => {
    const canSeeAdmin = user?.role === 'admin';
    const linksWithoutAdmin = baseNavLinks.filter((link) => link.to !== '/admin');
    const rootLinks = canSeeAdmin ? baseNavLinks : linksWithoutAdmin;

    if (!birthdaysModuleEnabled) {
      return rootLinks;
    }

    return [rootLinks[0], rootLinks[1], birthdaysNavLink, ...rootLinks.slice(2)];
  }, [birthdaysModuleEnabled, user?.role]);
  const initialTab = resolveTabFromPath(location.pathname, navLinks);
  const [tabs, setTabs] = useState<Array<{ path: string; label: string }>>(() =>
    initialTab ? [{ path: initialTab.path, label: initialTab.label }] : [],
  );
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const initials = useMemo(() => {
    const source = profileName || user?.name || 'AF';
    const chunks = source.trim().split(/\s+/).slice(0, 2);
    return chunks.map((chunk) => chunk[0]?.toUpperCase() ?? '').join('') || 'AF';
  }, [profileName, user?.name]);

  useEffect(() => {
    async function loadRegistration() {
      try {
        const registration = await getRegistrationRequest();
        const name =
          registration.displayName ||
          registration.fullName ||
          registration.companyName ||
          registration.tradeName ||
          null;

        setProfileName(name);
        setProfileImage(registration.avatarUrl ? resolveApiAssetUrl(registration.avatarUrl) : null);
      } catch {
        setProfileName(null);
        setProfileImage(null);
      }
    }

    function handleRegistrationUpdated() {
      void loadRegistration();
    }

    void loadRegistration();
    window.addEventListener('registration-updated', handleRegistrationUpdated);
    return () => {
      window.removeEventListener('registration-updated', handleRegistrationUpdated);
    };
  }, []);

  useEffect(() => {
    const shouldResetTabs = sessionStorage.getItem('agenda_reset_tabs_after_login') === '1';
    if (!shouldResetTabs) {
      return;
    }

    sessionStorage.removeItem('agenda_reset_tabs_after_login');
    setTabs([{ path: '/dashboard', label: 'Dashboard' }]);
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    function handleWorkspaceOpenTab(event: Event) {
      const customEvent = event as CustomEvent<WorkspaceTabRequest>;
      const detail = customEvent.detail;
      if (!detail?.path || !detail?.label) {
        return;
      }

      openTab(detail.path, detail.label);
      navigate(detail.path);
    }

    window.addEventListener('workspace-open-tab', handleWorkspaceOpenTab as EventListener);
    return () => {
      window.removeEventListener('workspace-open-tab', handleWorkspaceOpenTab as EventListener);
    };
  }, [navigate]);

  useEffect(() => {
    if (birthdaysModuleEnabled) {
      return;
    }

    setTabs((current) => current.filter((tab) => !tab.path.startsWith('/birthdays')));
    if (location.pathname.startsWith('/birthdays')) {
      navigate('/dashboard');
    }
  }, [birthdaysModuleEnabled, location.pathname, navigate]);

  useEffect(() => {
    const currentTab = resolveTabFromPath(location.pathname, navLinks);
    if (!currentTab) {
      return;
    }

    setTabs((current) => {
      if (current.some((tab) => tab.path === currentTab.path)) {
        return current;
      }

      return [...current, currentTab];
    });
  }, [location.pathname, navLinks]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function closeMobileNav() {
    toggleMobileNav(false);
  }

  function openTab(path: string, label: string) {
    setTabs((current) => {
      if (current.some((tab) => tab.path === path)) {
        return current;
      }

      return [...current, { path, label }];
    });
  }

  function closeTab(path: string) {
    let fallbackPath: string | null = null;

    setTabs((current) => {
      const nextTabs = current.filter((tab) => tab.path !== path);

      if (location.pathname === path) {
        fallbackPath = nextTabs[nextTabs.length - 1]?.path || '/dashboard';
      }

      return nextTabs;
    });

    if (fallbackPath) {
      navigate(fallbackPath);
    }
  }

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="workspace-sidebar__brand">
          <Link className="workspace-sidebar__logo" to="/registration" title="Abrir cadastro">
            {profileImage ? <img src={profileImage} alt="Foto ou logo do perfil" /> : initials}
          </Link>
          <div className="workspace-sidebar__brand-text">
            <p className="workspace-sidebar__title">Agenda Facilitada</p>
            <Link className="workspace-sidebar__subtitle-link" to="/registration" onClick={() => openTab('/registration', 'Cadastro')}>
              <p className="workspace-sidebar__subtitle">{profileName || user?.name}</p>
            </Link>
            <Link className="workspace-sidebar__edit-link" to="/registration" onClick={() => openTab('/registration', 'Cadastro')}>
              Editar perfil
            </Link>
          </div>
        </div>

        <nav className="workspace-sidebar__nav" aria-label="Navegação principal">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => {
                  openTab(link.to, link.label);
                  closeMobileNav();
                }}
                className={({ isActive }) => (isActive ? 'workspace-sidebar__link is-active' : 'workspace-sidebar__link')}
                title={link.label}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="workspace-sidebar__logout" type="button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="workspace-main" onClick={closeMobileNav}>
        <header className="workspace-topbar">
          <button className="button button--ghost workspace-topbar__menu" type="button" onClick={() => toggleMobileNav()}>
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            Menu
          </button>

          <div className="workspace-tabs" role="tablist" aria-label="Abas de navegação">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                type="button"
                role="tab"
                aria-selected={location.pathname === tab.path}
                className={location.pathname === tab.path ? 'workspace-tab is-active' : 'workspace-tab'}
                onClick={() => navigate(tab.path)}
              >
                <span>{tab.label}</span>
                <span
                  className="workspace-tab__close"
                  role="button"
                  aria-label={`Fechar aba ${tab.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.path);
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </header>

        <section className="workspace-canvas">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function resolveTabFromPath(pathname: string, navLinks: Array<{ to: string; label: string }>) {
  const exact = navLinks.find((item) => item.to === pathname);
  if (exact) {
    return { path: exact.to, label: exact.label };
  }

  if (pathname === '/appointments/new') {
    return { path: pathname, label: 'Novo agendamento' };
  }

  if (/^\/appointments\/[^/]+\/edit$/.test(pathname)) {
    return { path: pathname, label: 'Editar agendamento' };
  }

  if (pathname === '/birthdays/contacts') {
    return { path: pathname, label: 'Aniversários · Contatos' };
  }

  if (pathname === '/birthdays/backgrounds') {
    return { path: pathname, label: 'Aniversários · Fundos' };
  }

  if (pathname === '/birthdays/groups') {
    return { path: pathname, label: 'Aniversários · Grupos' };
  }

  if (pathname === '/birthdays/batch') {
    return { path: pathname, label: 'Aniversários · Envio em lote' };
  }

  if (pathname === '/registration') {
    return { path: pathname, label: 'Cadastro' };
  }

  if (pathname === '/settings') {
    return { path: pathname, label: 'Configurações' };
  }

  if (pathname === '/admin') {
    return { path: pathname, label: 'Administração' };
  }

  if (pathname === '/admin/access') {
    return { path: pathname, label: 'Admin de acessos' };
  }

  if (pathname === '/admin/integrations') {
    return { path: pathname, label: 'Admin · Integrações' };
  }

  return null;
}
