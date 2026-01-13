import { http, HttpResponse } from 'msw';
import dayjs from 'dayjs';
import type { Case, Client, Document, Invoice, Payment } from '../entities/case/types';
import type { Expert, Assignment } from '../entities/expert/types';

const mockCases: Case[] = [
  {
    id: '1',
    caseNumber: 'ЭКС-2024-001',
    authority: 'Арбитражный суд г. Москвы',
    clientId: '1',
    caseType: 'Строительно-техническая экспертиза',
    objectType: 'Жилое здание',
    objectAddress: 'г. Москва, ул. Тверская, д. 1',
    status: 'in_progress',
    assignedExpertId: '1',
    startDate: '2024-01-15T00:00:00Z',
    deadline: '2024-02-15T00:00:00Z',
    cost: 150000,
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    caseNumber: 'ЭКС-2024-002',
    authority: 'Мосгорсуд',
    clientId: '2',
    caseType: 'Оценочная экспертиза',
    objectType: 'Коммерческое помещение',
    objectAddress: 'г. Москва, Красная площадь, д. 1',
    status: 'awaiting_documents',
    assignedExpertId: '2',
    startDate: '2024-01-20T00:00:00Z',
    deadline: '2024-03-01T00:00:00Z',
    cost: 200000,
    createdAt: '2024-01-18T00:00:00Z',
  },
  {
    id: '3',
    caseNumber: 'ЭКС-2024-003',
    authority: 'Арбитражный суд МО',
    clientId: '3',
    caseType: 'Пожарно-техническая экспертиза',
    objectType: 'Промышленное здание',
    objectAddress: 'МО, г. Подольск, ул. Промышленная, д. 15',
    status: 'done',
    assignedExpertId: '1',
    startDate: '2023-12-01T00:00:00Z',
    deadline: '2024-01-15T00:00:00Z',
    cost: 350000,
    createdAt: '2023-11-28T00:00:00Z',
  },
  {
    id: '4',
    caseNumber: 'ЭКС-2024-004',
    authority: 'Арбитражный суд СПб',
    clientId: '4',
    caseType: 'Оценочная экспертиза',
    objectType: 'Офисное здание',
    objectAddress: 'г. СПб, Невский пр., д. 100',
    status: 'new',
    startDate: '2024-02-01T00:00:00Z',
    deadline: '2024-03-15T00:00:00Z',
    cost: 180000,
    createdAt: '2024-01-25T00:00:00Z',
  },
  {
    id: '5',
    caseNumber: 'ЭКС-2024-005',
    authority: 'Мосгорсуд',
    clientId: '1',
    caseType: 'Автотехническая экспертиза',
    objectType: 'Легковой автомобиль',
    objectAddress: 'г. Москва, ул. Ленина, д. 5',
    status: 'closed',
    assignedExpertId: '2',
    startDate: '2023-11-01T00:00:00Z',
    deadline: '2023-12-01T00:00:00Z',
    cost: 75000,
    createdAt: '2023-10-28T00:00:00Z',
  },
];

const mockClients: Client[] = [
  { id: '1', name: 'ООО "Строй Инвест"', email: 'info@stroyinvest.ru', phone: '+7 495 123-45-67' },
  { id: '2', name: 'ИП Иванов И.И.', email: 'ivanov@mail.ru', phone: '+7 926 123-45-67' },
  { id: '3', name: 'ПАО "Газпром"', email: 'contracts@gazprom.ru', phone: '+7 495 719-30-01' },
  { id: '4', name: 'ООО "Рога и копыта"', email: 'info@rogaikopyta.ru', phone: '+7 812 555-12-34' },
];

const mockExperts: Expert[] = [
  {
    id: '1',
    name: 'Петров Петр Петрович',
    email: 'petrov@expert.ru',
    phone: '+7 495 111-22-33',
    specialization: ['Строительно-техническая экспертиза', 'Пожарно-техническая экспертиза'],
    status: 'active',
    workload: 2,
    createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Сидорова Анна Ивановна',
    email: 'sidorova@expert.ru',
    phone: '+7 495 222-33-44',
    specialization: ['Оценочная экспертиза', 'Автотехническая экспертиза'],
    status: 'active',
    workload: 1,
    createdAt: '2023-02-20T00:00:00Z',
  },
];

