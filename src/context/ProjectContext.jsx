import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { buildUnits, mockData, uid } from './mockData';

const ProjectContext = createContext(null);

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used inside <ProjectProvider>');
  return ctx;
}

const TABLES = ['projects', 'buildings', 'units', 'subscribers', 'invoices', 'progress_photos'];

export function ProjectProvider({ children }) {
  // State keeps the same flat, snake_case shape as the SQL schema.
  const [db, setDb] = useState(mockData);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [activeProjectId, setActiveProjectId] = useState(mockData.projects[0]?.id ?? null);
  const [activeBuildingId, setActiveBuildingId] = useState(mockData.buildings[0]?.id ?? null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // Load from Supabase when configured; keep mock data if it is empty or fails.
  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(TABLES.map((t) => supabase.from(t).select('*')));
        const failed = results.find((r) => r.error);
        if (failed) throw failed.error;
        const [projects, buildings, units, subscribers, invoices, photos] = results.map((r) => r.data);
        if (!cancelled && projects.length) {
          setDb({ projects, buildings, units, subscribers, invoices, photos });
          setActiveProjectId(projects[0].id);
          setActiveBuildingId(buildings.find((b) => b.project_id === projects[0].id)?.id ?? null);
        }
      } catch (err) {
        console.warn('تعذّر الاتصال بـ Supabase، سيتم استخدام البيانات التجريبية.', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fire-and-forget persistence (no-op without Supabase).
  const sync = useCallback(async (table, rows) => {
    if (!supabase) return;
    const list = Array.isArray(rows) ? rows : [rows];
    const { error } = await supabase.from(table).upsert(list);
    if (error) console.error(`Supabase upsert failed (${table})`, error);
  }, []);

  const selectProject = (id) => {
    setActiveProjectId(id);
    setActiveBuildingId(db.buildings.find((b) => b.project_id === id)?.id ?? null);
  };

  // ---------- Projects ----------
  const addProject = ({ name, description, buildings }) => {
    const project = { id: uid(), name, description, status: 'active', created_at: new Date().toISOString() };
    const newBuildings = [];
    const newUnits = [];
    buildings.forEach((b) => {
      const building = { id: uid(), project_id: project.id, name: b.name, floors: Number(b.floors) };
      newBuildings.push(building);
      newUnits.push(
        ...buildUnits(building.id, building.floors, Number(b.unitsPerFloor), {
          area: Number(b.area),
          land_cost: Number(b.land_cost),
          construction_cost: Number(b.construction_cost),
        })
      );
    });
    setDb((d) => ({
      ...d,
      projects: [project, ...d.projects],
      buildings: [...d.buildings, ...newBuildings],
      units: [...d.units, ...newUnits],
    }));
    setActiveProjectId(project.id);
    setActiveBuildingId(newBuildings[0]?.id ?? null);
    // Sequential to respect foreign keys.
    sync('projects', project).then(() => sync('buildings', newBuildings)).then(() => sync('units', newUnits));
    return project;
  };

  const archiveProject = (id) => {
    setDb((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? { ...p, status: 'archived' } : p)) }));
    sync('projects', { ...db.projects.find((p) => p.id === id), status: 'archived' });
  };

  // ---------- Gallery ----------
  const addPhotos = (items) => {
    const rows = items.map((p) => ({ id: uid(), created_at: new Date().toISOString(), ...p }));
    setDb((d) => ({ ...d, photos: [...d.photos, ...rows] }));
    sync('progress_photos', rows);
  };

  const removePhoto = async (id) => {
    setDb((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }));
    if (supabase) await supabase.from('progress_photos').delete().eq('id', id);
  };

  // ---------- Invoices ----------
  const addInvoice = (data) => {
    const invoice = { id: uid(), building_id: null, image_url: null, ...data, amount: Number(data.amount) };
    setDb((d) => ({ ...d, invoices: [invoice, ...d.invoices] }));
    sync('invoices', invoice);
    return invoice;
  };

  // ---------- Subscribers ----------
  const addSubscriber = ({ name, phone, unit_id }) => {
    const subscriber = {
      id: uid(),
      name,
      phone,
      unit_id,
      onboarding_token: uid(),
      contract_url: null,
      created_at: new Date().toISOString(),
    };
    setDb((d) => ({
      ...d,
      subscribers: [subscriber, ...d.subscribers],
      units: d.units.map((u) => (u.id === unit_id ? { ...u, status: 'reserved' } : u)),
    }));
    const unit = db.units.find((u) => u.id === unit_id);
    sync('subscribers', subscriber);
    if (unit) sync('units', { ...unit, status: 'reserved' });
    return subscriber;
  };

  const attachContract = (subscriberId, url) => {
    setDb((d) => ({ ...d, subscribers: d.subscribers.map((s) => (s.id === subscriberId ? { ...s, contract_url: url } : s)) }));
    const sub = db.subscribers.find((s) => s.id === subscriberId);
    if (sub) sync('subscribers', { ...sub, contract_url: url });
  };

  // ---------- Derived helpers ----------
  const getUnitContext = (unitId) => {
    const unit = db.units.find((u) => u.id === unitId);
    const building = unit && db.buildings.find((b) => b.id === unit.building_id);
    const project = building && db.projects.find((p) => p.id === building.project_id);
    return unit && building && project ? { unit, building, project } : null;
  };

  /** Splits an invoice equally across the units of its building (or of the whole project). */
  const invoiceShare = (invoice) => {
    const buildingIds = invoice.building_id
      ? [invoice.building_id]
      : db.buildings.filter((b) => b.project_id === invoice.project_id).map((b) => b.id);
    const count = db.units.filter((u) => buildingIds.includes(u.building_id)).length;
    return { count, share: count ? Number(invoice.amount) / count : 0 };
  };

  const unitInvoices = (unitId) => {
    const ctx = getUnitContext(unitId);
    if (!ctx) return [];
    return db.invoices
      .filter((inv) =>
        inv.building_id ? inv.building_id === ctx.building.id : inv.project_id === ctx.project.id
      )
      .sort((a, b) => new Date(a.invoice_date) - new Date(b.invoice_date))
      .map((inv) => ({ ...inv, share: invoiceShare(inv).share }));
  };

  const value = {
    db,
    loading,
    activeProjectId,
    activeBuildingId,
    setActiveBuildingId,
    selectProject,
    selectedUnitId,
    selectUnit: setSelectedUnitId,
    closeUnit: () => setSelectedUnitId(null),
    addProject,
    archiveProject,
    addPhotos,
    removePhoto,
    addInvoice,
    addSubscriber,
    attachContract,
    getUnitContext,
    invoiceShare,
    unitInvoices,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
