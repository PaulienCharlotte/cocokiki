import React from 'react';
import './privacy.css';

export default function SiteFooter({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return <footer className="site-footer"><a href="/privacy" onClick={event => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onNavigate('/privacy');
  }}>Privacy</a></footer>;
}