const mockAssignments: Assignment[] = [
  {
    id: '1',
    caseId: '1',
    expertId: '1',
    assignedAt: '2024-01-15T00:00:00Z',
    assignedBy: 'Генеральный директор',
    notes: 'Срочное дело',
  },
  {
    id: '2',
    caseId: '2',
    expertId: '2',
    assignedAt: '2024-01-20T00:00:00Z',
    assignedBy: 'Генеральный директор',
  },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Договор на экспертизу ЭКС-2024-001.pdf',
    type: 'contract',
    size: 2048576,
    uploadedAt: '2024-01-10T10:00:00Z',
    caseId: '1',
    uploadedBy: 'Иванов И.И.',
    url: '/documents/contract-001.pdf',
  },
  {
    id: '2',
    name: 'Фото объекта 1.jpg',
    type: 'photo',
    size: 5242880,
    uploadedAt: '2024-01-15T14:30:00Z',
    caseId: '1',
    uploadedBy: 'Петров П.П.',
    url: '/documents/photo-001.jpg',
  },
  {
    id: '3',
    name: 'Заключение эксперта ЭКС-2024-003.docx',
    type: 'report',
    size: 1048576,
    uploadedAt: '2024-01-14T16:45:00Z',
    caseId: '3',
    uploadedBy: 'Сидоров С.С.',
    url: '/documents/report-003.docx',
  },
  {
    id: '4',
    name: 'Сертификат эксперта.pdf',
    type: 'certificate',
    size: 512000,
    uploadedAt: '2024-01-05T09:15:00Z',
    uploadedBy: 'Администратор',
    url: '/documents/certificate.pdf',
  },
];

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'СЧ-001-2024',
    caseId: '1',
    amount: 150000,
    status: 'paid',
    createdAt: '2024-01-10T00:00:00Z',
    dueDate: '2024-01-25T00:00:00Z',
    paidAt: '2024-01-22T00:00:00Z',
    description: 'Строительно-техническая экспертиза жилого здания',
  },
  {
    id: '2',
    number: 'СЧ-002-2024',
    caseId: '2',
    amount: 200000,
    status: 'sent',
    createdAt: '2024-01-20T00:00:00Z',
    dueDate: '2024-02-05T00:00:00Z',
    description: 'Оценочная экспертиза коммерческого помещения',
  },
  {
    id: '3',
    number: 'СЧ-003-2024',
    caseId: '3',
    amount: 350000,
    status: 'paid',
    createdAt: '2023-12-01T00:00:00Z',
    dueDate: '2023-12-16T00:00:00Z',
    paidAt: '2023-12-14T00:00:00Z',
    description: 'Пожарно-техническая экспертиза промышленного здания',
  },
  {
    id: '4',
    number: 'СЧ-004-2024',
    caseId: '4',
    amount: 180000,
    status: 'draft',
    createdAt: '2024-01-25T00:00:00Z',
    dueDate: '2024-02-10T00:00:00Z',
    description: 'Оценочная экспертиза офисного здания',
  },
  {
    id: '5',
    number: 'СЧ-005-2024',
    caseId: '2',
    amount: 50000,
    status: 'overdue',
    createdAt: '2024-01-05T00:00:00Z',
    dueDate: '2024-01-20T00:00:00Z',
    description: 'Предоплата за экспертизу',
  },
];

const mockPayments: Payment[] = [
  {
    id: '1',
    invoiceId: '1',
    amount: 150000,
    method: 'bank_transfer',
    receivedAt: '2024-01-22T00:00:00Z',
    description: 'Оплата по договору ЭКС-2024-001',
  },
  {
    id: '2',
    invoiceId: '3',
    amount: 350000,
    method: 'bank_transfer',
    receivedAt: '2023-12-14T00:00:00Z',
    description: 'Оплата по договору ЭКС-2024-003',
  },
];

let documentIdCounter = 5;
let invoiceIdCounter = 6;
let paymentIdCounter = 3;
let expertIdCounter = 3;
let assignmentIdCounter = 3;

