'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'images' | 'videos' | 'plans' | 'layout' | 'contact' | 'surroundings' | 'seasons' | 'announcements';

interface AnnouncementItem {
  id: number;
  messageCn: string;
  messageJa: string;
  messageEn: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  styleVariant: 'default' | 'important';
  scrollSpeed: number;
  createdAt: string;
  updatedAt: string;
}

interface SurroundingSpot {
  id: string;
  category: string;
  nameZh: string; nameJa: string; nameEn: string;
  descriptionZh: string; descriptionJa: string; descriptionEn: string;
  distance: number;
  imageUrl: string;
  tagsZh: string[]; tagsJa: string[]; tagsEn: string[];
  visible: boolean;
  sortOrder: number;
}

interface SeasonImage {
  id: number;
  imageUrl: string;
  s3Key: string;
  altZh: string; altJa: string; altEn: string;
  isMain: boolean;
  displayOrder: number;
}

interface SeasonSpotAdmin {
  id: number | null;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  nameZh: string; nameJa: string; nameEn: string;
  descZh: string; descJa: string; descEn: string;
  accessZh: string; accessJa: string; accessEn: string;
  distanceMin: number;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  images: SeasonImage[];
}

interface MediaFile {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadDate: string;
  url: string;
  type: 'image' | 'video';
  isHero?: boolean;
}

interface PlanEntry {
  id: string;
  titleZh: string; titleJa: string; titleEn: string;
  descZh: string;  descJa: string;  descEn: string;
  duration: number;
  price: string;
  tagZh: string; tagJa: string; tagEn: string;
  highlightsZh: string[]; highlightsJa: string[]; highlightsEn: string[];
  coverImage: string;
  visible: boolean;
  createdAt: string;
}

// ── New plan editor types ──
type PlanEditorTab = 'basic' | 'accommodation' | 'content' | 'gallery' | 'days' | 'conclusion' | 'budget' | 'publish';

interface EditorHighlight {
  _key: string; // local unique key for React
  sortOrder: number;
  titleZh: string; titleJa: string; titleEn: string;
  descriptionZh: string; descriptionJa: string; descriptionEn: string;
  imageUrl: string;
}

interface EditorDay {
  dayNumber: number;
  titleZh: string; titleJa: string; titleEn: string;
  activitiesZh: string; activitiesJa: string; activitiesEn: string; // newline-separated
  mealMorningZh: string; mealMorningJa: string; mealMorningEn: string;
  mealLunchZh: string;   mealLunchJa: string;   mealLunchEn: string;
  mealDinnerZh: string;  mealDinnerJa: string;  mealDinnerEn: string;
}

interface EditorBudgetItem {
  _key: string;
  sortOrder: number;
  categoryZh: string; categoryJa: string; categoryEn: string;
  amountZh: string; currencyZh: string;
  amountJa: string; currencyJa: string;
  amountEn: string; currencyEn: string;
  noteZh: string; noteJa: string; noteEn: string;
}

interface EditorForm {
  // Tab 1: basic
  coverImage: string;
  duration: number;
  price: string;
  titleZh: string; titleJa: string; titleEn: string;
  prestigeZh: string; prestigeJa: string; prestigeEn: string;
  // Tab 2: accommodation
  accommodationImages: string[];
  // Tab 3: highlights
  highlights: EditorHighlight[];
  // Tab 4: days (auto-generated from duration)
  days: EditorDay[];
  // Tab 4b: gallery
  galleryUrls: string[];
  // Tab 5: conclusion
  conclusionZh: string; conclusionJa: string; conclusionEn: string;
  // Tab 6: budget
  budgetItems: EditorBudgetItem[];
  // Tab 7: publish
  visible: boolean;
}

// Layout: section key → ordered array of image URLs
type PageLayouts = Record<string, string[]>;


const DEFAULT_LAYOUTS: PageLayouts = {
  'home.hero':           [],
  'home.hotel':          [],
  'home.surroundings':   [],
  'gallery.hotel':       [],
  'gallery.surroundings':[],
  'surroundings.spots':  [],
};

const LAYOUT_SECTION_LABELS: Record<string, string> = {
  'home.hero':           'Home › Hero Slideshow',
  'home.hotel':          'Home › Hotel Intro',
  'home.surroundings':   'Home › Surroundings',
  'gallery.hotel':       'Gallery › Hotel',
  'gallery.surroundings':'Gallery › Surroundings',
  'surroundings.spots':  'Surroundings › Spots',
};

