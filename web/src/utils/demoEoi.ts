import api from '../services/api';

/**
 * ─────────────────────────────────────────────────────────
 * The EOI, submitted for you.
 *
 * Presenter Mode drives the real Expression-of-Interest flow so the person on
 * stage talks instead of typing. Everything here hits the same endpoint a walk-in
 * buyer hits — the only thing simulated is the keyboard, and a real pending EOI
 * comes out the other end for Finance to approve in the next act.
 *
 * Note what an EOI *is*: 50k to hold a place in the PROJECT's priority queue. It
 * does not pick a unit. The unit comes later, after approval, ranking and an
 * invitation — which is why `unitId` is optional and normally absent.
 * ─────────────────────────────────────────────────────────
 */

export interface EoiForm {
  first_name: string; last_name: string; email: string; phone: string; national_id: string;
  education: string; job_title: string; monthly_income: string; income_currency: string;
  marital_status: string; number_of_children: string; children_ages: string;
  children_schools: string; current_residence: string; residence_type: string;
  cars_owned: string; club_memberships: string;
}

export const BLANK_EOI_FORM: EoiForm = {
  first_name: '', last_name: '', email: '', phone: '', national_id: '',
  education: '', job_title: '', monthly_income: '', income_currency: 'USD',
  marital_status: 'single', number_of_children: '0', children_ages: '',
  children_schools: '', current_residence: '', residence_type: 'owned',
  cars_owned: '', club_memberships: '',
};

export const EOI_AMOUNT = 50000;

/**
 * The API refuses a second EOI from the same lead on the same project. A dress
 * rehearsal would therefore leave the live run with nothing pending to approve —
 * so the buyer gets a fresh email/phone/ID per page load. The name on screen
 * stays Ahmed Mostafa; only the identifiers move.
 */
const DEMO_RUN = String(Date.now()).slice(-7);

/** The buyer the room meets. Income sits deliberately above 150k, so the priority
 *  rule the admin later dictates to the chatbot actually moves him. */
export const DEMO_BUYER: EoiForm = {
  first_name: 'Ahmed', last_name: 'Mostafa',
  email: `ahmed.mostafa.${DEMO_RUN}@example.com`,
  phone: `0100${DEMO_RUN}`,
  national_id: `2900801${DEMO_RUN}`,
  education: "Bachelor's Degree", job_title: 'Marketing Director',
  monthly_income: '185000', income_currency: 'EGP', marital_status: 'married',
  number_of_children: '2', children_ages: '6, 9', children_schools: 'British International School',
  current_residence: 'New Cairo', residence_type: 'owned', cars_owned: '2', club_memberships: 'Wadi Degla',
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The receipt the demo uploads — drawn on a canvas the moment it's needed, so
 * there is no file picker to fight on stage and no fixture to ship. PNG because
 * the API only accepts images and PDFs.
 */
export function makeDemoReceipt(
  payer = `${DEMO_BUYER.first_name} ${DEMO_BUYER.last_name}`,
  amount = EOI_AMOUNT
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 640, 400);
  ctx.fillStyle = '#003DA6';
  ctx.fillRect(0, 0, 640, 72);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Segoe UI, Arial, sans-serif';
  ctx.fillText('InstaPay — Payment Receipt', 28, 45);

  const rows: [string, string][] = [
    ['Payer', payer],
    ['Beneficiary', 'REDP Developments'],
    ['Method', 'InstaPay Transfer'],
    ['Reference', 'IPN-2026-778341'],
    ['Amount', `EGP ${amount.toLocaleString('en-US')}`],
    ['Status', 'Successful'],
  ];

  let y = 128;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '15px Segoe UI, Arial, sans-serif';
    ctx.fillText(label, 40, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Segoe UI, Arial, sans-serif';
    ctx.fillText(value, 240, y);
    y += 40;
  });

  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(600, y);
  ctx.stroke();

  return new Promise(resolve => {
    canvas.toBlob(
      blob => resolve(new File([blob!], 'eoi-receipt.png', { type: 'image/png' })),
      'image/png'
    );
  });
}

/**
 * Posts an EOI. Everything it needs arrives as an argument — no component state —
 * so the autopilot can fill the form and submit it in the same breath instead of
 * waiting for React to flush the state it only just set.
 */
export async function submitEoi(a: {
  form: EoiForm;
  projectId: string;
  /** Only for the legacy unit-first path. A queue EOI has no unit. */
  unitId?: string | null;
  location: string;
  method: string;
  receipt: File;
  passport?: File | null;
  ref?: string;
}) {
  const fd = new FormData();
  fd.append('first_name', a.form.first_name);
  fd.append('last_name', a.form.last_name);
  fd.append('email', a.form.email);
  fd.append('phone', a.form.phone);
  if (a.form.national_id) fd.append('national_id', a.form.national_id);

  fd.append('project_id', a.projectId);
  if (a.unitId) fd.append('unit_id', a.unitId);
  fd.append('eoi_amount', `${EOI_AMOUNT}.00`);
  fd.append('client_location', a.location);
  fd.append('payment_method', a.method);
  fd.append('receipt', a.receipt);
  if (a.passport) fd.append('passport', a.passport);

  fd.append('education', a.form.education);
  fd.append('job_title', a.form.job_title);
  fd.append('monthly_income', a.form.monthly_income);
  fd.append('income_currency', a.form.income_currency);
  fd.append('marital_status', a.form.marital_status);
  fd.append('number_of_children', a.form.number_of_children);
  fd.append('children_ages', a.form.children_ages);
  fd.append('children_schools', a.form.children_schools);
  fd.append('current_residence', a.form.current_residence);
  fd.append('residence_type', a.form.residence_type);
  fd.append('cars_owned', a.form.cars_owned);
  fd.append('club_memberships', a.form.club_memberships);

  // Credits the broker: AttributionService reads `ref` and locks lead ownership.
  // Absent, the sale is attributed as direct.
  if (a.ref) fd.append('ref', a.ref);

  return api.post('/v1/public/eoi/submit', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
