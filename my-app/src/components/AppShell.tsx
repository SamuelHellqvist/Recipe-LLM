import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from './UI';
const navigation = [ ['/', 'home', 'Home'], ['/recipes', 'recipes', 'Recipes'], ['/brainstorm', 'spark', 'Brainstorm'], ['/cook', 'cook', 'Cook'], ['/favorites', 'heart', 'Saved'] ];
export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isAuth = pathname === '/login' || pathname === '/signup';
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('kitchen-theme') === 'dark'; } catch { return false; } });
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try { localStorage.setItem('kitchen-theme', dark ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ } }, [dark]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <>
    <a href="#main-content" className="fixed -top-20 left-4 z-50 rounded-xl bg-surface p-4 focus:top-4">Skip to content</a>
    <header className="border-b border-line bg-surface/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 md:px-9">
        <Link to="/" className="flex items-center gap-3" aria-label="Little Table home"><span className="grid size-10 place-items-center rounded-2xl bg-brand text-surface"><Icon name="cook"/></span><span className="font-display text-2xl tracking-tight">tAible<span className="text-brand">.</span></span></Link>
        {!isAuth && <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">{navigation.map(([to, icon, label]) => <NavLink key={to} to={to} end className={({isActive}) => `flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${isActive ? 'bg-sage text-brand' : 'text-muted hover:bg-linen'}`}><Icon name={icon}/>{label}</NavLink>)}</nav>}
        <div className="flex gap-2"><button className="grid size-11 place-items-center rounded-full border border-line hover:bg-sage" onClick={() => setDark(!dark)} aria-label={`Use ${dark ? 'light' : 'dark'} mode`} aria-pressed={dark}><Icon name="sun"/></button>{!isAuth && <Link to="/profile" aria-label="Your profile" className="grid size-11 place-items-center rounded-full bg-clay"><Icon name="user"/></Link>}</div>
      </div>
    </header>
    <div id="main-content" tabIndex={-1} className="mx-auto min-h-[calc(100svh-10rem)] max-w-7xl px-5 py-7 pb-28 md:px-9 md:py-10">{children}</div>
    <footer className="mx-auto hidden max-w-7xl items-center justify-between border-t border-line px-9 py-6 text-xs text-muted md:flex"><span>tAible · Your kitchen. Your rules</span><span>Powered by OpenAI OSS-20B and Livsmedelsverket</span></footer>
    {!isAuth && <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">{navigation.map(([to, icon, label]) => <NavLink key={to} to={to} end className={({isActive}) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${isActive ? 'bg-sage text-brand' : 'text-muted'}`}><Icon name={icon}/>{label}</NavLink>)}</nav>}
  </>;
}
