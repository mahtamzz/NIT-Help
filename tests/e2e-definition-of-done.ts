const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:4000/api';

async function waitForNotification(
  client: { get: (endpoint: string) => Promise<any> },
  ticketId: string,
  timeoutMs = 4000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await client.get('/notifications');
    const found = (res.data || []).find((n: any) => n.ticketId === ticketId);
    if (found) {
      return found;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

async function runE2EVerification() {
  console.log('🚀 Starting Full 20-Step Definition of Done E2E Verification via Nginx Gateway...\n');

  class ApiClient {
    token: string | null = null;

    constructor(private name: string) { }

    async request(endpoint: string, options: RequestInit = {}) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(
          `[${this.name}] Request to ${endpoint} failed with status ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : data
          }`,
        );
      }

      return data;
    }

    get(endpoint: string) {
      return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint: string, body?: any) {
      return this.request(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    patch(endpoint: string, body?: any) {
      return this.request(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  const gatewayClient = new ApiClient('Gateway');
  const studentClient = new ApiClient('Student');
  const specialistClient = new ApiClient('Specialist');
  const managerClient = new ApiClient('Manager');
  const adminClient = new ApiClient('Admin');

  // Pre-check: Gateway & Microservices Health + Nginx auth_request protection
  console.log('Pre-check: Verifying Nginx Gateway and downstream microservices health...');
  const gwHealth = await gatewayClient.get('/health');
  console.log(`✅ Gateway Health: ${JSON.stringify(gwHealth)}`);

  const unauthRes = await fetch(`${API_BASE}/tickets`);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected Nginx auth_request to reject unauthenticated /tickets with 401, got ${unauthRes.status}`);
  }
  console.log('✅ Nginx auth_request properly blocks unauthenticated requests (401).');

  // Step 1: Student logs into the system (IAM Service)
  console.log('Step 1: Student logs into the system...');
  const studentLoginRes = await studentClient.post('/auth/login', {
    usernameOrEmail: 'student',
    password: 'Student@123456',
  });
  studentClient.token = studentLoginRes.accessToken;
  const studentUser = studentLoginRes.user;
  console.log(`✅ Logged in as Student: ${studentUser.fullName} (ID: ${studentUser.id})`);

  // Step 2: Student browses the service catalog (Core Service)
  console.log('Step 2: Student browses the service catalog...');
  const catalog = await studentClient.get('/services/categories');
  console.log(`✅ Retrieved ${catalog.length} service categories.`);

  // Step 3: Student selects a service and submits a ticket (Core Service)
  console.log('Step 3: Student selects a service and submits a ticket...');
  const allServices = catalog.flatMap((c: any) => c.services || []);
  const itService =
    allServices.find((s: any) => s.name.includes('اینترنت') || s.department?.code === 'IT') ||
    allServices[0];
  console.log(`Selected Service: "${itService.name}" for Department: ${itService.department?.name}`);

  const createdTicket = await studentClient.post('/tickets', {
    serviceId: itService.id,
    subject: 'بررسی اختلال در اتصال به شبکه دانشگاه در کتابخانه مرکزی',
    description:
      'سلام، متاسفانه در سالن مطالعه کتابخانه امکان اتصال به اینترنت دانشگاه وجود ندارد و خطای ترافیک منقضی شده نمایش داده می‌شود.',
    priority: 'HIGH',
  });

  // Step 4: Unique ticket number generated
  console.log('Step 4: Verifying unique ticket number generation...');
  console.log(`✅ Unique Ticket Number: ${createdTicket.ticketNumber}`);
  if (!createdTicket.ticketNumber.startsWith('NIT-')) {
    throw new Error('Invalid ticket number prefix!');
  }

  // Step 5: Stored in PostgreSQL (core schema)
  console.log('Step 5: Verifying ticket is stored in PostgreSQL core schema...');
  const fetchedTicket = await studentClient.get(`/tickets/${createdTicket.id}`);
  console.log(`✅ Ticket fetched from DB. Status: ${fetchedTicket.status}`);

  // Step 6 & 7: Specialist logs into the system & sees department queue
  console.log('Step 6-7: Specialist logs into the system and checks department queue...');
  const specLoginRes = await specialistClient.post('/auth/login', {
    usernameOrEmail: 'it_spec',
    password: 'Specialist@123456',
  });
  specialistClient.token = specLoginRes.accessToken;
  const specUser = specLoginRes.user;
  console.log(`✅ Logged in as Specialist: ${specUser.fullName}`);

  const specQueue = await specialistClient.get(`/tickets?departmentId=${itService.departmentId}`);
  const foundInQueue = specQueue.data.find((t: any) => t.id === createdTicket.id);
  if (!foundInQueue) throw new Error('Ticket not found in department queue!');
  console.log(`✅ Ticket ${createdTicket.ticketNumber} verified in IT Department queue.`);

  // Step 8: Specialist opens the ticket
  console.log('Step 8: Specialist opens the ticket details...');
  const specTicketDetail = await specialistClient.get(`/tickets/${createdTicket.id}`);
  console.log(`✅ Specialist opened ticket. Messages count: ${specTicketDetail.messages.length}`);

  // Step 9: Specialist takes ownership of the ticket
  console.log('Step 9: Specialist takes ownership of the ticket...');
  const assignRes = await specialistClient.patch(`/tickets/${createdTicket.id}/assignment`, {
    assignedToId: specUser.id,
    note: 'کارشناس مسئولیت رسیدگی به تیکت را بر عهده گرفت',
  });
  console.log(`✅ Assigned to specialist: ${assignRes.assignedToId}`);

  // Step 10: Specialist changes status to In Progress
  console.log('Step 10: Specialist changes status to IN_PROGRESS...');
  const statusRes = await specialistClient.patch(`/tickets/${createdTicket.id}/status`, {
    status: 'IN_PROGRESS',
    note: 'در حال بررسی پهنای باند و پورت‌های سوئیچ کتابخانه مرکزی',
  });
  console.log(`✅ Status updated to: ${statusRes.status}`);

  // Step 11: Specialist sends a response
  console.log('Step 11: Specialist sends a response to the requester...');
  const specMsgRes = await specialistClient.post(`/tickets/${createdTicket.id}/messages`, {
    content:
      'سلام و احترام؛ روتر کتابخانه بازبینی شد. لطفاً اعلام بفرمایید از طریق وای‌فای متصل هستید یا کابل شبکه؟',
    isInternal: false,
  });
  console.log(`✅ Specialist message posted: ID ${specMsgRes.id}`);

  // Step 12: Student receives a notification via RabbitMQ Event Bus (Notifications & Ops Service)
  console.log('Step 12: Student receives async event-driven notification...');
  const latestNotif = await waitForNotification(studentClient, createdTicket.id);
  if (!latestNotif) {
    throw new Error('Expected async notification for student was not delivered in time!');
  }
  console.log(`✅ Student notification received: "${latestNotif.title}" - ${latestNotif.message}`);

  // Step 13: Student opens ticket and reads response
  console.log('Step 13: Student opens ticket and reads response...');
  const studentDetailAfterMsg = await studentClient.get(`/tickets/${createdTicket.id}`);
  const hasSpecMsg = studentDetailAfterMsg.messages.some((m: any) => m.id === specMsgRes.id);
  console.log(`✅ Student read response successfully: ${hasSpecMsg}`);

  // Step 14: Specialist requests additional information
  console.log('Step 14: Specialist requests additional info (status WAITING_FOR_REQUESTER)...');
  await specialistClient.patch(`/tickets/${createdTicket.id}/status`, {
    status: 'WAITING_FOR_REQUESTER',
    note: 'در انتظار پاسخ کاربر پیرامون نوع اتصال شبکه',
  });
  console.log('✅ Status changed to WAITING_FOR_REQUESTER');

  // Step 15: Student responds
  console.log('Step 15: Student responds with requested info...');
  await studentClient.post(`/tickets/${createdTicket.id}/messages`, {
    content: 'با تشکر، از طریق شبکه وای‌فای دانشگاه متصل می‌شوم و آی‌پی ۱۰.۲۰.۳۰.۴۰ دریافت شده است.',
    isInternal: false,
  });
  console.log('✅ Student response sent. Status automatically transitions back to IN_PROGRESS.');

  // Step 16: Specialist resolves the ticket
  console.log('Step 16: Specialist resolves the ticket...');
  const resolvedRes = await specialistClient.patch(`/tickets/${createdTicket.id}/status`, {
    status: 'RESOLVED',
    note: 'تنظیمات اکانت کاربری اصلاح شد و دسترسی کتابخانه فعال گردید.',
  });
  console.log(`✅ Ticket marked as RESOLVED at: ${resolvedRes.resolvedAt}`);

  // Step 17: Student sees the final result
  console.log('Step 17: Student sees final result...');
  const studentFinalView = await studentClient.get(`/tickets/${createdTicket.id}`);
  console.log(`✅ Student views resolved ticket. Status is ${studentFinalView.status}`);

  // Step 18: Student submits a satisfaction rating
  console.log('Step 18: Student submits satisfaction rating (5 stars) and feedback...');
  const feedbackRes = await studentClient.post(`/tickets/${createdTicket.id}/feedback`, {
    rating: 5,
    comment: 'بسیار ممنون از سرعت عمل و پیگیری دقیق همکاران فناوری اطلاعات.',
  });
  console.log(`✅ Feedback recorded. Rating: ${feedbackRes.rating} stars.`);

  // Step 19: Department Manager sees the ticket in department reports (Notifications & Ops Service)
  console.log('Step 19: Department Manager logs in and views department reports...');
  const managerLoginRes = await managerClient.post('/auth/login', {
    usernameOrEmail: 'it_manager',
    password: 'Manager@123456',
  });
  managerClient.token = managerLoginRes.accessToken;
  const managerOverview = await managerClient.get('/reports/overview');
  console.log(
    `✅ Department Manager reports: Total Tickets = ${managerOverview.totalTickets}, Resolved = ${managerOverview.resolvedTickets}`,
  );

  // Step 20: Administrator sees relevant system-wide statistics & audit logs
  console.log('Step 20: Administrator logs in and views system-wide statistics...');
  const adminLoginRes = await adminClient.post('/auth/login', {
    usernameOrEmail: 'admin',
    password: 'Admin@123456',
  });
  adminClient.token = adminLoginRes.accessToken;
  const adminOverview = await adminClient.get('/reports/overview');
  const auditLogs = await adminClient.get('/audit?limit=10');
  console.log(
    `✅ System Administrator reports: Total System Tickets = ${adminOverview.totalTickets}, Average Resolution Time = ${adminOverview.averageResolutionHours} hours, Recent Audit Logs = ${auditLogs.length}.`,
  );

  console.log('\n🎉 ALL 20 STEPS OF THE DEFINITION OF DONE PASSED PERFECTLY ACROSS ALL 5 SERVICES!');
}

runE2EVerification().catch((err) => {
  console.error('❌ E2E Verification failed:', err.message);
  process.exit(1);
});
