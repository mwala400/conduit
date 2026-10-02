const STORAGE_KEY = 'conduit.local_entities';
const listeners = new Map();

const safeRead = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const safeWrite = (next) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore localStorage write errors in restricted browsers
  }
};

const nowIso = () => new Date().toISOString();

const uid = (prefix) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const applySort = (items, sortField) => {
  if (!items || !items.length || !sortField) return items;
  const desc = sortField.startsWith('-');
  const field = desc ? sortField.slice(1) : sortField;
  return [...items].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * (desc ? -1 : 1);
    }
    if (av == null) return 1;
    if (bv == null) return -1;
    const textA = String(av).toLowerCase();
    const textB = String(bv).toLowerCase();
    return textA.localeCompare(textB) * (desc ? -1 : 1);
  });
};

const seedEntities = {
  Device: [],
  Transfer: [],
  Server: [],
  TransferTemplate: [],
};

const ensureStore = (entityName) => {
  const store = safeRead();
  if (!store[entityName]) {
    store[entityName] = [...(seedEntities[entityName] || [])];
    safeWrite(store);
  }
  return store;
};

const getEntityItems = (entityName) => {
  const store = ensureStore(entityName);
  return [...(store[entityName] || [])];
};

const setEntityItems = (entityName, items) => {
  const store = safeRead();
  store[entityName] = items;
  safeWrite(store);
  return items;
};

const emit = (entityName, eventType, item) => {
  const handlers = listeners.get(`${entityName}:${eventType}`) || [];
  handlers.forEach((handler) => handler({ type: eventType, data: item }));
  const allHandlers = listeners.get(`${entityName}:*`) || [];
  allHandlers.forEach((handler) => handler({ type: eventType, data: item }));
};

const createEntityApi = (entityName) => ({
  list: async (sortField = '-updated_date', limit = 100) => {
    const items = applySort(getEntityItems(entityName), sortField);
    return items.slice(0, Number(limit) || items.length);
  },
  create: async (payload = {}) => {
    const store = safeRead();
    const items = [...(store[entityName] || [...(seedEntities[entityName] || [])])];
    const item = {
      id: payload.id || uid(entityName.toLowerCase()),
      created_date: nowIso(),
      updated_date: nowIso(),
      ...payload,
    };
    items.unshift(item);
    store[entityName] = items;
    safeWrite(store);
    emit(entityName, 'create', item);
    return item;
  },
  update: async (id, patch = {}) => {
    const store = safeRead();
    const items = [...(store[entityName] || [...(seedEntities[entityName] || [])])];
    const index = items.findIndex((item) => item.id === id || item.node_id === id);
    if (index === -1) {
      return { ok: true, id, updated: false };
    }
    const updated = { ...items[index], ...patch, id: items[index].id, updated_date: nowIso() };
    items[index] = updated;
    store[entityName] = items;
    safeWrite(store);
    emit(entityName, 'update', updated);
    return updated;
  },
  delete: async (id) => {
    const store = safeRead();
    const items = [...(store[entityName] || [...(seedEntities[entityName] || [])])];
    const next = items.filter((item) => item.id !== id && item.node_id !== id);
    store[entityName] = next;
    safeWrite(store);
    emit(entityName, 'delete', { id });
    return { ok: true, deleted: true };
  },
  bulkCreate: async (records = []) => {
    const store = safeRead();
    const items = [...(store[entityName] || [...(seedEntities[entityName] || [])])];
    const created = records.map((payload) => {
      const item = {
        id: payload.id || uid(entityName.toLowerCase()),
        created_date: nowIso(),
        updated_date: nowIso(),
        ...payload,
      };
      items.unshift(item);
      emit(entityName, 'create', item);
      return item;
    });
    store[entityName] = items;
    safeWrite(store);
    return created;
  },
  bulkUpdate: async (targets = []) => {
    const store = safeRead();
    const items = [...(store[entityName] || [...(seedEntities[entityName] || [])])];
    const updated = targets.map((target) => {
      const index = items.findIndex((item) => item.id === target.id || item.node_id === target.id);
      if (index === -1) return null;
      const next = { ...items[index], ...target, updated_date: nowIso() };
      items[index] = next;
      emit(entityName, 'update', next);
      return next;
    }).filter(Boolean);
    store[entityName] = items;
    safeWrite(store);
    return updated;
  },
  subscribe: (handler) => {
    const key = `${entityName}:*`;
    const list = listeners.get(key) || [];
    list.push(handler);
    listeners.set(key, list);
    return () => {
      const next = (listeners.get(key) || []).filter((fn) => fn !== handler);
      listeners.set(key, next);
    };
  },
});

export const localApi = {
  entities: {
    Device: createEntityApi('Device'),
    Transfer: createEntityApi('Transfer'),
    Server: createEntityApi('Server'),
    TransferTemplate: createEntityApi('TransferTemplate'),
  },
};
