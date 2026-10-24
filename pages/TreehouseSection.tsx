import React from 'react';
import type { TreehouseSectionId } from '../platform/routes';
import CookbookScreen from './CookbookScreen';
import EncyclopediaScreen from './EncyclopediaScreen';

interface TreehouseSectionProps {
  section: TreehouseSectionId;
  onNavigate: (path: string) => void;
}

export default function TreehouseSection({ section, onNavigate }: TreehouseSectionProps) {
  return section === 'cookbook'
    ? <CookbookScreen onNavigate={onNavigate} />
    : <EncyclopediaScreen onNavigate={onNavigate} />;
}