const SECTION_MAX: Record<string, number> = {
  'home.hero':           10,
  'home.hotel':           3,
  'home.surroundings':    4,
  'gallery.hotel':       50,
  'gallery.surroundings':50,
  'surroundings.spots':   9,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const basePath  = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const adminBase = basePath + '/admin';
  const apiBase   = basePath + '/api';

  // ── Media state ──
  const [activeTab, setActiveTab]       = useState<Tab>('images');
  const [files, setFiles]               = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [isDragging, setIsDragging]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [imageErrors, setImageErrors]   = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Plans state ──
  const [plans, setPlans]               = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // ── New Plan Editor state ──
  const [showPlanEditor, setShowPlanEditor]       = useState(false);
  const [planEditorId, setPlanEditorId]           = useState('');
  const [planEditorTab, setPlanEditorTab]         = useState<PlanEditorTab>('basic');
  const [planEditorSaving, setPlanEditorSaving]   = useState(false);
  const [planEditorMsg, setPlanEditorMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewPlanModal, setShowNewPlanModal]   = useState(false);
  const [newPlanIdInput, setNewPlanIdInput]       = useState('');
  const [newPlanCreating, setNewPlanCreating]     = useState(false);
  // which image picker context: 'cover' | 'accommodation' | `highlight-${key}`
  const [editorImagePickerCtx, setEditorImagePickerCtx] = useState<string | null>(null);
  const [editorForm, setEditorForm] = useState<EditorForm>({
    coverImage: '', duration: 3, price: '¥30,000',
    titleZh: '', titleJa: '', titleEn: '',
    prestigeZh: '', prestigeJa: '', prestigeEn: '',
    accommodationImages: [],
    highlights: [],
    days: [],
    galleryUrls: [],
    conclusionZh: '', conclusionJa: '', conclusionEn: '',
    budgetItems: [],
    visible: true,
  });

  // ── Layout state ──
  const [savedLayout, setSavedLayout]   = useState<PageLayouts>(DEFAULT_LAYOUTS);
  const [draftLayout, setDraftLayout]   = useState<PageLayouts | null>(null);
  const [layoutPage, setLayoutPage]     = useState<string>('home');

  // ── Layout drag state ──
  const [draggedFile, setDraggedFile]           = useState<MediaFile | null>(null);
  const [dragSourceSection, setDragSourceSection] = useState<string | null>(null);
  const [dropTarget, setDropTarget]             = useState<string | null>(null);

  // ── Upload previews ──
  const [uploadPreviews, setUploadPreviews] = useState<{name: string; url: string}[]>([]);

  // ── Bulk delete ──
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Preview / publish ──
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPublishing, setIsPublishing]         = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // ── Image metadata editing ──
  const [editingMetaFile, setEditingMetaFile] = useState<MediaFile | null>(null);
  const [metaForm, setMetaForm]               = useState({ name: '', category: '' });
  const [metaSaving, setMetaSaving]           = useState(false);

  // ── Toast ──
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Surroundings state ──
  const [surroundingSpots, setSurroundingSpots]   = useState<SurroundingSpot[]>([]);
  const [surroundingLoading, setSurroundingLoading] = useState(false);
  const [surroundingEditId, setSurroundingEditId] = useState<string | null>(null); // null=none, 'new'=new
  const blankSpot = (): SurroundingSpot => ({
    id: '', category: 'nature',
    nameZh: '', nameJa: '', nameEn: '',
    descriptionZh: '', descriptionJa: '', descriptionEn: '',
    distance: 10, imageUrl: '',
    tagsZh: [], tagsJa: [], tagsEn: [],
    visible: true, sortOrder: 0,
  });
  const [surroundingForm, setSurroundingForm] = useState<SurroundingSpot>(blankSpot());
  const [surroundingImagePickerOpen, setSurroundingImagePickerOpen] = useState(false);
  const [surroundingSaving, setSurroundingSaving] = useState(false);

  // ── Seasons state ──
  const [seasonSpots, setSeasonSpots]       = useState<SeasonSpotAdmin[]>([]);
  const [seasonLoading, setSeasonLoading]   = useState(false);
  const [seasonTab, setSeasonTab]           = useState<'spring'|'summer'|'autumn'|'winter'>('spring');
  const [seasonEditId, setSeasonEditId]     = useState<number | 'new' | null>(null);
  const [seasonUploading, setSeasonUploading] = useState(false);
  const [seasonSaving, setSeasonSaving]     = useState(false);
  const blankSeason = (): SeasonSpotAdmin => ({
    id: null, season: seasonTab,
    nameZh: '', nameJa: '', nameEn: '',
    descZh: '', descJa: '', descEn: '',
    accessZh: '', accessJa: '', accessEn: '',
    distanceMin: 15, isFeatured: false, displayOrder: 0, isActive: true, images: [],
  });
  const [seasonForm, setSeasonForm]         = useState<SeasonSpotAdmin>(blankSeason());

  // ── Announcements state ──
  const blankAnnouncement = (): Omit<AnnouncementItem, 'id' | 'createdAt' | 'updatedAt'> => ({
    messageCn: '', messageJa: '', messageEn: '',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: null,
    isActive: true,
    styleVariant: 'default',
    scrollSpeed: 30,
  });
  const [announcements, setAnnouncements]       = useState<AnnouncementItem[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementSaving, setAnnouncementSaving]   = useState(false);
  const [announcementEditId, setAnnouncementEditId]   = useState<number | 'new' | null>(null);
  const [announcementForm, setAnnouncementForm]       = useState<Omit<AnnouncementItem, 'id' | 'createdAt' | 'updatedAt'>>(blankAnnouncement());
  const [announcementPreviewLang, setAnnouncementPreviewLang] = useState<'ja' | 'cn' | 'en'>('ja');

  // ── Contact state ──
  const [contactForm, setContactForm] = useState({
    phone: '', phoneVisible: true,
    email: '', emailVisible: true,
    lineId: '', lineQrUrl: '', lineVisible: true,
    wechatId: '', wechatQrUrl: '', wechatVisible: true,
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSaving, setContactSaving]   = useState(false);
  const [contactImagePickerFor, setContactImagePickerFor] = useState<'line' | 'wechat' | null>(null);

  // ── Computed ──
  const currentLayout  = draftLayout ?? savedLayout;
  const layoutPlans    = plans;
  const hasLayoutChanges = draftLayout !== null;

  const changeCount = (() => {
    let n = 0;
    if (draftLayout) {
      for (const [k, urls] of Object.entries(draftLayout)) {
        if (JSON.stringify(urls) !== JSON.stringify(savedLayout[k] ?? [])) n++;
      }
    }
    return n;
  })();

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleLogout = async () => {
    await fetch(apiBase + '/auth/logout', { method: 'POST' });
    router.push(adminBase + '/login');
  };

  // ─── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [imgRes, vidRes] = await Promise.all([fetch(apiBase + '/media/images'), fetch(apiBase + '/media/videos')]);
        const imgs: MediaFile[] = imgRes.ok ? await imgRes.json() : [];
        const vids: MediaFile[] = vidRes.ok ? await vidRes.json() : [];
        setFiles([...imgs, ...vids]);
      } catch { setFiles([]); }
      finally { setMediaLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiBase + '/plans');
        setPlans(res.ok ? await res.json() : []);
      } catch { setPlans([]); }
      finally { setPlansLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiBase + '/layouts');
        if (res.ok) setSavedLayout({ ...DEFAULT_LAYOUTS, ...await res.json() });
      } catch { /* use defaults */ }
    })();
  }, []);

  // ── Load surroundings when tab is activated ──
  useEffect(() => {
    if (activeTab !== 'surroundings') return;
    setSurroundingLoading(true);
    fetch(apiBase + '/surroundings?admin=1')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setSurroundingSpots(d))
      .catch(() => {})
      .finally(() => setSurroundingLoading(false));
  }, [activeTab]);

  // ── Load seasons when tab or season filter changes ──
  useEffect(() => {
    if (activeTab !== 'seasons') return;
    setSeasonLoading(true);
    fetch(`${apiBase}/seasons?season=${seasonTab}`)
      .then((r) => r.ok ? r.json() : { spots: [] })
      .then((d) => setSeasonSpots(d.spots ?? []))
      .catch(() => {})
      .finally(() => setSeasonLoading(false));
  }, [activeTab, seasonTab]);

  // ── Load announcements when tab is activated ──
  useEffect(() => {
    if (activeTab !== 'announcements') return;
    setAnnouncementLoading(true);
    fetch(apiBase + '/admin/announcements')
      .then((r) => r.ok ? r.json() : { announcements: [] })
      .then((d) => setAnnouncements(d.announcements ?? []))
      .catch(() => {})
      .finally(() => setAnnouncementLoading(false));
  }, [activeTab]);

  // ── Load contact when tab is activated ──
  useEffect(() => {
    if (activeTab !== 'contact') return;
    setContactLoading(true);
    fetch(apiBase + '/contact')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setContactForm(d); })
      .catch(() => {})
      .finally(() => setContactLoading(false));
  }, [activeTab]);

  // ─── Upload ──────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (filesToUpload: File[]) => {
    if (!filesToUpload.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append('files', f));
      formData.append('category', activeTab === 'videos' ? 'videos' : 'uncategorized');
      const res = await fetch(apiBase + '/media/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const newEntries: MediaFile[] = await res.json();
        setFiles((prev) => [...newEntries, ...prev]);
        showMessage('success', t(translations.admin.upload_success));
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage('error', (err as { error?: string }).error ?? t(translations.common.error));
      }
    } catch { showMessage('error', t(translations.common.error)); }
    finally {
      setUploading(false);
      setUploadPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [activeTab, t]);

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop      = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    await handleUpload(Array.from(e.dataTransfer.files));
  }, [handleUpload]);
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setUploadPreviews(selected.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
    await handleUpload(selected);
  };

  // ─── Image usage check (based on layout data) ────────────────────────────

  const getImageUsage = useCallback((file: MediaFile): string | null => {
    if (file.type === 'video') return null;
    for (const [section, urls] of Object.entries(currentLayout)) {
      if (urls.includes(file.url)) {
        if (section.startsWith('plan.') && section.endsWith('.gallery')) {
          const planId = section.replace('plan.', '').replace('.gallery', '');
          const plan = plans.find((p) => p.id === planId);
          return `Plan "${plan?.titleEn ?? planId}" › Gallery`;
        }
        return LAYOUT_SECTION_LABELS[section] ?? section;
      }
    }
    const planCover = plans.find((p) => p.coverImage === file.url);
    if (planCover) return `Plan "${planCover.titleEn || planCover.id}" › Cover`;
    return null;
  }, [currentLayout, plans]);

  // ─── Delete media ────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;
    const usage = getImageUsage(file);
    if (usage) { showMessage('error', `削除不可 — 使用中: ${usage}`); return; }
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(apiBase + `/media/${id}`, { method: 'DELETE' });
      if (res.ok) { setFiles((prev) => prev.filter((f) => f.id !== id)); showMessage('success', 'ファイルを削除しました'); }
      else showMessage('error', t(translations.common.error));
    } catch { showMessage('error', t(translations.common.error)); }
  };

  // ─── Plans CRUD ──────────────────────────────────────────────────────────

  const handleToggleVisible = async (plan: PlanEntry) => {
    try {
      const res = await fetch(apiBase + `/plans/${plan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !plan.visible }),
      });
      if (res.ok) {
        const updated: PlanEntry = await res.json();
        setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        showMessage('success', updated.visible ? '表示にしました' : '非表示にしました');
      } else { showMessage('error', t(translations.common.error)); }
    } catch { showMessage('error', t(translations.common.error)); }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    try {
      const res = await fetch(apiBase + `/plans/${id}`, { method: 'DELETE' });
      if (res.ok) { setPlans((prev) => prev.filter((p) => p.id !== id)); showMessage('success', 'プランを削除しました'); }
      else showMessage('error', t(translations.common.error));
    } catch { showMessage('error', t(translations.common.error)); }
  };

  const handleMovePlan = async (index: number, direction: -1 | 1) => {
    const newPlans = [...plans];
    const target = index + direction;
    if (target < 0 || target >= newPlans.length) return;
    [newPlans[index], newPlans[target]] = [newPlans[target], newPlans[index]];
    setPlans(newPlans);
    try {
      await fetch(apiBase + '/plans', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newPlans.map((p) => p.id) }),
      });
    } catch { showMessage('error', t(translations.common.error)); }
  };

  // ─── Plan Editor helpers ──────────────────────────────────────────────────

  const makeKey = () => Math.random().toString(36).slice(2);

  const makeDaysFromDuration = (n: number): EditorDay[] =>
    Array.from({ length: n }, (_, i) => ({
      dayNumber: i + 1,
      titleZh: '', titleJa: '', titleEn: '',
      activitiesZh: '', activitiesJa: '', activitiesEn: '',
      mealMorningZh: '', mealMorningJa: '', mealMorningEn: '',
      mealLunchZh:   '', mealLunchJa:   '', mealLunchEn:   '',
      mealDinnerZh:  '', mealDinnerJa:  '', mealDinnerEn:  '',
    }));

  const openPlanEditor = async (plan: PlanEntry) => {
    setPlanEditorId(plan.id);
    setPlanEditorTab('basic');
    setEditorImagePickerCtx(null);
    // fetch full plan data
    try {
      const res = await fetch(apiBase + `/plans/${plan.id}`);
      if (res.ok) {
        const full = await res.json();
        setEditorForm({
          coverImage:    full.coverImage    ?? '',
          duration:      full.duration      ?? 3,
          price:         full.price         ?? '',
          titleZh:       full.titleZh       ?? '',
          titleJa:       full.titleJa       ?? '',
          titleEn:       full.titleEn       ?? '',
          prestigeZh:    full.prestigeZh    ?? '',
          prestigeJa:    full.prestigeJa    ?? '',
          prestigeEn:    full.prestigeEn    ?? '',
          accommodationImages: full.accommodationImages ?? [],
          highlights:    (full.highlights ?? []).map((h: any) => ({
            _key:          makeKey(),
            sortOrder:     h.sortOrder,
            titleZh:       h.titleZh       ?? '',
            titleJa:       h.titleJa       ?? '',
            titleEn:       h.titleEn       ?? '',
            descriptionZh: h.descriptionZh ?? '',
            descriptionJa: h.descriptionJa ?? '',
            descriptionEn: h.descriptionEn ?? '',
            imageUrl:      h.imageUrl      ?? '',
          })),
          days:           (full.days ?? []).length > 0
            ? (full.days ?? []).map((d: any) => ({
                dayNumber:    d.dayNumber,
                titleZh:      d.titleZh       ?? '',
                titleJa:      d.titleJa       ?? '',
                titleEn:      d.titleEn       ?? '',
                activitiesZh: (d.activitiesZh ?? []).join('\n'),
                activitiesJa: (d.activitiesJa ?? []).join('\n'),
                activitiesEn: (d.activitiesEn ?? []).join('\n'),
                mealMorningZh: d.mealMorningZh ?? '',
                mealMorningJa: d.mealMorningJa ?? '',
                mealMorningEn: d.mealMorningEn ?? '',
                mealLunchZh:   d.mealLunchZh   ?? '',
                mealLunchJa:   d.mealLunchJa   ?? '',
                mealLunchEn:   d.mealLunchEn   ?? '',
                mealDinnerZh:  d.mealDinnerZh  ?? '',
                mealDinnerJa:  d.mealDinnerJa  ?? '',
                mealDinnerEn:  d.mealDinnerEn  ?? '',
              }))
            : makeDaysFromDuration(full.duration ?? 3),
          galleryUrls: [],
          conclusionZh:  full.conclusionZh  ?? '',
          conclusionJa:  full.conclusionJa  ?? '',
          conclusionEn:  full.conclusionEn  ?? '',
          budgetItems:   (full.budgetItems ?? []).map((b: any) => ({
            _key:       makeKey(),
            sortOrder:  b.sortOrder,
            categoryZh: b.categoryZh  ?? '',
            categoryJa: b.categoryJa  ?? '',
            categoryEn: b.categoryEn  ?? '',
            amountZh:   b.amountZh    ?? '',
            currencyZh: b.currencyZh  ?? 'CNY',
            amountJa:   b.amountJa    ?? '',
            currencyJa: b.currencyJa  ?? 'JPY',
            amountEn:   b.amountEn    ?? '',
            currencyEn: b.currencyEn  ?? 'USD',
            noteZh:     b.noteZh      ?? '',
            noteJa:     b.noteJa      ?? '',
            noteEn:     b.noteEn      ?? '',
          })),
          visible: full.visible ?? true,
        });
        // Load gallery URLs from layouts
        const layoutRes = await fetch(apiBase + '/layouts');
        if (layoutRes.ok) {
          const layout = await layoutRes.json();
          const galleryUrls = layout[`plan.${plan.id}.gallery`] ?? [];
          setEditorForm((prev) => ({ ...prev, galleryUrls }));
        }
      }
    } catch { /* use defaults */ }
    setShowPlanEditor(true);
  };

  const showEditorMsg = (type: 'success' | 'error', text: string) => {
    setPlanEditorMsg({ type, text });
    setTimeout(() => setPlanEditorMsg(null), 3500);
  };

  const handleSaveAllPlan = async () => {
    setPlanEditorSaving(true);
    try {
      const f = editorForm;
      // 1. PUT basic plan data
      const planRes = await fetch(apiBase + `/plans/${planEditorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleZh: f.titleZh, titleJa: f.titleJa, titleEn: f.titleEn,
          prestigeZh: f.prestigeZh, prestigeJa: f.prestigeJa, prestigeEn: f.prestigeEn,
          coverImage: f.coverImage,
          accommodationImages: f.accommodationImages,
          conclusionZh: f.conclusionZh, conclusionJa: f.conclusionJa, conclusionEn: f.conclusionEn,
          duration: f.duration,
          price: f.price,
          visible: f.visible,
        }),
      });
      if (!planRes.ok) { showEditorMsg('error', 'プランの保存に失敗しました'); return; }

      // 2. PUT highlights
      const highlightsPayload = f.highlights.map((h, i) => ({
        sortOrder: i,
        titleZh: h.titleZh, titleJa: h.titleJa, titleEn: h.titleEn,
        descriptionZh: h.descriptionZh, descriptionJa: h.descriptionJa, descriptionEn: h.descriptionEn,
        imageUrl: h.imageUrl,
      }));
      const hlRes = await fetch(apiBase + `/plans/${planEditorId}/highlights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlightsPayload),
      });
      if (!hlRes.ok) { showEditorMsg('error', 'ハイライトの保存に失敗しました'); return; }

      // 3. PUT days
      const daysPayload = f.days.map((d) => ({
        dayNumber: d.dayNumber,
        titleZh: d.titleZh, titleJa: d.titleJa, titleEn: d.titleEn,
        activitiesZh: d.activitiesZh.split('\n').filter(Boolean),
        activitiesJa: d.activitiesJa.split('\n').filter(Boolean),
        activitiesEn: d.activitiesEn.split('\n').filter(Boolean),
        mealMorningZh: d.mealMorningZh, mealMorningJa: d.mealMorningJa, mealMorningEn: d.mealMorningEn,
        mealLunchZh:   d.mealLunchZh,   mealLunchJa:   d.mealLunchJa,   mealLunchEn:   d.mealLunchEn,
        mealDinnerZh:  d.mealDinnerZh,  mealDinnerJa:  d.mealDinnerJa,  mealDinnerEn:  d.mealDinnerEn,
      }));
      const daysRes = await fetch(apiBase + `/plans/${planEditorId}/days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(daysPayload),
      });
      if (!daysRes.ok) { showEditorMsg('error', '日程の保存に失敗しました'); return; }

      // 4. PUT budget
      const budgetPayload = f.budgetItems.map((b, i) => ({
        sortOrder: i,
        categoryZh: b.categoryZh, categoryJa: b.categoryJa, categoryEn: b.categoryEn,
        amountZh: b.amountZh, currencyZh: b.currencyZh,
        amountJa: b.amountJa, currencyJa: b.currencyJa,
        amountEn: b.amountEn, currencyEn: b.currencyEn,
        noteZh: b.noteZh, noteJa: b.noteJa, noteEn: b.noteEn,
      }));
      const budgetRes = await fetch(apiBase + `/plans/${planEditorId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetPayload),
      });
      if (!budgetRes.ok) { showEditorMsg('error', '予算の保存に失敗しました'); return; }

      // 5. PUT gallery layout
      const layoutRes2 = await fetch(apiBase + '/layouts');
      const existingLayout = layoutRes2.ok ? await layoutRes2.json() : {};
      const newLayout = { ...existingLayout, [`plan.${planEditorId}.gallery`]: f.galleryUrls };
      await fetch(apiBase + '/layouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLayout),
      });

      // Update local plan list
      const updated: PlanEntry = await planRes.json();
      setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      showEditorMsg('success', '全ての変更を保存しました');
    } catch (err) {
      showEditorMsg('error', String(err));
    } finally {
      setPlanEditorSaving(false);
    }
  };

  const handleCreateNewPlan = async () => {
    const id = newPlanIdInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) { showMessage('error', 'Plan ID を入力してください'); return; }
    setNewPlanCreating(true);
    try {
      const res = await fetch(apiBase + '/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, titleZh: id }),
      });
      if (res.ok) {
        const created: PlanEntry = await res.json();
        setPlans((prev) => [...prev, created]);
        setShowNewPlanModal(false);
        setNewPlanIdInput('');
        await openPlanEditor(created);
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage('error', (err as { error?: string }).error ?? t(translations.common.error));
      }
    } catch { showMessage('error', t(translations.common.error)); }
    finally { setNewPlanCreating(false); }
  };

  const editorBudgetTotal = (() => {
    const totals: Record<string, number> = {};
    for (const item of editorForm.budgetItems) {
      for (const [amt, cur] of [[item.amountZh, item.currencyZh], [item.amountJa, item.currencyJa], [item.amountEn, item.currencyEn]] as [string, string][]) {
        const num = parseFloat((amt ?? '').replace(/[,¥$￥]/g, ''));
        if (!isNaN(num) && num > 0) totals[cur] = (totals[cur] ?? 0) + num;
      }
    }
    return Object.entries(totals).map(([cur, sum]) => `${cur} ${sum.toLocaleString()}`).join(' / ') || null;
  })();

  // ─── Bulk delete unused ───────────────────────────────────────────────────

  const handleBulkDeleteUnused = async () => {
    const unused = imageFiles.filter((f) => getImageUsage(f) === null);
    if (unused.length === 0) { showMessage('error', '未使用の画像はありません'); return; }
    if (!window.confirm(`未使用の画像 ${unused.length} 件を削除します。この操作は元に戻せません。`)) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.all(unused.map((f) => fetch(apiBase + `/media/${f.id}`, { method: 'DELETE' })));
      const deletedIds = unused.filter((_, i) => results[i].ok).map((f) => f.id);
      setFiles((prev) => prev.filter((f) => !deletedIds.includes(f.id)));
      showMessage('success', `${deletedIds.length} 件削除しました`);
    } catch { showMessage('error', t(translations.common.error)); }
    finally { setBulkDeleting(false); }
  };

  // ─── Image metadata save ──────────────────────────────────────────────────

  const handleSaveMeta = async () => {
    if (!editingMetaFile) return;
    setMetaSaving(true);
    try {
      const res = await fetch(apiBase + `/media/${editingMetaFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: metaForm.name, category: metaForm.category }),
      });
      if (res.ok) {
        const updated: MediaFile = await res.json();
        setFiles((prev) => prev.map((f) => f.id === updated.id ? { ...f, name: updated.name ?? metaForm.name, category: updated.category ?? metaForm.category } : f));
        setEditingMetaFile(null);
        showMessage('success', 'ファイル名を更新しました');
      } else {
        showMessage('error', t(translations.common.error));
      }
    } catch { showMessage('error', t(translations.common.error)); }
    finally { setMetaSaving(false); }
  };

  // ─── Layout draft operations ──────────────────────────────────────────────

  const handleDiscardDraft = () => { setDraftLayout(null); };

  /** Publish all draft changes to server */
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      if (draftLayout) {
        const res = await fetch(apiBase + '/layouts', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftLayout),
        });
        if (!res.ok) throw new Error('レイアウトの更新に失敗しました');
        setSavedLayout(draftLayout);
        setDraftLayout(null);
      }
      setShowPreviewModal(false);
      showMessage('success', '変更を本番に反映しました');
    } catch (err) {
      showMessage('error', String(err));
    } finally { setIsPublishing(false); }
  };

  // ─── Layout drag-and-drop handlers ───────────────────────────────────────

  /**
   * Drop on a section:
   * - Same section → reorder (insert before targetFile)
   * - Different section → move from source, add to target at targetFile position (or end)
   */
  const handleSectionDrop = useCallback((
    e: React.DragEvent,
    targetSection: string,
    targetFile?: MediaFile,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const file        = draggedFile;
    const srcSection  = dragSourceSection;
    setDraggedFile(null); setDragSourceSection(null); setDropTarget(null);
    if (!file) return;
    const url = file.url;

    setDraftLayout((prev) => {
      const base = prev ?? savedLayout;
      // Deep-copy all sections
      const updated: PageLayouts = {};
      for (const [k, v] of Object.entries({ ...DEFAULT_LAYOUTS, ...base })) updated[k] = [...v];
      // Ensure target section exists
      if (!updated[targetSection]) updated[targetSection] = [];

      if (srcSection === targetSection) {
        // Reorder within same section
        const arr = updated[targetSection];
        const fromIdx = arr.indexOf(url);
        if (fromIdx !== -1 && targetFile && targetFile.url !== url) {
          arr.splice(fromIdx, 1);
          const toIdx = arr.indexOf(targetFile.url);
          arr.splice(toIdx !== -1 ? toIdx : arr.length, 0, url);
        }
      } else {
        // Remove from source section
        if (srcSection && updated[srcSection]) {
          updated[srcSection] = updated[srcSection].filter((u) => u !== url);
        }
        // Add to target section (no duplicates)
        const arr = updated[targetSection];
        if (!arr.includes(url)) {
          if (targetFile) {
            const toIdx = arr.indexOf(targetFile.url);
            arr.splice(toIdx !== -1 ? toIdx : arr.length, 0, url);
          } else {
            arr.push(url);
          }
        }
      }
      return updated;
    });
  }, [draggedFile, dragSourceSection, savedLayout]);

  /** Drop on Media Library → remove from current section */
  const handleLibraryDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file       = draggedFile;
    const srcSection = dragSourceSection;
    setDraggedFile(null); setDragSourceSection(null); setDropTarget(null);
    if (!file || !srcSection) return;
    const url = file.url;
    setDraftLayout((prev) => {
      const base = prev ?? savedLayout;
      const updated: PageLayouts = {};
      for (const [k, v] of Object.entries({ ...DEFAULT_LAYOUTS, ...base })) updated[k] = [...v];
      if (updated[srcSection]) updated[srcSection] = updated[srcSection].filter((u) => u !== url);
      return updated;
    });
  }, [draggedFile, dragSourceSection, savedLayout]);

  // ─── Derived ─────────────────────────────────────────────────────────────

  const imageFiles    = files.filter((f) => f.type === 'image');
  const videoFiles    = files.filter((f) => f.type === 'video');
  const displayedFiles = activeTab === 'images' ? imageFiles : videoFiles;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Page header */}
      <section className="relative py-12 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="gold-line" />
            <span className="text-gold text-[10px] tracking-[0.5em] font-display uppercase">Administration</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="section-title">{t(translations.admin.title)}</h1>
              <p className="section-subtitle mt-2">{t(translations.admin.subtitle)}</p>
            </div>
            <button onClick={handleLogout}
              className="self-start sm:self-auto mt-1 px-5 py-2 border border-white/10 text-white/40 hover:border-red-500/40 hover:text-red-400 font-display text-[10px] uppercase tracking-[0.3em] transition-all duration-300">
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-4 sm:right-6 left-4 sm:left-auto z-50 px-6 py-3 border text-sm font-display tracking-widest uppercase ${
          message.type === 'success' ? 'bg-green-900/80 border-green-500/30 text-green-300' : 'bg-red-900/80 border-red-500/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* ── Tabs ── */}
        <div className="flex overflow-x-auto border-b border-white/10 mb-8">
          {(['images', 'videos', 'plans', 'layout', 'contact', 'surroundings', 'seasons', 'announcements'] as Tab[]).map((tab) => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-3 flex-shrink-0 font-display text-sm uppercase tracking-widest transition-all duration-300 relative ${
                activeTab === tab ? 'text-gold border-b-2 border-gold' : 'text-white/30 hover:text-white/60'
              }`}>
              {tab === 'images' ? 'Images' : tab === 'videos' ? 'Videos' : tab === 'plans' ? 'Plans' : tab === 'layout' ? 'Layout' : tab === 'contact' ? 'Contact' : tab === 'surroundings' ? 'Surroundings' : tab === 'seasons' ? 'Seasons' : 'Announcements'}
              {tab === 'layout' && hasLayoutChanges && (
                <span className="ml-2 bg-gold text-black text-[8px] font-display px-1.5 py-0.5 rounded-sm">{changeCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════ IMAGES / VIDEOS TAB ══════════════════ */}
        {(activeTab === 'images' || activeTab === 'videos') && (
          <div>
            <div className="luxury-card p-6 mb-6">
              <h3 className="font-display text-gold text-xs uppercase tracking-widest mb-4">
                {activeTab === 'images' ? 'Upload Images' : 'Upload Video'}
              </h3>
              {activeTab === 'images' && (
                <p className="text-white/25 text-[10px] font-display uppercase tracking-widest mb-4">
                  アップロード後、Layout タブで各ページへ配置してください
                </p>
              )}
              <div className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-gold/30'
              }`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple
                  accept={activeTab === 'images' ? 'image/*' : 'video/*'}
                  className="hidden" onChange={handleFileSelect} />
                {uploading ? (
                  <div className="text-gold text-xs font-display uppercase tracking-widest animate-pulse">Uploading...</div>
                ) : (
                  <>
                    <div className="text-gold/40 mb-3">
                      <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-xs font-kaiti italic">Drag files here or click to upload</p>
                  </>
                )}
              </div>
              {uploadPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/30 text-[10px] font-display uppercase tracking-widest">{uploadPreviews.length} ファイル選択中</span>
                    <button onClick={() => setUploadPreviews([])} className="text-white/30 hover:text-red-400 text-[10px] font-display uppercase tracking-widest transition-colors">クリア</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {uploadPreviews.map((p, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden border border-white/10 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                          <span className="text-[7px] font-display text-white/40 truncate block">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total',  value: displayedFiles.length },
                { label: '配置済み', value: displayedFiles.filter((f) => getImageUsage(f) !== null).length },
                { label: '未配置',  value: displayedFiles.filter((f) => getImageUsage(f) === null && f.type !== 'video').length },
              ].map((stat, idx) => (
                <div key={idx} className="border border-white/5 p-4 text-center">
                  <div className="font-display text-2xl font-bold text-gold mb-1">{stat.value}</div>
                  <div className="text-white/30 text-[10px] uppercase tracking-widest font-display">{stat.label}</div>
                </div>
              ))}
            </div>

            {activeTab === 'images' && imageFiles.filter((f) => getImageUsage(f) === null).length > 0 && (
              <div className="flex justify-end mb-2">
                <button onClick={handleBulkDeleteUnused} disabled={bulkDeleting}
                  className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-red-500/20 text-red-400/60 hover:border-red-400/40 hover:text-red-400 transition-all disabled:opacity-50">
                  {bulkDeleting ? '削除中...' : `未使用を一括削除 (${imageFiles.filter((f) => getImageUsage(f) === null).length})`}
                </button>
              </div>
            )}

            <div className="luxury-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest">Preview</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest">File Name</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden md:table-cell">配置状況</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden lg:table-cell">Size</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden lg:table-cell">Date</th>
                    <th className="text-right p-4 text-gold text-[10px] font-display uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mediaLoading ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gold/40 font-display text-xs uppercase tracking-widest animate-pulse">Loading...</td></tr>
                  ) : displayedFiles.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-white/20 font-kaiti italic">No files yet. Please upload.</td></tr>
                  ) : displayedFiles.map((file) => {
                    const usage = getImageUsage(file);
                    const isUsed = !!usage;
                    return (
                      <tr key={file.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="relative w-12 h-12 overflow-hidden bg-white/5 border border-white/10">
                            {file.type === 'image' && !imageErrors[file.id] ? (
                              <Image src={file.url} alt={file.name} fill unoptimized className="object-cover"
                                onError={() => setImageErrors((prev) => ({ ...prev, [file.id]: true }))} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {file.type === 'video'
                                  ? <svg className="w-5 h-5 text-gold/40" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  : <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                }
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-white/80 text-sm max-w-[180px]">
                          <div className="flex items-center gap-1 group/name">
                            <span className="truncate">{file.name}</span>
                            <button onClick={() => { setEditingMetaFile(file); setMetaForm({ name: file.name, category: file.category }); }}
                              className="flex-shrink-0 opacity-0 group-hover/name:opacity-100 text-white/30 hover:text-gold transition-all"
                              title="名前を編集">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {isUsed
                            ? <span className="border border-gold/30 text-gold/70 px-2 py-0.5 text-[9px] font-display uppercase tracking-widest">{usage}</span>
                            : <span className="border border-white/10 text-white/25 px-2 py-0.5 text-[9px] font-display uppercase tracking-widest">未配置</span>
                          }
                        </td>
                        <td className="p-4 text-white/30 hidden lg:table-cell">{file.size}</td>
                        <td className="p-4 text-white/30 hidden lg:table-cell">{file.uploadDate}</td>
                        <td className="p-4">
                          {isUsed
                            ? <span title={`使用中のため削除不可: ${usage}`}
                                className="block text-right text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-white/5 text-white/15 cursor-not-allowed">
                                Delete
                              </span>
                            : <button onClick={() => handleDelete(file.id)}
                                className="block ml-auto text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-red-500/20 text-red-400/60 hover:border-red-400/40 hover:text-red-400 transition-all">
                                Delete
                              </button>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════ PLANS TAB ══════════════════ */}
        {activeTab === 'plans' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-white/40 font-display text-xs uppercase tracking-widest">
                {plans.filter((p) => p.visible).length} visible · {plans.length} total
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowNewPlanModal(true); setNewPlanIdInput(''); }}
                  className="bg-gold text-black font-display text-xs uppercase tracking-[0.3em] px-6 py-2.5 hover:bg-gold/80 transition-colors">
                  + 新規作成
                </button>
              </div>
            </div>
            <div className="luxury-card overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest w-16">Order</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden sm:table-cell">Cover</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest">Title</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden md:table-cell">Duration</th>
                    <th className="text-left p-4 text-gold text-[10px] font-display uppercase tracking-widest hidden md:table-cell">Price</th>
                    <th className="text-center p-4 text-gold text-[10px] font-display uppercase tracking-widest">Visible</th>
                    <th className="text-right p-4 text-gold text-[10px] font-display uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plansLoading ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gold/40 font-display text-xs uppercase tracking-widest animate-pulse">Loading...</td></tr>
                  ) : plans.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-white/20 font-kaiti italic">No plans yet.</td></tr>
                  ) : plans.map((plan, idx) => (
                    <tr key={plan.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMovePlan(idx, -1)} disabled={idx === 0}
                            className="w-6 h-5 flex items-center justify-center text-white/30 hover:text-gold disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs">▲</button>
                          <button onClick={() => handleMovePlan(idx, 1)} disabled={idx === plans.length - 1}
                            className="w-6 h-5 flex items-center justify-center text-white/30 hover:text-gold disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs">▼</button>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="relative w-12 h-9 overflow-hidden border border-white/10 bg-white/5">
                          {plan.coverImage
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={plan.coverImage} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><span className="text-white/20 text-[8px]">—</span></div>
                          }
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-serif text-white font-bold">{plan.titleZh}</div>
                        <div className="text-white/30 text-[10px] font-display uppercase tracking-widest mt-0.5">{plan.titleEn}</div>
                      </td>
                      <td className="p-4 text-white/50 hidden md:table-cell">{plan.duration} days</td>
                      <td className="p-4 text-gold font-display font-bold hidden md:table-cell">{plan.price}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleToggleVisible(plan)}
                          className={`w-10 h-5 rounded-full transition-all duration-300 relative ${plan.visible ? 'bg-gold' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all duration-300 ${plan.visible ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openPlanEditor(plan)}
                            className="text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-gold/30 text-gold/60 hover:border-gold hover:text-gold transition-all">編集</button>
                          <button onClick={() => handleDeletePlan(plan.id)}
                            className="text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-red-500/20 text-red-400/60 hover:border-red-400/40 hover:text-red-400 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ══════════════════ LAYOUT TAB ══════════════════ */}
        {activeTab === 'layout' && (() => {
          // Resolve URL → MediaFile
          const urlToFile = (url: string) => files.find((f) => f.url === url);

          const basePageOptions = [
            { id: 'home',         label: 'Home',         url: '/' },
            { id: 'gallery',      label: 'Gallery',      url: '/library' },
            { id: 'surroundings', label: 'Surroundings', url: '/surroundings' },
          ];
          const planPageOptions = plans.map((p) => ({
            id: `plan-${p.id}`,
            label: p.titleEn || p.titleJa || p.id,
            url: `/plans/${p.id}`,
          }));
          const pageOptions = [...basePageOptions, ...planPageOptions];

          // ── Inline render helpers ────────────────────────────────────────────

          /**
           * Single image tile within a section.
           * Dragging it within the same section reorders; dropping it in another section moves it.
           * Dropping another image ONTO it inserts before this image.
           */
          const renderSectionImg = (url: string, section: string) => {
            const f = urlToFile(url);
            if (!f) return null;
            const isBeingDragged = draggedFile?.url === url;
            const isDropTarget   = dropTarget === `img-${url}` && dragSourceSection === section && !isBeingDragged;
            return (
              <div key={url}
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDraggedFile(f); setDragSourceSection(section); }}
                onDragEnd={() => { setDraggedFile(null); setDragSourceSection(null); setDropTarget(null); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(`img-${url}`); }}
                onDragLeave={(e) => { e.stopPropagation(); setDropTarget((t) => t === `img-${url}` ? null : t); }}
                onDrop={(e) => handleSectionDrop(e, section, f)}
                className={`relative overflow-hidden border aspect-video cursor-grab active:cursor-grabbing group transition-all ${
                  isBeingDragged ? 'border-gold opacity-40 scale-95'
                  : isDropTarget  ? 'border-gold ring-1 ring-gold'
                  : 'border-white/10 hover:border-gold/50'
                }`}
                title={f.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={f.name} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <span className="text-white/60 text-[8px] font-display uppercase tracking-widest">drag to reorder / remove</span>
                </div>
                {/* Left-edge insert indicator */}
                {isDropTarget && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold pointer-events-none" />
                )}
              </div>
            );
          };

          /**
           * Section drop zone: renders ordered images + an "add" placeholder.
           * Images within the zone can be dropped onto each other to reorder.
           */
          const renderSection = (section: string, label: string, cols = 4) => {
            const urls    = currentLayout[section] ?? [];
            const dzKey   = `${section}-zone`;
            const isOver  = dropTarget === dzKey;
            const colsNum = Math.max(cols, urls.length + 1);
            return (
              <div className="luxury-card p-5 overflow-x-auto">
                <h4 className="font-display text-white/60 text-[10px] uppercase tracking-widest mb-3">{label}</h4>
                {SECTION_MAX[section] !== undefined && (
                  <div className={`text-[9px] font-display uppercase tracking-widest mb-2 ${urls.length >= SECTION_MAX[section] ? 'text-amber-400' : 'text-white/20'}`}>
                    {urls.length} / {SECTION_MAX[section]}{urls.length >= SECTION_MAX[section] ? ' — 上限に達しました' : ''}
                  </div>
                )}
                <div
                  onDragOver={(e) => { e.preventDefault(); if (dropTarget !== dzKey) setDropTarget(dzKey); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
                  onDrop={(e) => { if (dropTarget === dzKey) handleSectionDrop(e, section); }}
                  className={`p-3 border-2 border-dashed rounded transition-all duration-200 min-w-0 ${isOver ? 'border-gold bg-gold/5' : 'border-white/10'}`}
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${colsNum}, minmax(80px,1fr))`, gap: '0.5rem' }}
                >
                  {urls.map((url) => renderSectionImg(url, section))}
                  <div className={`aspect-video border-2 border-dashed rounded flex items-center justify-center ${isOver ? 'border-gold bg-gold/10' : 'border-white/10'}`}>
                    <span className="text-[9px] font-display text-white/20 uppercase tracking-widest">
                      {isOver ? '▼ Drop' : urls.length === 0 ? 'Drop here' : '+ Add'}
                    </span>
                  </div>
                </div>
                {section === 'home.hero' && urls.length > 0 && (
                  <p className="text-white/20 text-[8px] font-display uppercase tracking-widest mt-2">
                    先頭の画像が初期表示。セクション内でドラッグして順番変更可能
                  </p>
                )}
              </div>
            );
          };

          /** Render sections for the currently selected page */
          const renderPageSections = () => {
            switch (layoutPage) {
              case 'home': return (
                <div className="space-y-4">
                  {renderSection('home.hero', '① Hero Slideshow (先頭画像 = 初期表示)', 4)}
                  {/* Hotel intro — fixed 3 slots */}
                  <div className="luxury-card p-5">
                    <h4 className="font-display text-white/60 text-[10px] uppercase tracking-widest mb-3">② Hotel Introduction (最初の3枚が表示)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => {
                        const url  = (currentLayout['home.hotel'] ?? [])[i];
                        const slotKey = `hotel-slot-${i}`;
                        const over = dropTarget === slotKey;
                        return (
                          <div key={i}
                            onDragOver={(e) => { e.preventDefault(); setDropTarget(slotKey); }}
                            onDragLeave={() => setDropTarget(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = draggedFile; const src = dragSourceSection;
                              setDraggedFile(null); setDragSourceSection(null); setDropTarget(null);
                              if (!file) return;
                              setDraftLayout((prev) => {
                                const base = prev ?? savedLayout;
                                const updated: PageLayouts = {};
                                for (const [k, v] of Object.entries({ ...DEFAULT_LAYOUTS, ...base })) updated[k] = [...v];
                                if (src && updated[src]) updated[src] = updated[src].filter((u) => u !== file.url);
                                const arr = [...(updated['home.hotel'] ?? [])];
                                const existIdx = arr.indexOf(file.url);
                                if (existIdx !== -1) arr.splice(existIdx, 1);
                                arr.splice(i, 0, file.url);
                                updated['home.hotel'] = arr;
                                return updated;
                              });
                            }}
                            className={`relative border-2 border-dashed rounded overflow-hidden transition-all ${over ? 'border-gold bg-gold/10' : 'border-white/10'}`}
                          >
                            <div className="aspect-[4/3] bg-white/5">
                              {url ? renderSectionImg(url, 'home.hotel') : null}
                            </div>
                            {!url && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[9px] font-display text-white/40 bg-black/50 px-2 py-0.5">
                                  {over ? '▼ Drop' : `Slot ${i + 1}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Plans preview */}
                  <div className="luxury-card p-5">
                    <h4 className="font-display text-white/60 text-[10px] uppercase tracking-widest mb-3">③ Plans Preview (最初の3プランを表示)</h4>
                    <p className="text-white/20 text-[9px] font-display">カバー画像は Plans タブ → 編集 で設定してください</p>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {plans.filter((p) => p.visible).slice(0, 3).map((p) => (
                        <div key={p.id} className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-white/5">
                          {p.coverImage
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={p.coverImage} alt="" className="w-full h-full object-cover opacity-70" />
                            : <div className="w-full h-full flex items-center justify-center"><span className="text-white/20 text-[8px] font-display uppercase">{p.titleEn || p.id}</span></div>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                  {renderSection('home.surroundings', '④ Surroundings Preview (4タイル)', 4)}
                </div>
              );
              case 'gallery': return (
                <div className="space-y-4">
                  {renderSection('gallery.hotel',        '① Hotel Photos', 4)}
                  {renderSection('gallery.surroundings', '② Surroundings Photos', 4)}
                </div>
              );
              case 'surroundings': return (
                <div className="space-y-4">
                  {renderSection('surroundings.spots', 'Spot Images (スポット画像)', 4)}
                </div>
              );
              default: {
                if (layoutPage.startsWith('plan-')) {
                  const planId = layoutPage.replace('plan-', '');
                  return (
                    <div className="space-y-4">
                      {renderSection(`plan.${planId}.gallery`, 'Gallery Images (ギャラリー画像)', 4)}
                    </div>
                  );
                }
                return null;
              }
            }
          };

          const isLibraryOver = dropTarget === 'library-drop';

          return (
            <div>
              {/* Draft bar */}
              {hasLayoutChanges && (
                <div className="flex items-center justify-between bg-gold/5 border border-gold/20 px-5 py-3 mb-6">
                  <span className="font-display text-gold text-[10px] uppercase tracking-widest">{changeCount} 件の変更 — 未反映</span>
                  <div className="flex items-center gap-3">
                    <button onClick={handleDiscardDraft}
                      className="px-4 py-1.5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 font-display text-[9px] uppercase tracking-widest transition-all">
                      破棄
                    </button>
                    <button onClick={() => setShowPreviewModal(true)}
                      className="px-4 py-1.5 border border-white/30 text-white/70 hover:border-white hover:text-white font-display text-[9px] uppercase tracking-widest transition-all">
                      プレビュー
                    </button>
                    <button onClick={() => setShowPublishConfirm(true)} disabled={isPublishing}
                      className="px-5 py-1.5 bg-gold text-black font-display text-[9px] uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                      {isPublishing ? '反映中...' : '反映する'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Left: page selector + media library */}
                <div className="w-full lg:w-56 lg:flex-shrink-0 space-y-4">
                  <div className="luxury-card p-4">
                    <h3 className="font-display text-gold text-[10px] uppercase tracking-widest mb-3">Select Page</h3>
                    <div className="space-y-0.5">
                      {basePageOptions.map((pg) => (
                        <button key={pg.id}
                          onClick={() => { setLayoutPage(pg.id); setDropTarget(null); }}
                          className={`w-full text-left px-3 py-2 transition-all duration-200 flex items-center justify-between group ${
                            layoutPage === pg.id
                              ? 'bg-gold/10 border-l-2 border-gold text-gold'
                              : 'text-white/40 hover:text-white/70 border-l-2 border-transparent'
                          }`}
                        >
                          <span className="font-display text-[10px] uppercase tracking-widest truncate">{pg.label}</span>
                          <span className="text-[8px] text-white/20 font-display ml-1 flex-shrink-0 group-hover:text-white/40">{pg.url}</span>
                        </button>
                      ))}
                      {planPageOptions.length > 0 && (
                        <div className="pt-3 pb-1 px-3">
                          <span className="text-[8px] font-display text-white/20 uppercase tracking-[0.4em]">Plans</span>
                        </div>
                      )}
                      {planPageOptions.map((pg) => (
                        <button key={pg.id}
                          onClick={() => { setLayoutPage(pg.id); setDropTarget(null); }}
                          className={`w-full text-left pl-5 pr-3 py-2 transition-all duration-200 flex items-center justify-between group ${
                            layoutPage === pg.id
                              ? 'bg-gold/10 border-l-2 border-gold text-gold'
                              : 'text-white/40 hover:text-white/70 border-l-2 border-transparent'
                          }`}
                        >
                          <span className="font-display text-[10px] uppercase tracking-widest truncate">{pg.label}</span>
                          <span className="text-[8px] text-white/20 font-display ml-1 flex-shrink-0 group-hover:text-white/40">{pg.url}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Media Library — drop here to unplace */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDropTarget('library-drop'); }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={handleLibraryDrop}
                    className={`luxury-card p-4 lg:sticky top-24 transition-all duration-200 ${isLibraryOver ? 'ring-2 ring-gold/50' : ''}`}
                  >
                    <h3 className="font-display text-gold text-[10px] uppercase tracking-widest mb-1">Media Library</h3>
                    <p className="text-white/20 text-[8px] font-display uppercase tracking-widest mb-3">
                      {isLibraryOver ? '↓ ここにドロップで配置解除' : 'Drag → section へ配置 / ここに戻すで解除'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 max-h-[40vh] lg:max-h-[55vh] overflow-y-auto pr-0.5">
                      {imageFiles.length === 0
                        ? <div className="col-span-3 text-white/20 text-xs font-kaiti italic text-center py-6">No images</div>
                        : imageFiles.map((f) => {
                          const isPlaced = Object.values(currentLayout).some((urls) => urls.includes(f.url))
                                         || plans.some((p) => p.coverImage === f.url);
                          return (
                            <div key={f.id}
                              draggable
                              onDragStart={() => { setDraggedFile(f); setDragSourceSection(null); }}
                              onDragEnd={() => { setDraggedFile(null); setDragSourceSection(null); setDropTarget(null); }}
                              className={`relative aspect-square overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${
                                draggedFile?.id === f.id ? 'border-gold opacity-50 scale-95'
                                : isPlaced ? 'border-gold/30 hover:border-gold/60'
                                : 'border-white/15 hover:border-gold/50'
                              }`}
                              title={`${f.name}\n[${isPlaced ? '配置済み' : '未配置'}]`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={f.url} alt={f.name} className="w-full h-full object-cover pointer-events-none" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-1 py-0.5">
                                <span className={`text-[6px] font-display uppercase tracking-widest truncate block ${isPlaced ? 'text-gold/60' : 'text-white/30'}`}>
                                  {isPlaced ? '配置済み' : '未配置'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>

                {/* Right: page sections */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="gold-line" />
                    <span className="text-gold text-[10px] font-display uppercase tracking-[0.5em]">
                      {pageOptions.find((p) => p.id === layoutPage)?.label ?? layoutPage}
                    </span>
                    <span className="text-white/20 text-[9px] font-display">
                      {pageOptions.find((p) => p.id === layoutPage)?.url}
                    </span>
                    <div className="gold-line flex-1" />
                  </div>
                  {!hasLayoutChanges && (
                    <p className="text-white/20 text-[9px] font-display uppercase tracking-widest mb-4">
                      Library から画像をドロップして配置 / セクション内でドラッグして順番変更 / Library に戻すで解除
                    </p>
                  )}
                  {renderPageSections()}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ══════════════════ NEW PLAN MODAL ══════════════════ */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-gold text-sm uppercase tracking-widest">新規プラン作成</h2>
              <button onClick={() => setShowNewPlanModal(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-2">
              Plan ID <span className="text-red-400">*</span>
            </label>
            <input
              value={newPlanIdInput}
              onChange={(e) => setNewPlanIdInput(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewPlan(); }}
              placeholder="e.g. winter-ski"
              autoFocus
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:border-gold/50 focus:outline-none mb-1"
            />
            <p className="text-white/20 text-[10px] font-display mb-6">小文字・ハイフンのみ。URL: /plans/[id]</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewPlanModal(false)}
                className="px-5 py-2 border border-white/10 text-white/40 hover:text-white font-display text-xs uppercase tracking-widest transition-all">キャンセル</button>
              <button onClick={handleCreateNewPlan} disabled={newPlanCreating || !newPlanIdInput.trim()}
                className="px-6 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                {newPlanCreating ? '作成中...' : '作成して編集'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ PLAN EDITOR OVERLAY ══════════════════ */}
      {showPlanEditor && (() => {
        const f = editorForm;

        // Input style helper
        const inp = "w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:border-gold/50 focus:outline-none";
        const ta  = "w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:border-gold/50 focus:outline-none resize-none";
        const langLabel = (l: string) => <span className="flex-shrink-0 text-white/30 text-[10px] font-display uppercase w-6 pt-2">{l}</span>;

        // ── Tab 1: Basic Info ────────────────────────────────────────────────
        const renderBasicTab = () => (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-2">カバー画像</label>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-20 overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                  {f.coverImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={f.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-white/20 text-[8px] font-display uppercase">No image</span></div>
                  }
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setEditorImagePickerCtx('cover')}
                    className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-white/20 text-white/50 hover:border-gold/40 hover:text-gold transition-all">
                    {f.coverImage ? '変更' : '選択'}
                  </button>
                  {f.coverImage && (
                    <button type="button" onClick={() => setEditorForm((ef) => ({ ...ef, coverImage: '' }))}
                      className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-red-500/20 text-red-400/50 hover:border-red-400/40 hover:text-red-400 transition-all">
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Duration + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-1">泊数 (Duration)</label>
                <input type="number" min={1} value={f.duration}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setEditorForm((ef) => ({
                      ...ef,
                      duration: n,
                      days: ef.days.length === n ? ef.days : makeDaysFromDuration(n),
                    }));
                  }}
                  className={inp} />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-1">料金 (Price)</label>
                <input value={f.price}
                  onChange={(e) => setEditorForm((ef) => ({ ...ef, price: e.target.value }))}
                  placeholder="¥60,000" className={inp} />
              </div>
            </div>
            {/* Title */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-2">タイトル</label>
              {(['zh', 'ja', 'en'] as const).map((l) => (
                <div key={l} className="flex gap-2 items-start mb-2">
                  {langLabel(l)}
                  <input value={(f as any)[`title${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                    onChange={(e) => setEditorForm((ef) => ({ ...ef, [`title${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value }))}
                    className={inp} />
                </div>
              ))}
            </div>
            {/* Prestige */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-2">The Prestige (ヒーローサブタイトル)</label>
              {(['zh', 'ja', 'en'] as const).map((l) => (
                <div key={l} className="flex gap-2 items-start mb-2">
                  {langLabel(l)}
                  <textarea value={(f as any)[`prestige${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                    onChange={(e) => setEditorForm((ef) => ({ ...ef, [`prestige${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value }))}
                    rows={2} className={ta} />
                </div>
              ))}
            </div>
          </div>
        );

        // ── Tab 2: Accommodation ─────────────────────────────────────────────
        const renderAccommodationTab = () => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-display">宿泊施設画像 (最大5枚)</label>
              {f.accommodationImages.length < 5 && (
                <button type="button" onClick={() => setEditorImagePickerCtx('accommodation')}
                  className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-white/20 text-white/50 hover:border-gold/40 hover:text-gold transition-all">
                  + 宿泊施設画像を追加
                </button>
              )}
            </div>
            {f.accommodationImages.length === 0
              ? <div className="text-white/20 text-sm font-kaiti italic text-center py-8 border border-dashed border-white/10">画像が未設定です</div>
              : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {f.accommodationImages.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => setEditorForm((ef) => ({ ...ef, accommodationImages: ef.accommodationImages.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/80 border border-white/20 text-white/60 hover:text-red-400 flex items-center justify-center text-xs transition-all">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        );

        // ── Tab 3: Highlights ────────────────────────────────────────────────
        const renderHighlightsTab = () => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-display">{f.highlights.length} / 10</span>
              {f.highlights.length < 10 && (
                <button type="button"
                  onClick={() => setEditorForm((ef) => ({
                    ...ef,
                    highlights: [...ef.highlights, {
                      _key: makeKey(), sortOrder: ef.highlights.length,
                      titleZh: '', titleJa: '', titleEn: '',
                      descriptionZh: '', descriptionJa: '', descriptionEn: '',
                      imageUrl: '',
                    }],
                  }))}
                  className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-white/20 text-white/50 hover:border-gold/40 hover:text-gold transition-all">
                  ＋ 項目を追加
                </button>
              )}
            </div>
            {f.highlights.map((h, idx) => (
              <div key={h._key} className="border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gold/60 text-[10px] font-display uppercase tracking-widest">#{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button disabled={idx === 0}
                      onClick={() => setEditorForm((ef) => { const arr = [...ef.highlights]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return { ...ef, highlights: arr }; })}
                      className="text-white/30 hover:text-gold disabled:opacity-20 text-xs transition-colors">▲</button>
                    <button disabled={idx === f.highlights.length - 1}
                      onClick={() => setEditorForm((ef) => { const arr = [...ef.highlights]; [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; return { ...ef, highlights: arr }; })}
                      className="text-white/30 hover:text-gold disabled:opacity-20 text-xs transition-colors">▼</button>
                    <button
                      onClick={() => setEditorForm((ef) => ({ ...ef, highlights: ef.highlights.filter((_, i) => i !== idx) }))}
                      className="text-red-400/50 hover:text-red-400 text-[10px] font-display uppercase tracking-widest border border-red-500/20 px-2 py-0.5 transition-all">削除</button>
                  </div>
                </div>
                {/* Image picker */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-12 overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                    {h.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={h.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-white/20 text-[7px] font-display">No img</span></div>
                    }
                  </div>
                  <button type="button" onClick={() => setEditorImagePickerCtx(`highlight-${h._key}`)}
                    className="text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-white/20 text-white/40 hover:border-gold/40 hover:text-gold transition-all">
                    画像を選択
                  </button>
                  {h.imageUrl && (
                    <button type="button" onClick={() => setEditorForm((ef) => ({
                      ...ef, highlights: ef.highlights.map((item, i) => i === idx ? { ...item, imageUrl: '' } : item)
                    }))}
                      className="text-[10px] font-display uppercase tracking-widest px-2 py-1 border border-red-500/20 text-red-400/50 hover:text-red-400 transition-all">削除</button>
                  )}
                </div>
                {/* Title */}
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">タイトル</label>
                  {(['zh', 'ja', 'en'] as const).map((l) => (
                    <div key={l} className="flex gap-2 items-center mb-1.5">
                      {langLabel(l)}
                      <input value={(h as any)[`title${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                        onChange={(e) => setEditorForm((ef) => ({
                          ...ef, highlights: ef.highlights.map((item, i) => i === idx ? { ...item, [`title${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : item)
                        }))}
                        className={inp} />
                    </div>
                  ))}
                </div>
                {/* Description */}
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">説明</label>
                  {(['zh', 'ja', 'en'] as const).map((l) => (
                    <div key={l} className="flex gap-2 items-start mb-1.5">
                      {langLabel(l)}
                      <textarea value={(h as any)[`description${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                        onChange={(e) => setEditorForm((ef) => ({
                          ...ef, highlights: ef.highlights.map((item, i) => i === idx ? { ...item, [`description${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : item)
                        }))}
                        rows={2} className={ta} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {f.highlights.length === 0 && (
              <div className="text-white/20 text-sm font-kaiti italic text-center py-8 border border-dashed border-white/10">
                ハイライト未設定 — ＋ 項目を追加 で追加してください
              </div>
            )}
          </div>
        );

        // ── Tab 4: Days ──────────────────────────────────────────────────────
        const renderDaysTab = () => (
          <div className="space-y-6">
            <div className="text-white/30 text-[10px] font-display uppercase tracking-widest">
              {f.duration} 日間 — 基本情報タブの泊数と連動
            </div>
            {f.days.map((day, idx) => (
              <div key={day.dayNumber} className="border border-white/10 p-4 space-y-4">
                <div className="font-display text-gold/60 text-[10px] uppercase tracking-widest mb-2">
                  Day {day.dayNumber}
                </div>
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">タイトル</label>
                  {(['zh', 'ja', 'en'] as const).map((l) => (
                    <div key={l} className="flex gap-2 items-center mb-1.5">
                      {langLabel(l)}
                      <input value={(day as any)[`title${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                        onChange={(e) => setEditorForm((ef) => ({
                          ...ef, days: ef.days.map((d, i) => i === idx ? { ...d, [`title${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : d)
                        }))}
                        className={inp} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">アクティビティ (1行1項目)</label>
                  {(['zh', 'ja', 'en'] as const).map((l) => (
                    <div key={l} className="flex gap-2 items-start mb-1.5">
                      {langLabel(l)}
                      <textarea value={(day as any)[`activities${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                        onChange={(e) => setEditorForm((ef) => ({
                          ...ef, days: ef.days.map((d, i) => i === idx ? { ...d, [`activities${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : d)
                        }))}
                        rows={3} className={ta} />
                    </div>
                  ))}
                </div>
                {/* Meals */}
                {[
                  { field: 'mealMorning', label: '朝食 Morning' },
                  { field: 'mealLunch',   label: '昼食 Lunch' },
                  { field: 'mealDinner',  label: '夕食 Dinner' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">{label}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['zh', 'ja', 'en'] as const).map((l) => (
                        <div key={l} className="flex gap-1 items-center">
                          <span className="text-white/20 text-[9px] font-display w-4">{l}</span>
                          <input value={(day as any)[`${field}${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                            onChange={(e) => setEditorForm((ef) => ({
                              ...ef, days: ef.days.map((d, i) => i === idx ? { ...d, [`${field}${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : d)
                            }))}
                            className="flex-1 bg-white/5 border border-white/10 text-white px-2 py-1.5 text-xs focus:border-gold/50 focus:outline-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

        // ── Tab 5: Conclusion ────────────────────────────────────────────────
        const renderConclusionTab = () => (
          <div className="space-y-4">
            <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display">結語テキスト</label>
            {(['zh', 'ja', 'en'] as const).map((l) => (
              <div key={l} className="flex gap-2 items-start">
                {langLabel(l)}
                <textarea value={(f as any)[`conclusion${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                  onChange={(e) => setEditorForm((ef) => ({ ...ef, [`conclusion${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value }))}
                  rows={5} className={ta} />
              </div>
            ))}
          </div>
        );

        // ── Tab 6: Budget ────────────────────────────────────────────────────
        const renderBudgetTab = () => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-display">
                {editorBudgetTotal ? `合計: ${editorBudgetTotal}` : '合計: —'}
              </span>
              <button type="button"
                onClick={() => setEditorForm((ef) => ({
                  ...ef,
                  budgetItems: [...ef.budgetItems, {
                    _key: makeKey(), sortOrder: ef.budgetItems.length,
                    categoryZh: '', categoryJa: '', categoryEn: '',
                    amountZh: '', currencyZh: 'CNY',
                    amountJa: '', currencyJa: 'JPY',
                    amountEn: '', currencyEn: 'USD',
                    noteZh: '', noteJa: '', noteEn: '',
                  }],
                }))}
                className="text-[10px] font-display uppercase tracking-widest px-3 py-1.5 border border-white/20 text-white/50 hover:border-gold/40 hover:text-gold transition-all">
                ＋ 行を追加
              </button>
            </div>
            {f.budgetItems.map((item, idx) => (
              <div key={item._key} className="border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gold/60 text-[10px] font-display uppercase tracking-widest">#{idx + 1}</span>
                  <button
                    onClick={() => setEditorForm((ef) => ({ ...ef, budgetItems: ef.budgetItems.filter((_, i) => i !== idx) }))}
                    className="text-red-400/50 hover:text-red-400 text-[10px] font-display uppercase tracking-widest border border-red-500/20 px-2 py-0.5 transition-all">削除</button>
                </div>
                {/* Category */}
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">カテゴリー</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['zh', 'ja', 'en'] as const).map((l) => (
                      <div key={l} className="flex gap-1 items-center">
                        <span className="text-white/20 text-[9px] font-display w-4">{l}</span>
                        <input value={(item as any)[`category${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                          onChange={(e) => setEditorForm((ef) => ({
                            ...ef, budgetItems: ef.budgetItems.map((bi, i) => i === idx ? { ...bi, [`category${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : bi)
                          }))}
                          className="flex-1 bg-white/5 border border-white/10 text-white px-2 py-1.5 text-xs focus:border-gold/50 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Amount per language */}
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">金額 / 通貨</label>
                  <div className="space-y-1.5">
                    {([
                      ['zh', 'amountZh', 'currencyZh', '25000', ['CNY','JPY','USD']],
                      ['ja', 'amountJa', 'currencyJa', '25000', ['JPY','CNY','USD']],
                      ['en', 'amountEn', 'currencyEn', '1000',  ['USD','JPY','CNY']],
                    ] as [string, keyof EditorBudgetItem, keyof EditorBudgetItem, string, string[]][]).map(([lang, amtKey, curKey, ph, opts]) => (
                      <div key={lang} className="flex gap-2 items-center">
                        <span className="text-white/20 text-[9px] font-display w-4">{lang}</span>
                        <select
                          value={item[curKey] as string}
                          onChange={(e) => setEditorForm((ef) => ({ ...ef, budgetItems: ef.budgetItems.map((bi, i) => i === idx ? { ...bi, [curKey]: e.target.value } : bi) }))}
                          className="bg-white/5 border border-white/10 text-gold text-xs px-2 py-1.5 focus:border-gold/50 focus:outline-none">
                          {opts.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          value={item[amtKey] as string}
                          onChange={(e) => setEditorForm((ef) => ({ ...ef, budgetItems: ef.budgetItems.map((bi, i) => i === idx ? { ...bi, [amtKey]: e.target.value } : bi) }))}
                          placeholder={ph}
                          className="w-36 bg-white/5 border border-white/10 text-white px-2 py-1.5 text-sm focus:border-gold/50 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Note */}
                <div>
                  <label className="block text-white/30 text-[9px] uppercase tracking-widest font-display mb-1">説明</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['zh', 'ja', 'en'] as const).map((l) => (
                      <div key={l} className="flex gap-1 items-center">
                        <span className="text-white/20 text-[9px] font-display w-4">{l}</span>
                        <input value={(item as any)[`note${l.charAt(0).toUpperCase() + l.slice(1)}`]}
                          onChange={(e) => setEditorForm((ef) => ({
                            ...ef, budgetItems: ef.budgetItems.map((bi, i) => i === idx ? { ...bi, [`note${l.charAt(0).toUpperCase() + l.slice(1)}`]: e.target.value } : bi)
                          }))}
                          className="flex-1 bg-white/5 border border-white/10 text-white px-2 py-1.5 text-xs focus:border-gold/50 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {f.budgetItems.length === 0 && (
              <div className="text-white/20 text-sm font-kaiti italic text-center py-8 border border-dashed border-white/10">
                予算項目未設定 — ＋ 行を追加 で追加してください
              </div>
            )}
          </div>
        );

        // ── Tab 7: Publish ───────────────────────────────────────────────────
        const renderPublishTab = () => (
          <div className="space-y-6">
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-2">Plan ID (読み取り専用)</label>
              <div className="font-display text-white/60 text-sm px-3 py-2 border border-white/10 bg-white/3">{planEditorId}</div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-display">サイトに公開する</label>
              <button onClick={() => setEditorForm((ef) => ({ ...ef, visible: !ef.visible }))}
                className={`w-12 h-6 rounded-full transition-all relative ${f.visible ? 'bg-gold' : 'bg-white/10'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${f.visible ? 'left-7' : 'left-1'}`} />
              </button>
              <span className={`text-sm font-display ${f.visible ? 'text-gold' : 'text-white/30'}`}>
                {f.visible ? '公開中' : '非公開'}
              </span>
            </div>
          </div>
        );

        // ── Tab content dispatcher ───────────────────────────────────────────
        const renderTabContent = () => {
          switch (planEditorTab) {
            case 'basic':          return renderBasicTab();
            case 'accommodation':  return renderAccommodationTab();
            case 'content':        return renderHighlightsTab();
            case 'days':           return renderDaysTab();
            case 'conclusion':     return renderConclusionTab();
            case 'budget':         return renderBudgetTab();
            case 'publish':        return renderPublishTab();
          }
        };

        // ── Image picker for editor ──────────────────────────────────────────
        const renderEditorImagePicker = () => {
          if (!editorImagePickerCtx) return null;
          const ctx = editorImagePickerCtx;
          const onPick = (url: string) => {
            if (ctx === 'cover') {
              setEditorForm((ef) => ({ ...ef, coverImage: url }));
            } else if (ctx === 'accommodation') {
              setEditorForm((ef) => ({
                ...ef,
                accommodationImages: ef.accommodationImages.includes(url)
                  ? ef.accommodationImages
                  : [...ef.accommodationImages, url].slice(0, 5),
              }));
            } else if (ctx.startsWith('highlight-')) {
              const key = ctx.replace('highlight-', '');
              setEditorForm((ef) => ({
                ...ef,
                highlights: ef.highlights.map((h) => h._key === key ? { ...h, imageUrl: url } : h),
              }));
            }
            setEditorImagePickerCtx(null);
          };

          return (
            <div className="fixed inset-0 bg-black/90 z-[600] flex items-start justify-center overflow-y-auto py-6 px-4">
              <div className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-gold text-sm uppercase tracking-widest">画像を選択</h3>
                  <button onClick={() => setEditorImagePickerCtx(null)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
                </div>
                {imageFiles.length === 0
                  ? <div className="text-white/20 text-sm font-kaiti italic text-center py-12">画像がありません。先に Images タブからアップロードしてください。</div>
                  : <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                      {imageFiles.map((imgF) => (
                        <button key={imgF.id} type="button"
                          onClick={() => onPick(imgF.url)}
                          className="relative aspect-square overflow-hidden border border-white/10 hover:border-gold/60 transition-all"
                          title={imgF.name}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgF.url} alt={imgF.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                            <span className="text-[6px] font-display text-white/40 truncate block">{imgF.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                }
              </div>
            </div>
          );
        };

        const editorTabs: { id: PlanEditorTab; label: string }[] = [
          { id: 'basic',         label: '基本情報' },
          { id: 'accommodation', label: 'Accommodation' },
          { id: 'content',       label: 'コンテンツ' },
          { id: 'days',          label: '日程' },
          { id: 'conclusion',    label: 'Conclusion' },
          { id: 'budget',        label: 'Budget' },
          { id: 'publish',       label: '公開設定' },
        ];

        return (
          <div className="fixed inset-0 z-[500] bg-[#050505] flex flex-col">
            {/* Editor header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="gold-line" />
                <span className="font-display text-gold text-xs uppercase tracking-[0.4em]">Plan Editor</span>
                <span className="text-white/30 font-display text-xs">— {planEditorId}</span>
              </div>
              <div className="flex items-center gap-3">
                {planEditorMsg && (
                  <span className={`font-display text-xs tracking-widest ${planEditorMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {planEditorMsg.type === 'success' ? '✓ ' : '✗ '}{planEditorMsg.text}
                  </span>
                )}
                <button onClick={handleSaveAllPlan} disabled={planEditorSaving}
                  className="px-6 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                  {planEditorSaving ? '保存中...' : 'Save All'}
                </button>
                <button onClick={() => setShowPlanEditor(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all text-lg">
                  ×
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex-shrink-0 flex overflow-x-auto border-b border-white/10 bg-[#0a0a0a]">
              {editorTabs.map((tab) => (
                <button key={tab.id}
                  onClick={() => setPlanEditorTab(tab.id)}
                  className={`px-5 py-3 flex-shrink-0 font-display text-xs uppercase tracking-widest transition-all ${
                    planEditorTab === tab.id
                      ? 'text-gold border-b-2 border-gold'
                      : 'text-white/30 hover:text-white/60'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                {renderTabContent()}
              </div>
            </div>

            {/* Image picker overlay (inside editor) */}
            {renderEditorImagePicker()}
          </div>
        );
      })()}

      {/* ══════════════════ PUBLISH CONFIRM MODAL ══════════════════ */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6">
            <h2 className="font-display text-gold text-sm uppercase tracking-widest mb-4">変更を反映する</h2>
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {draftLayout && Object.entries(draftLayout).map(([section, urls]) => {
                const saved = savedLayout[section] ?? [];
                if (JSON.stringify(urls) === JSON.stringify(saved)) return null;
                const label = LAYOUT_SECTION_LABELS[section] ?? section;
                return (
                  <div key={section} className="flex items-start gap-2 text-sm">
                    <span className="text-gold/60 font-display text-[9px] uppercase tracking-widest w-36 flex-shrink-0 mt-0.5">{label}</span>
                    <span className="text-white/50 text-[11px] font-kaiti">{saved.length}枚 → {urls.length}枚</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setShowPublishConfirm(false)}
                className="px-5 py-2 border border-white/10 text-white/40 hover:text-white font-display text-xs uppercase tracking-widest transition-all">キャンセル</button>
              <button onClick={async () => { setShowPublishConfirm(false); await handlePublish(); }} disabled={isPublishing}
                className="px-6 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                {isPublishing ? '反映中...' : '確認して反映'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ METADATA EDIT MODAL ══════════════════ */}
      {editingMetaFile && (
        <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-gold text-sm uppercase tracking-widest">ファイル情報を編集</h2>
              <button onClick={() => setEditingMetaFile(null)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="mb-2">
              <div className="relative aspect-video mb-4 overflow-hidden border border-white/10 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editingMetaFile.url} alt="" className="w-full h-full object-contain" />
              </div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-1">表示名 / Alt Text</label>
              <input
                value={metaForm.name}
                onChange={(e) => setMetaForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:border-gold/50 focus:outline-none text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMeta(); if (e.key === 'Escape') setEditingMetaFile(null); }}
              />
              <p className="text-white/20 text-[10px] mt-1 font-display">画像のalt属性および管理画面での表示名に使用されます</p>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest font-display mb-1 mt-4">カテゴリ</label>
              <select
                value={metaForm.category}
                onChange={(e) => setMetaForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 focus:border-gold/50 focus:outline-none text-sm">
                <option value="uncategorized">uncategorized</option>
                <option value="hotel">hotel</option>
                <option value="surroundings">surroundings</option>
                {plans.map((p) => (
                  <option key={p.id} value={`plan-${p.id}`}>plan-{p.id}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setEditingMetaFile(null)}
                className="px-4 py-2 border border-white/10 text-white/40 hover:text-white font-display text-xs uppercase tracking-widest transition-all">キャンセル</button>
              <button onClick={handleSaveMeta} disabled={metaSaving}
                className="px-6 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                {metaSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ PREVIEW MODAL ══════════════════ */}
      {showPreviewModal && (() => {
        const lay = currentLayout;

        const ImgBox = ({ url, aspect = 'aspect-video', className = '' }: { url: string; aspect?: string; className?: string }) =>
          url
            ? <div className={`relative overflow-hidden ${aspect} ${className}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            : <div className={`bg-white/5 border border-dashed border-white/10 flex items-center justify-center ${aspect} ${className}`}>
                <span className="text-white/20 text-[8px] font-display uppercase">No image</span>
              </div>;

        const pageLabelMap: Record<string, string> = {
          home: 'Home', 'plans-list': 'Plans', gallery: 'Gallery',
          ...layoutPlans.reduce((acc, p) => ({ ...acc, [`plan-${p.id}`]: p.titleEn || p.id }), {} as Record<string, string>),
        };

        const renderPreview = () => {
          /* ── HOME ── */
          if (layoutPage === 'home') {
            const heroUrls = lay['home.hero'] ?? [];
            const hotelUrls = lay['home.hotel'] ?? [];
            const srndUrls  = lay['home.surroundings'] ?? [];
            return (
              <div className="space-y-0 bg-[#0a0806] rounded overflow-hidden">
                {/* Hero */}
                <div className="relative">
                  <ImgBox url={heroUrls[0] ?? ''} aspect="aspect-[16/7]" className="w-full" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 flex flex-col items-center justify-end pb-8">
                    <div className="text-center">
                      <div className="text-[8px] font-display text-gold/80 uppercase tracking-[0.4em] mb-1">Terrace Villa Foresta Asama</div>
                      <div className="text-white/90 font-serif text-lg leading-tight mb-4">至高の自然体験</div>
                      <div className="flex gap-1 justify-center">
                        {heroUrls.slice(0, 5).map((_, i) => (
                          <div key={i} className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-gold' : 'bg-white/30'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Hotel intro */}
                <div className="bg-[#0d0b09] px-6 py-5">
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-1">Hotel Introduction</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[0, 1, 2].map((i) => <ImgBox key={i} url={hotelUrls[i] ?? ''} aspect="aspect-[4/3]" />)}
                  </div>
                </div>
                {/* Plans */}
                <div className="bg-[#0a0806] px-6 py-5">
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-3">Travel Plans</div>
                  <div className="grid grid-cols-3 gap-2">
                    {layoutPlans.filter((p) => p.visible).slice(0, 3).map((p) => (
                      <div key={p.id} className="bg-white/5 overflow-hidden rounded-sm">
                        <ImgBox url={p.coverImage} aspect="aspect-[4/3]" />
                        <div className="p-2">
                          <div className="text-white/70 text-[8px] font-display uppercase tracking-widest truncate">{p.titleEn || p.id}</div>
                          <div className="text-gold/60 text-[8px] font-display">{p.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Surroundings */}
                <div className="bg-[#0d0b09] px-6 py-5">
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-3">Surroundings</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 1, 2, 3].map((i) => <ImgBox key={i} url={srndUrls[i] ?? ''} aspect="aspect-[4/3]" />)}
                  </div>
                </div>
              </div>
            );
          }

          /* ── PLANS LIST ── */
          if (layoutPage === 'plans-list') return (
            <div className="bg-[#0a0806] rounded overflow-hidden p-4">
              <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-3">Travel Plans</div>
              <div className="grid grid-cols-3 gap-2">
                {layoutPlans.map((p) => (
                  <div key={p.id} className={`bg-white/5 overflow-hidden rounded-sm ${!p.visible ? 'opacity-40' : ''}`}>
                    <ImgBox url={p.coverImage} aspect="aspect-[4/3]" />
                    <div className="p-2">
                      <div className="text-white/70 text-[8px] font-display uppercase tracking-widest truncate">{p.titleEn || p.id}</div>
                      <div className="text-gold/60 text-[8px] font-display">{p.price}</div>
                      {!p.visible && <div className="text-white/25 text-[7px] font-display uppercase">hidden</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

          /* ── GALLERY ── */
          if (layoutPage === 'gallery') {
            const hotelUrls = lay['gallery.hotel'] ?? [];
            const srndUrls  = lay['gallery.surroundings'] ?? [];
            return (
              <div className="bg-[#0a0806] rounded overflow-hidden p-4 space-y-4">
                <div>
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-2">Hotel Photos</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {hotelUrls.length > 0 ? hotelUrls.map((url, i) => <ImgBox key={i} url={url} aspect="aspect-[4/3]" />) : <ImgBox url="" aspect="aspect-[4/3]" className="col-span-4" />}
                  </div>
                </div>
                <div>
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-2">Surroundings</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {srndUrls.length > 0 ? srndUrls.map((url, i) => <ImgBox key={i} url={url} aspect="aspect-[4/3]" />) : <ImgBox url="" aspect="aspect-[4/3]" className="col-span-4" />}
                  </div>
                </div>
              </div>
            );
          }

          /* ── PLAN DETAIL ── */
          if (layoutPage.startsWith('plan-')) {
            const planId = layoutPage.replace('plan-', '');
            const plan   = layoutPlans.find((p) => p.id === planId);
            if (!plan) return <div className="text-white/20 text-sm font-kaiti italic text-center py-8">Plan not found.</div>;
            const galleryUrls = lay[`plan.${planId}.gallery`] ?? [];
            return (
              <div className="bg-[#0a0806] rounded overflow-hidden">
                <ImgBox url={plan.coverImage} aspect="aspect-[16/7]" className="w-full" />
                <div className="p-4">
                  <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-1">{plan.tagEn || 'Plan'}</div>
                  <div className="text-white/80 font-serif text-sm mb-3">{plan.titleEn || plan.id}</div>
                  <div className="text-gold/70 text-[8px] font-display mb-4">{plan.price} · {plan.duration} days</div>
                  {galleryUrls.length > 0 && (
                    <div>
                      <div className="text-[7px] font-display text-gold/60 uppercase tracking-[0.4em] mb-2">Photo Gallery</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {galleryUrls.slice(0, 8).map((url, i) => <ImgBox key={i} url={url} aspect="aspect-[4/3]" />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        };

        return (
          <div className="fixed inset-0 bg-black/90 z-[300] flex items-start justify-center overflow-y-auto py-4 sm:py-8 px-3 sm:px-4">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <h2 className="font-display text-gold text-sm uppercase tracking-widest">Preview</h2>
                  <p className="text-white/30 text-[9px] font-display uppercase tracking-widest mt-0.5">
                    {pageLabelMap[layoutPage] ?? layoutPage} — {changeCount} 件の変更（未反映）
                  </p>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
              </div>
              <div className="p-4">{renderPreview()}</div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                <button onClick={() => { handleDiscardDraft(); setShowPreviewModal(false); }}
                  className="px-5 py-2 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 font-display text-xs uppercase tracking-widest transition-all">
                  破棄
                </button>
                <button onClick={() => setShowPreviewModal(false)}
                  className="px-5 py-2 border border-white/20 text-white/60 hover:text-white font-display text-xs uppercase tracking-widest transition-all">
                  編集に戻る
                </button>
                <button onClick={handlePublish} disabled={isPublishing}
                  className="px-8 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                  {isPublishing ? '反映中...' : '反映する'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

        {/* ══════════════════ SURROUNDINGS TAB ══════════════════ */}
        {activeTab === 'surroundings' && (() => {
          const CATS = ['nature', 'culture', 'gourmet', 'shopping', 'activity'] as const;
          const CAT_LABEL: Record<string, string> = {
            nature: 'Nature', culture: 'Culture', gourmet: 'Gourmet',
            shopping: 'Shopping', activity: 'Activity',
          };

          const handleVisibleToggle = async (spot: SurroundingSpot) => {
            const next = !spot.visible;
            setSurroundingSpots((prev) => prev.map((s) => s.id === spot.id ? { ...s, visible: next } : s));
            await fetch(apiBase + `/surroundings/${spot.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ visible: next }),
            });
          };

          const handleDelete = async (id: string) => {
            if (!confirm('このスポットを削除しますか？')) return;
            await fetch(apiBase + `/surroundings/${id}`, { method: 'DELETE' });
            setSurroundingSpots((prev) => prev.filter((s) => s.id !== id));
            if (surroundingEditId === id) setSurroundingEditId(null);
          };

          const openEdit = (spot: SurroundingSpot) => {
            setSurroundingForm({ ...spot });
            setSurroundingEditId(spot.id);
            setSurroundingImagePickerOpen(false);
          };

          const openNew = () => {
            setSurroundingForm({ ...blankSpot(), sortOrder: surroundingSpots.length });
            setSurroundingEditId('new');
            setSurroundingImagePickerOpen(false);
          };

          const handleSave = async () => {
            if (!surroundingForm.id.trim()) {
              setMessage({ type: 'error', text: 'ID is required.' });
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            setSurroundingSaving(true);
            try {
              const res = await fetch(apiBase + '/surroundings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surroundingForm),
              });
              if (res.ok) {
                const refreshed = await fetch(apiBase + '/surroundings?admin=1').then((r) => r.json());
                setSurroundingSpots(refreshed);
                setSurroundingEditId(null);
                setMessage({ type: 'success', text: 'Saved.' });
              } else {
                setMessage({ type: 'error', text: 'Save failed.' });
              }
            } catch {
              setMessage({ type: 'error', text: 'Save failed.' });
            } finally {
              setSurroundingSaving(false);
              setTimeout(() => setMessage(null), 3000);
            }
          };

          const sf = surroundingForm;
          const setSf = (patch: Partial<SurroundingSpot>) => setSurroundingForm((p) => ({ ...p, ...patch }));

          const tagsInput = (lang: 'Zh' | 'Ja' | 'En') => {
            const key = `tags${lang}` as 'tagsZh' | 'tagsJa' | 'tagsEn';
            return (
              <div className="flex flex-col gap-1">
                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">
                  Tags ({lang}) — comma separated
                </label>
                <input
                  type="text"
                  value={sf[key].join(', ')}
                  onChange={(e) => setSf({ [key]: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40"
                />
              </div>
            );
          };

          return (
            <div className="space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-gold text-xs uppercase tracking-widest">
                  Surroundings Spots ({surroundingSpots.length})
                </h3>
                <button
                  onClick={openNew}
                  className="px-4 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors"
                >
                  + Add Spot
                </button>
              </div>

              {surroundingLoading ? (
                <p className="text-white/30 text-xs font-display uppercase tracking-widest">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {surroundingSpots.map((spot) => (
                    <div key={spot.id} className="border border-white/10 bg-white/2">
                      {/* Row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Thumbnail */}
                        <div className="w-14 h-10 flex-shrink-0 border border-white/10 overflow-hidden bg-white/5">
                          {spot.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={spot.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white/10 text-[8px]">no img</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-white/80 text-sm truncate">{spot.nameJa || spot.nameEn}</p>
                          <p className="font-display text-[10px] text-gold/50 uppercase tracking-widest">
                            {CAT_LABEL[spot.category]} · {spot.distance}min
                          </p>
                        </div>

                        {/* Visibility toggle */}
                        <button
                          type="button"
                          onClick={() => handleVisibleToggle(spot)}
                          className={`w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${spot.visible ? 'bg-gold' : 'bg-white/10'}`}
                          title={spot.visible ? 'Visible' : 'Hidden'}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${spot.visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>

                        {/* Edit / Delete */}
                        <button
                          onClick={() => surroundingEditId === spot.id ? setSurroundingEditId(null) : openEdit(spot)}
                          className="font-display text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 transition-colors"
                        >
                          {surroundingEditId === spot.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(spot.id)}
                          className="font-display text-[10px] uppercase tracking-widest text-white/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-3 py-1 transition-colors"
                        >
                          Del
                        </button>
                      </div>

                      {/* Edit panel */}
                      {surroundingEditId === spot.id && (
                        <div className="border-t border-white/10 px-4 py-5 space-y-4 bg-black/20">
                          {/* ID (read-only for existing) */}
                          <div className="flex flex-col gap-1">
                            <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">ID (read-only)</label>
                            <input type="text" value={sf.id} readOnly className="bg-white/5 border border-white/5 px-3 py-2 text-sm text-white/30 font-display" />
                          </div>
                          {/* Category + Distance */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Category</label>
                              <select value={sf.category} onChange={(e) => setSf({ category: e.target.value })}
                                className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40">
                                {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Distance (min)</label>
                              <input type="number" value={sf.distance} onChange={(e) => setSf({ distance: Number(e.target.value) })}
                                className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                            </div>
                          </div>
                          {/* Names */}
                          {(['Zh', 'Ja', 'En'] as const).map((l) => (
                            <div key={l} className="flex flex-col gap-1">
                              <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Name ({l})</label>
                              <input type="text" value={sf[`name${l}`]} onChange={(e) => setSf({ [`name${l}`]: e.target.value })}
                                className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                            </div>
                          ))}
                          {/* Descriptions */}
                          {(['Zh', 'Ja', 'En'] as const).map((l) => (
                            <div key={l} className="flex flex-col gap-1">
                              <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Description ({l})</label>
                              <textarea rows={3} value={sf[`description${l}`]} onChange={(e) => setSf({ [`description${l}`]: e.target.value })}
                                className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 resize-none w-full" />
                            </div>
                          ))}
                          {/* Tags */}
                          {tagsInput('Zh')}{tagsInput('Ja')}{tagsInput('En')}
                          {/* Image */}
                          <div className="flex flex-col gap-2">
                            <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Image</label>
                            {sf.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={sf.imageUrl} alt="" className="w-24 h-16 object-cover border border-white/10" />
                            )}
                            <button type="button" onClick={() => setSurroundingImagePickerOpen(!surroundingImagePickerOpen)}
                              className="text-[10px] font-display uppercase tracking-widest text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 transition-colors self-start">
                              {sf.imageUrl ? 'Change Image' : 'Select Image'}
                            </button>
                            {surroundingImagePickerOpen && (
                              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border border-white/10 p-2 bg-black/40">
                                {files.filter((f) => f.type === 'image').map((f) => (
                                  <button key={f.id} type="button"
                                    onClick={() => { setSf({ imageUrl: f.url }); setSurroundingImagePickerOpen(false); }}
                                    className={`aspect-square border transition-all ${f.url === sf.imageUrl ? 'border-gold' : 'border-white/10 hover:border-gold/40'}`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Sort order */}
                          <div className="flex flex-col gap-1">
                            <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Sort Order</label>
                            <input type="number" value={sf.sortOrder} onChange={(e) => setSf({ sortOrder: Number(e.target.value) })}
                              className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 w-24" />
                          </div>
                          {/* Save */}
                          <button onClick={handleSave} disabled={surroundingSaving}
                            className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                            {surroundingSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New spot form */}
              {surroundingEditId === 'new' && (
                <div className="border border-gold/20 bg-black/20 p-5 space-y-4">
                  <h4 className="font-display text-gold text-xs uppercase tracking-widest">New Spot</h4>
                  {/* ID */}
                  <div className="flex flex-col gap-1">
                    <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">ID (unique slug)</label>
                    <input type="text" value={sf.id} onChange={(e) => setSf({ id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g. new-spot-name"
                      className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                  </div>
                  {/* Category + Distance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Category</label>
                      <select value={sf.category} onChange={(e) => setSf({ category: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40">
                        {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Distance (min)</label>
                      <input type="number" value={sf.distance} onChange={(e) => setSf({ distance: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                  </div>
                  {/* Names */}
                  {(['Zh', 'Ja', 'En'] as const).map((l) => (
                    <div key={l} className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Name ({l})</label>
                      <input type="text" value={sf[`name${l}`]} onChange={(e) => setSf({ [`name${l}`]: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                  ))}
                  {/* Descriptions */}
                  {(['Zh', 'Ja', 'En'] as const).map((l) => (
                    <div key={l} className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Description ({l})</label>
                      <textarea rows={3} value={sf[`description${l}`]} onChange={(e) => setSf({ [`description${l}`]: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 resize-none w-full" />
                    </div>
                  ))}
                  {tagsInput('Zh')}{tagsInput('Ja')}{tagsInput('En')}
                  {/* Image */}
                  <div className="flex flex-col gap-2">
                    <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Image</label>
                    {sf.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sf.imageUrl} alt="" className="w-24 h-16 object-cover border border-white/10" />
                    )}
                    <button type="button" onClick={() => setSurroundingImagePickerOpen(!surroundingImagePickerOpen)}
                      className="text-[10px] font-display uppercase tracking-widest text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 transition-colors self-start">
                      {sf.imageUrl ? 'Change Image' : 'Select Image'}
                    </button>
                    {surroundingImagePickerOpen && (
                      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border border-white/10 p-2 bg-black/40">
                        {files.filter((f) => f.type === 'image').map((f) => (
                          <button key={f.id} type="button"
                            onClick={() => { setSf({ imageUrl: f.url }); setSurroundingImagePickerOpen(false); }}
                            className={`aspect-square border transition-all ${f.url === sf.imageUrl ? 'border-gold' : 'border-white/10 hover:border-gold/40'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={surroundingSaving}
                      className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                      {surroundingSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setSurroundingEditId(null)}
                      className="px-5 py-2.5 border border-white/10 text-white/40 hover:text-white font-display text-xs uppercase tracking-widest transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════════════ CONTACT TAB ══════════════════ */}
        {activeTab === 'contact' && (() => {
          const field = (label: string, value: string, onChange: (v: string) => void, placeholder = '') => (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display tracking-wide focus:outline-none focus:border-gold/40 w-full"
              />
            </div>
          );

          const toggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${checked ? 'bg-gold' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="font-display text-[10px] uppercase tracking-widest text-white/40">{label} {checked ? 'Visible' : 'Hidden'}</span>
            </div>
          );

          const qrPicker = (ctx: 'line' | 'wechat', currentUrl: string) => (
            <div className="space-y-2">
              {currentUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUrl} alt="QR" className="w-24 h-24 object-contain border border-white/10" />
              )}
              <button
                type="button"
                onClick={() => setContactImagePickerFor(contactImagePickerFor === ctx ? null : ctx)}
                className="text-[10px] font-display uppercase tracking-widest text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 transition-colors"
              >
                {currentUrl ? 'Change QR Image' : 'Select QR Image'}
              </button>
              {contactImagePickerFor === ctx && (
                <div className="mt-2 grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-white/10 p-2 bg-black/40">
                  {files.filter((f) => f.type === 'image').map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setContactForm((prev) => ({
                          ...prev,
                          [ctx === 'line' ? 'lineQrUrl' : 'wechatQrUrl']: f.url,
                        }));
                        setContactImagePickerFor(null);
                      }}
                      className={`aspect-square border transition-all ${f.url === currentUrl ? 'border-gold' : 'border-white/10 hover:border-gold/40'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );

          const handleContactSave = async () => {
            setContactSaving(true);
            try {
              const res = await fetch(apiBase + '/contact', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm),
              });
              if (res.ok) {
                setMessage({ type: 'success', text: 'Contact info saved.' });
              } else {
                setMessage({ type: 'error', text: 'Save failed.' });
              }
            } catch {
              setMessage({ type: 'error', text: 'Save failed.' });
            } finally {
              setContactSaving(false);
              setTimeout(() => setMessage(null), 3000);
            }
          };

          return (
            <div className="luxury-card p-6 space-y-8 max-w-lg">
              <h3 className="font-display text-gold text-xs uppercase tracking-widest">Contact Information</h3>

              {contactLoading ? (
                <p className="text-white/30 text-xs font-display uppercase tracking-widest">Loading...</p>
              ) : (
                <>
                  {/* Phone */}
                  <div className="space-y-3 pb-6 border-b border-white/5">
                    <h4 className="font-display text-[10px] uppercase tracking-widest text-white/40">Phone</h4>
                    {field('Number', contactForm.phone, (v) => setContactForm((p) => ({ ...p, phone: v })), '+81-XXX-XXXX-XXXX')}
                    {toggle('Phone', contactForm.phoneVisible, (v) => setContactForm((p) => ({ ...p, phoneVisible: v })))}
                  </div>

                  {/* Email */}
                  <div className="space-y-3 pb-6 border-b border-white/5">
                    <h4 className="font-display text-[10px] uppercase tracking-widest text-white/40">Email</h4>
                    {field('Address', contactForm.email, (v) => setContactForm((p) => ({ ...p, email: v })), 'info@example.com')}
                    {toggle('Email', contactForm.emailVisible, (v) => setContactForm((p) => ({ ...p, emailVisible: v })))}
                  </div>

                  {/* LINE */}
                  <div className="space-y-3 pb-6 border-b border-white/5">
                    <h4 className="font-display text-[10px] uppercase tracking-widest text-white/40">LINE</h4>
                    {field('LINE ID', contactForm.lineId, (v) => setContactForm((p) => ({ ...p, lineId: v })), '@example')}
                    <div className="space-y-1.5">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">QR Code Image</label>
                      {qrPicker('line', contactForm.lineQrUrl)}
                    </div>
                    {toggle('LINE', contactForm.lineVisible, (v) => setContactForm((p) => ({ ...p, lineVisible: v })))}
                  </div>

                  {/* WeChat */}
                  <div className="space-y-3 pb-6 border-b border-white/5">
                    <h4 className="font-display text-[10px] uppercase tracking-widest text-white/40">WeChat</h4>
                    {field('WeChat ID', contactForm.wechatId, (v) => setContactForm((p) => ({ ...p, wechatId: v })), 'wechat_id')}
                    <div className="space-y-1.5">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">QR Code Image</label>
                      {qrPicker('wechat', contactForm.wechatQrUrl)}
                    </div>
                    {toggle('WeChat', contactForm.wechatVisible, (v) => setContactForm((p) => ({ ...p, wechatVisible: v })))}
                  </div>

                  <button
                    onClick={handleContactSave}
                    disabled={contactSaving}
                    className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50"
                  >
                    {contactSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* ══════════════════ SEASONS TAB ══════════════════ */}
        {activeTab === 'seasons' && (() => {
          const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'] as const;
          const SEASON_LABEL: Record<string, string> = {
            spring: '春 Spring', summer: '夏 Summer', autumn: '秋 Autumn', winter: '冬 Winter',
          };

          const setSf = (patch: Partial<SeasonSpotAdmin>) =>
            setSeasonForm((p) => ({ ...p, ...patch }));

          const reloadSeasons = () => {
            setSeasonLoading(true);
            fetch(`${apiBase}/seasons?season=${seasonTab}`)
              .then((r) => r.ok ? r.json() : { spots: [] })
              .then((d) => setSeasonSpots(d.spots ?? []))
              .catch(() => {})
              .finally(() => setSeasonLoading(false));
          };

          const handleActiveToggle = async (spot: SeasonSpotAdmin) => {
            const next = !spot.isActive;
            setSeasonSpots((prev) => prev.map((s) => s.id === spot.id ? { ...s, isActive: next } : s));
            await fetch(`${apiBase}/seasons/${spot.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...spot, isActive: next }),
            });
          };

          const handleDelete = async (id: number) => {
            if (!confirm('このスポットを削除しますか？')) return;
            await fetch(`${apiBase}/seasons/${id}`, { method: 'DELETE' });
            setSeasonSpots((prev) => prev.filter((s) => s.id !== id));
            if (seasonEditId === id) setSeasonEditId(null);
          };

          const handleSave = async () => {
            setSeasonSaving(true);
            try {
              const isNew = seasonForm.id === null;
              const url   = isNew ? `${apiBase}/seasons` : `${apiBase}/seasons/${seasonForm.id}`;
              const method = isNew ? 'POST' : 'PUT';
              const body  = { ...seasonForm, season: isNew ? seasonTab : seasonForm.season };
              const res   = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              if (res.ok) {
                reloadSeasons();
                setSeasonEditId(null);
                showMessage('success', 'Saved.');
              } else {
                showMessage('error', 'Save failed.');
              }
            } catch {
              showMessage('error', 'Save failed.');
            } finally {
              setSeasonSaving(false);
            }
          };

          const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, spotId: number) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSeasonUploading(true);
            try {
              const fd = new FormData();
              fd.append('file', file);
              fd.append('seasonId', String(spotId));
              const res = await fetch(`${apiBase}/seasons/upload`, { method: 'POST', body: fd });
              if (res.ok) {
                // Refresh the spot to show new image
                const updated = await fetch(`${apiBase}/seasons/${spotId}`).then((r) => r.json());
                setSeasonSpots((prev) => prev.map((s) => s.id === spotId ? updated : s));
                if (seasonForm.id === spotId) setSeasonForm(updated);
                showMessage('success', 'Image uploaded.');
              } else {
                showMessage('error', 'Upload failed.');
              }
            } catch {
              showMessage('error', 'Upload failed.');
            } finally {
              setSeasonUploading(false);
              e.target.value = '';
            }
          };

          const handleSetMainImage = async (spotId: number, imgId: number) => {
            await fetch(`${apiBase}/seasons/${spotId}/images/${imgId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isMain: true }),
            });
            const updated = await fetch(`${apiBase}/seasons/${spotId}`).then((r) => r.json());
            setSeasonSpots((prev) => prev.map((s) => s.id === spotId ? updated : s));
            if (seasonForm.id === spotId) setSeasonForm(updated);
          };

          const handleDeleteImage = async (spotId: number, imgId: number) => {
            if (!confirm('画像を削除しますか？')) return;
            await fetch(`${apiBase}/seasons/${spotId}/images/${imgId}`, { method: 'DELETE' });
            const updated = await fetch(`${apiBase}/seasons/${spotId}`).then((r) => r.json());
            setSeasonSpots((prev) => prev.map((s) => s.id === spotId ? updated : s));
            if (seasonForm.id === spotId) setSeasonForm(updated);
          };

          const sf = seasonForm;

          return (
            <div className="space-y-6">
              {/* Season sub-tabs */}
              <div className="flex gap-0 border border-white/10">
                {SEASON_KEYS.map((s) => (
                  <button key={s} onClick={() => { setSeasonTab(s); setSeasonEditId(null); }}
                    className={`flex-1 py-2.5 font-display text-[10px] uppercase tracking-widest transition-colors ${
                      seasonTab === s ? 'bg-gold text-black' : 'text-white/30 hover:text-white/60'
                    }`}>
                    {SEASON_LABEL[s]}
                  </button>
                ))}
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-gold text-xs uppercase tracking-widest">
                  {SEASON_LABEL[seasonTab]} Spots ({seasonSpots.length})
                </h3>
                <button
                  onClick={() => { setSeasonForm({ ...blankSeason(), season: seasonTab }); setSeasonEditId('new'); }}
                  className="px-4 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors"
                >
                  + Add Spot
                </button>
              </div>

              {/* Spot list */}
              {seasonLoading ? (
                <p className="text-white/30 text-xs font-display uppercase tracking-widest">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {seasonSpots.map((spot) => {
                    const mainImg = spot.images.find((i) => i.isMain) ?? spot.images[0] ?? null;
                    return (
                      <div key={spot.id} className="border border-white/10 bg-white/2">
                        {/* Row */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Thumbnail */}
                          <div className="w-14 h-10 flex-shrink-0 border border-white/10 overflow-hidden bg-white/5">
                            {mainImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mainImg.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white/10 text-[8px]">no img</span>
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-white/80 text-sm truncate">
                              {spot.nameJa || spot.nameEn}
                              {spot.isFeatured && (
                                <span className="ml-2 text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 font-display uppercase tracking-widest">Featured</span>
                              )}
                            </p>
                            <p className="font-display text-[10px] text-gold/50 uppercase tracking-widest">
                              {spot.distanceMin}min · {spot.images.length} images
                            </p>
                          </div>
                          {/* Active toggle */}
                          <button type="button" onClick={() => handleActiveToggle(spot)}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${spot.isActive ? 'bg-gold' : 'bg-white/10'}`}
                            title={spot.isActive ? 'Active' : 'Hidden'}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${spot.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                          {/* Edit / Delete */}
                          <button
                            onClick={() => { if (seasonEditId === spot.id) { setSeasonEditId(null); } else { setSeasonForm({ ...spot }); setSeasonEditId(spot.id!); } }}
                            className="font-display text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1 transition-colors">
                            {seasonEditId === spot.id ? 'Close' : 'Edit'}
                          </button>
                          <button onClick={() => handleDelete(spot.id!)}
                            className="font-display text-[10px] uppercase tracking-widest text-white/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-3 py-1 transition-colors">
                            Del
                          </button>
                        </div>

                        {/* Edit panel */}
                        {seasonEditId === spot.id && (
                          <div className="border-t border-white/10 px-4 py-5 space-y-4 bg-black/20">
                            {/* Season + Distance + Order */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Season</label>
                                <select value={sf.season} onChange={(e) => setSf({ season: e.target.value as any })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40">
                                  {SEASON_KEYS.map((s) => <option key={s} value={s}>{SEASON_LABEL[s]}</option>)}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Distance (min)</label>
                                <input type="number" value={sf.distanceMin} onChange={(e) => setSf({ distanceMin: Number(e.target.value) })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Order</label>
                                <input type="number" value={sf.displayOrder} onChange={(e) => setSf({ displayOrder: Number(e.target.value) })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                              </div>
                            </div>
                            {/* Featured toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={sf.isFeatured} onChange={(e) => setSf({ isFeatured: e.target.checked })}
                                className="w-4 h-4 accent-yellow-500" />
                              <span className="font-display text-[10px] uppercase tracking-widest text-gold/60">Featured (大カード表示)</span>
                            </label>
                            {/* Names */}
                            {(['Zh', 'Ja', 'En'] as const).map((l) => (
                              <div key={l} className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Name ({l})</label>
                                <input type="text" value={sf[`name${l}`]} onChange={(e) => setSf({ [`name${l}`]: e.target.value })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                              </div>
                            ))}
                            {/* Descriptions */}
                            {(['Zh', 'Ja', 'En'] as const).map((l) => (
                              <div key={l} className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Description ({l})</label>
                                <textarea rows={3} value={sf[`desc${l}`]} onChange={(e) => setSf({ [`desc${l}`]: e.target.value })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 resize-none w-full" />
                              </div>
                            ))}
                            {/* Access */}
                            {(['Zh', 'Ja', 'En'] as const).map((l) => (
                              <div key={l} className="flex flex-col gap-1">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Access ({l})</label>
                                <input type="text" value={sf[`access${l}`]} onChange={(e) => setSf({ [`access${l}`]: e.target.value })}
                                  className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                              </div>
                            ))}
                            {/* Save */}
                            <button onClick={handleSave} disabled={seasonSaving}
                              className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                              {seasonSaving ? 'Saving...' : 'Save'}
                            </button>

                            {/* ── Image management ── */}
                            <div className="pt-4 border-t border-white/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">
                                  Images ({spot.images.length})
                                </label>
                                <label className={`cursor-pointer px-3 py-1 border border-gold/30 font-display text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold hover:border-gold/60 transition-colors ${seasonUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {seasonUploading ? 'Uploading...' : '+ Upload Image'}
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleImageUpload(e, spot.id!)} />
                                </label>
                              </div>
                              {spot.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                  {spot.images.map((img) => (
                                    <div key={img.id} className={`relative aspect-square border overflow-hidden ${img.isMain ? 'border-gold' : 'border-white/10'}`}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        {!img.isMain && (
                                          <button onClick={() => handleSetMainImage(spot.id!, img.id)}
                                            className="text-[8px] font-display uppercase tracking-widest bg-gold text-black px-2 py-0.5">
                                            Set Main
                                          </button>
                                        )}
                                        {img.isMain && (
                                          <span className="text-[8px] font-display uppercase tracking-widest text-gold">✓ Main</span>
                                        )}
                                        <button onClick={() => handleDeleteImage(spot.id!, img.id)}
                                          className="text-[8px] font-display uppercase tracking-widest text-red-400 border border-red-500/30 px-2 py-0.5">
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New spot form */}
              {seasonEditId === 'new' && (
                <div className="border border-gold/20 bg-black/20 p-5 space-y-4">
                  <h4 className="font-display text-gold text-xs uppercase tracking-widest">New Spot — {SEASON_LABEL[seasonTab]}</h4>
                  {/* Season + Distance + Order */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Season</label>
                      <select value={sf.season} onChange={(e) => setSf({ season: e.target.value as any })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40">
                        {SEASON_KEYS.map((s) => <option key={s} value={s}>{SEASON_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Distance (min)</label>
                      <input type="number" value={sf.distanceMin} onChange={(e) => setSf({ distanceMin: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Order</label>
                      <input type="number" value={sf.displayOrder} onChange={(e) => setSf({ displayOrder: Number(e.target.value) })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                  </div>
                  {/* Featured */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={sf.isFeatured} onChange={(e) => setSf({ isFeatured: e.target.checked })}
                      className="w-4 h-4 accent-yellow-500" />
                    <span className="font-display text-[10px] uppercase tracking-widest text-gold/60">Featured (大カード表示)</span>
                  </label>
                  {/* Names */}
                  {(['Zh', 'Ja', 'En'] as const).map((l) => (
                    <div key={l} className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Name ({l})</label>
                      <input type="text" value={sf[`name${l}`]} onChange={(e) => setSf({ [`name${l}`]: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                  ))}
                  {/* Descriptions */}
                  {(['Zh', 'Ja', 'En'] as const).map((l) => (
                    <div key={l} className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Description ({l})</label>
                      <textarea rows={3} value={sf[`desc${l}`]} onChange={(e) => setSf({ [`desc${l}`]: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 resize-none w-full" />
                    </div>
                  ))}
                  {/* Access */}
                  {(['Zh', 'Ja', 'En'] as const).map((l) => (
                    <div key={l} className="flex flex-col gap-1">
                      <label className="font-display text-[10px] uppercase tracking-widest text-gold/60">Access ({l})</label>
                      <input type="text" value={sf[`access${l}`]} onChange={(e) => setSf({ [`access${l}`]: e.target.value })}
                        className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40" />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={seasonSaving}
                      className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                      {seasonSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setSeasonEditId(null)}
                      className="px-4 py-2.5 border border-white/10 font-display text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ===== ANNOUNCEMENTS TAB ===== */}
        {activeTab === 'announcements' && (() => {
          const isNow = (a: AnnouncementItem) => {
            const now = new Date();
            return a.isActive && new Date(a.startsAt) <= now && (a.endsAt === null || new Date(a.endsAt) >= now);
          };

          const handleToggleActive = async (a: AnnouncementItem) => {
            await fetch(`${apiBase}/admin/announcements/${a.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !a.isActive }),
            });
            setAnnouncements((prev) => prev.map((x) => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
          };

          const handleDelete = async (id: number) => {
            if (!confirm('Delete this announcement?')) return;
            await fetch(`${apiBase}/admin/announcements/${id}`, { method: 'DELETE' });
            setAnnouncements((prev) => prev.filter((x) => x.id !== id));
            if (announcementEditId === id) setAnnouncementEditId(null);
          };

          const handleSave = async () => {
            setAnnouncementSaving(true);
            try {
              if (announcementEditId === 'new') {
                const res = await fetch(`${apiBase}/admin/announcements`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(announcementForm),
                });
                const created = await res.json();
                setAnnouncements((prev) => [created, ...prev]);
              } else if (announcementEditId !== null) {
                const res = await fetch(`${apiBase}/admin/announcements/${announcementEditId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(announcementForm),
                });
                const updated = await res.json();
                setAnnouncements((prev) => prev.map((x) => x.id === announcementEditId ? updated : x));
              }
              setAnnouncementEditId(null);
            } catch (e) { console.error(e); }
            setAnnouncementSaving(false);
          };

          const af = announcementForm;
          const setAf = (patch: Partial<typeof announcementForm>) =>
            setAnnouncementForm((p) => ({ ...p, ...patch }));

          const previewMsg = announcementPreviewLang === 'cn' ? af.messageCn
            : announcementPreviewLang === 'ja' ? af.messageJa
            : af.messageEn;
          const previewImportant = af.styleVariant === 'important';
          const previewBg = previewImportant ? '#3a2a05' : '#161510';
          const previewClr = previewImportant ? '#faf0d0' : '#faf8f2';
          const previewDuration = Math.min(40, Math.max(8, (previewMsg || ' ').length / (af.scrollSpeed || 30) * 10));

          return (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-xl uppercase tracking-widest text-gold">Announcements</h2>
                <button
                  onClick={() => { setAnnouncementForm(blankAnnouncement()); setAnnouncementEditId('new'); }}
                  className="px-6 py-2 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors"
                >
                  + New
                </button>
              </div>

              {announcementLoading ? (
                <p className="text-white/30 font-display text-sm">Loading...</p>
              ) : (
                <div className="space-y-3 mb-10">
                  {announcements.length === 0 && (
                    <p className="text-white/20 font-display text-sm">No announcements yet.</p>
                  )}
                  {announcements.map((a) => {
                    const active = isNow(a);
                    return (
                      <div key={a.id}
                        className="border border-white/10 p-4 flex items-start gap-4"
                        style={active ? { borderLeftColor: '#c9a96e', borderLeftWidth: 3 } : undefined}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`font-display text-[10px] uppercase tracking-widest px-2 py-0.5 ${a.styleVariant === 'important' ? 'bg-amber-700/60 text-amber-200' : 'bg-white/10 text-white/40'}`}>
                              {a.styleVariant}
                            </span>
                            {active && <span className="font-display text-[10px] text-gold uppercase tracking-widest">● Live</span>}
                            {!a.isActive && <span className="font-display text-[10px] text-white/30 uppercase tracking-widest">Disabled</span>}
                          </div>
                          <p className="text-white/70 text-sm truncate">{a.messageJa || a.messageCn || a.messageEn}</p>
                          <p className="text-white/20 text-[11px] mt-1 font-display">
                            {a.startsAt?.slice(0, 16)} → {a.endsAt?.slice(0, 16) ?? '∞'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(a)}
                            className="font-display text-[10px] uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 hover:text-gold transition-colors"
                          >
                            {a.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setAnnouncementForm({
                                messageCn: a.messageCn, messageJa: a.messageJa, messageEn: a.messageEn,
                                startsAt: a.startsAt?.slice(0, 16) ?? '',
                                endsAt: a.endsAt?.slice(0, 16) ?? null,
                                isActive: a.isActive, styleVariant: a.styleVariant, scrollSpeed: a.scrollSpeed,
                              });
                              setAnnouncementEditId(a.id);
                            }}
                            className="font-display text-[10px] uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 hover:text-gold transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="font-display text-[10px] uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Form */}
              {announcementEditId !== null && (
                <div className="border border-gold/20 p-6">
                  <h3 className="font-display text-sm uppercase tracking-widest text-gold mb-6">
                    {announcementEditId === 'new' ? 'New Announcement' : 'Edit Announcement'}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {(['ja', 'cn', 'en'] as const).map((lang) => {
                      const key = lang === 'ja' ? 'messageJa' : lang === 'cn' ? 'messageCn' : 'messageEn';
                      const label = lang === 'ja' ? 'Message (Japanese)' : lang === 'cn' ? 'Message (Chinese)' : 'Message (English)';
                      return (
                        <div key={lang}>
                          <label className="font-display text-[10px] uppercase tracking-widest text-gold/60 block mb-1">{label}</label>
                          <textarea rows={2} value={(af as any)[key]}
                            onChange={(e) => setAf({ [key]: e.target.value } as any)}
                            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40 resize-none"
                          />
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-display text-[10px] uppercase tracking-widest text-gold/60 block mb-1">Starts At</label>
                        <input type="datetime-local" value={af.startsAt}
                          onChange={(e) => setAf({ startsAt: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40"
                        />
                      </div>
                      <div>
                        <label className="font-display text-[10px] uppercase tracking-widest text-gold/60 block mb-1">Ends At (optional)</label>
                        <input type="datetime-local" value={af.endsAt ?? ''}
                          onChange={(e) => setAf({ endsAt: e.target.value || null })}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="font-display text-[10px] uppercase tracking-widest text-gold/60 block mb-1">Style</label>
                        <select value={af.styleVariant} onChange={(e) => setAf({ styleVariant: e.target.value as 'default' | 'important' })}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40">
                          <option value="default">Default (Gold line)</option>
                          <option value="important">Important (Amber)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-display text-[10px] uppercase tracking-widest text-gold/60 block mb-1">Scroll Speed (1–100)</label>
                        <input type="number" min={1} max={100} value={af.scrollSpeed}
                          onChange={(e) => setAf({ scrollSpeed: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 font-display focus:outline-none focus:border-gold/40"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={af.isActive} onChange={(e) => setAf({ isActive: e.target.checked })}
                            className="accent-gold" />
                          <span className="font-display text-[10px] uppercase tracking-widest text-white/60">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display text-[10px] uppercase tracking-widest text-white/30">Preview:</span>
                      {(['ja', 'cn', 'en'] as const).map((l) => (
                        <button key={l} onClick={() => setAnnouncementPreviewLang(l)}
                          className={`font-display text-[10px] uppercase tracking-widest px-2 py-0.5 transition-colors ${announcementPreviewLang === l ? 'text-gold border-b border-gold' : 'text-white/30'}`}>
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div style={{ background: previewBg, height: 38, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                      <div style={{ flexShrink: 0, width: previewImportant ? 8 : 3, height: '100%', background: '#c9a96e' }} />
                      <div style={{ flex: 1, overflow: 'hidden', padding: '0 14px' }}>
                        <div style={{
                          display: 'inline-block', whiteSpace: 'nowrap',
                          animation: `banner-scroll ${previewDuration}s linear infinite`,
                          paddingLeft: '100%', fontSize: 13, color: previewClr, letterSpacing: '0.04em',
                        }}>
                          {previewMsg || '(no message)'}
                        </div>
                      </div>
                      <style>{`@keyframes banner-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }`}</style>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={announcementSaving}
                      className="px-8 py-2.5 bg-gold text-black font-display text-xs uppercase tracking-widest hover:bg-gold/80 transition-colors disabled:opacity-50">
                      {announcementSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setAnnouncementEditId(null)}
                      className="px-4 py-2.5 border border-white/10 font-display text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