export const handlers = [
  http.get('*/api/cases', () => {
    return HttpResponse.json(mockCases);
  }),

  http.get('*/api/cases/:id', ({ params }) => {
    const case_ = mockCases.find(c => c.id === params.id);
    return case_ ? HttpResponse.json(case_) : new HttpResponse(null, { status: 404 });
  }),

  http.post('*/api/cases', async ({ request }) => {
    const data = await request.json() as Omit<Case, 'id' | 'createdAt'>;
    const newCase: Case = {
      ...data,
      id: String(mockCases.length + 1),
      createdAt: new Date().toISOString(),
    };
    mockCases.push(newCase);
    return HttpResponse.json(newCase);
  }),

  http.put('*/api/cases/:id', async ({ params, request }) => {
    const updates = await request.json() as Partial<Case>;
    const caseIndex = mockCases.findIndex(c => c.id === params.id);
    if (caseIndex >= 0) {
      mockCases[caseIndex] = { ...mockCases[caseIndex], ...updates };
      return HttpResponse.json(mockCases[caseIndex]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/api/clients', () => {
    return HttpResponse.json(mockClients);
  }),

  // Эксперты
  http.get('*/api/experts', () => {
    return HttpResponse.json(mockExperts);
  }),

  // Mail API
  http.get('*/api/mail/folders', () => {
    const folders = [
      { id: 'inbox', name: 'Входящие', type: 'inbox', unreadCount: 5 },
      { id: 'sent', name: 'Отправленные', type: 'sent', unreadCount: 0 },
      { id: 'drafts', name: 'Черновики', type: 'drafts', unreadCount: 0 },
      { id: 'archive', name: 'Архив', type: 'archive', unreadCount: 0 },
    ];
    return HttpResponse.json(folders);
  }),

  http.get('*/api/mail/threads', () => {
    const threads = [
      {
        id: '1',
        subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
        participants: ['client@stroyinvest.ru', 'director@company.ru'],
        mails: [],
        lastActivity: new Date().toISOString(),
        isRead: false,
      },
      {
        id: '2', 
        subject: 'Запрос дополнительных документов',
        participants: ['ivanov@mail.ru', 'director@company.ru'],
        mails: [],
        lastActivity: dayjs().subtract(2, 'hour').toISOString(),
        isRead: true,
      },
    ];
    return HttpResponse.json(threads);
  }),

  http.get('*/api/mail/threads/:id', ({ params }) => {
    const thread = {
      id: params.id,
      subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
      participants: ['client@stroyinvest.ru', 'director@company.ru'],
      lastActivity: new Date().toISOString(),
      isRead: false,
      mails: [
        {
          id: '1',
          threadId: params.id as string,
          from: 'client@stroyinvest.ru',
          to: ['director@company.ru'],
          subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
          body: 'Добрый день! Просим назначить осмотр объекта на ближайшее время. Дело срочное.',
          attachments: [],
          receivedAt: dayjs().subtract(1, 'hour').toISOString(),
          isRead: false,
          isStarred: false,
          isArchived: false,
          priority: 'high',
        },
        {
          id: '2',
          threadId: params.id as string,
          from: 'director@company.ru',
          to: ['client@stroyinvest.ru'],
          subject: 'Re: Срочно: Осмотр объекта по делу ЭКС-2024-001',
          body: 'Здравствуйте! Осмотр назначен на завтра в 10:00. Эксперт Петров П.П. свяжется с вами.',
          attachments: [],
          receivedAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          isRead: true,
          isStarred: false,
          isArchived: false,
          priority: 'normal',
        },
      ],
    };
    return HttpResponse.json(thread);
  }),

  http.get('*/api/experts/:id', ({ params }) => {
    const expert = mockExperts.find(e => e.id === params.id);
    return expert ? HttpResponse.json(expert) : new HttpResponse(null, { status: 404 });
  }),

  http.post('*/api/experts', async ({ request }) => {
    const data = await request.json() as Omit<Expert, 'id' | 'createdAt' | 'workload'>;
    const newExpert: Expert = {
      ...data,
      id: String(expertIdCounter++),
      workload: 0,
      createdAt: new Date().toISOString(),
    };
    mockExperts.push(newExpert);
    return HttpResponse.json(newExpert);
  }),

  http.put('*/api/experts/:id', async ({ params, request }) => {
    const updates = await request.json() as Partial<Expert>;
    const expertIndex = mockExperts.findIndex(e => e.id === params.id);
    if (expertIndex >= 0) {
      mockExperts[expertIndex] = { ...mockExperts[expertIndex], ...updates };
      return HttpResponse.json(mockExperts[expertIndex]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('*/api/experts/:id', ({ params }) => {
    const index = mockExperts.findIndex(e => e.id === params.id);
    if (index >= 0) {
      mockExperts.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Назначения
  http.get('*/api/assignments', () => {
    return HttpResponse.json(mockAssignments);
  }),

  http.post('*/api/assignments', async ({ request }) => {
    const data = await request.json() as Omit<Assignment, 'id' | 'assignedAt'>;
    const newAssignment: Assignment = {
      ...data,
      id: String(assignmentIdCounter++),
      assignedAt: new Date().toISOString(),
    };
    mockAssignments.push(newAssignment);
    
    // Обновляем дело
    const caseIndex = mockCases.findIndex(c => c.id === data.caseId);
    if (caseIndex >= 0) {
      mockCases[caseIndex].assignedExpertId = data.expertId;
    }
    
    return HttpResponse.json(newAssignment);
  }),

  http.delete('*/api/assignments/case/:caseId', ({ params }) => {
    const index = mockAssignments.findIndex(a => a.caseId === params.caseId);
    if (index >= 0) {
      mockAssignments.splice(index, 1);
      
      // Убираем назначение из дела
      const caseIndex = mockCases.findIndex(c => c.id === params.caseId);
      if (caseIndex >= 0) {
        delete mockCases[caseIndex].assignedExpertId;
      }
      
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/api/documents', () => {
    return HttpResponse.json(mockDocuments);
  }),

  http.post('*/api/documents', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const type = formData.get('type') as Document['type'];
    
    const newDocument: Document = {
      id: String(documentIdCounter++),
      name: file.name,
      type: type || 'other',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      caseId: caseId || undefined,
      uploadedBy: 'Текущий пользователь',
      url: `/documents/${file.name}`,
    };
    
    mockDocuments.push(newDocument);
    return HttpResponse.json(newDocument);
  }),

  http.delete('*/api/documents/:id', ({ params }) => {
    const index = mockDocuments.findIndex(d => d.id === params.id);
    if (index >= 0) {
      mockDocuments.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/api/invoices', () => {
    return HttpResponse.json(mockInvoices);
  }),

  http.get('*/api/payments', () => {
    return HttpResponse.json(mockPayments);
  }),
];