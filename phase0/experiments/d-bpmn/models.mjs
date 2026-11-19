// BPMN-subset test processes (AR/EN labels). P1–P4 hand-written; P5–P6 generated for scale.
const L = (en, ar) => ({ en, ar });
const T = (id, lane, en, ar) => ({ id, type: "task", lane, label: L(en, ar) });
const G = (id, lane, en, ar) => ({ id, type: "gateway", lane, label: L(en, ar) });
const S = (id, lane, en, ar) => ({ id, type: "start", lane, label: L(en, ar) });
const E = (id, lane, en, ar) => ({ id, type: "end", lane, label: L(en, ar) });
const e = (from, to, label) => ({ id: `${from}-${to}`, from, to, ...(label ? { label } : {}) });
const YES = L("Yes", "نعم"), NO = L("No", "لا");

export const P1 = {
  id: "P1", title: L("Purchase request", "طلب الشراء"),
  lanes: [{ id: "req", label: L("Requester", "مقدم الطلب") }, { id: "mgr", label: L("Department manager", "مدير الإدارة") }, { id: "proc", label: L("Procurement", "المشتريات") }],
  nodes: [
    S("s", "req", "Need identified", "تحديد الاحتياج"),
    T("t1", "req", "Fill purchase request with budget code", "تعبئة طلب الشراء مع رمز الميزانية"),
    T("t2", "mgr", "Review request", "مراجعة الطلب"),
    G("g1", "mgr", "Approved?", "معتمد؟"),
    T("t3", "req", "Revise request", "تعديل الطلب"),
    T("t4", "proc", "Check budget availability", "التحقق من توفر الميزانية"),
    T("t5", "proc", "Issue purchase order", "إصدار أمر الشراء"),
    E("end", "proc", "PO issued", "صدر أمر الشراء"),
  ],
  edges: [e("s", "t1"), e("t1", "t2"), e("t2", "g1"), e("g1", "t4", YES), e("g1", "t3", NO), e("t3", "t2"), e("t4", "t5"), e("t5", "end")],
};

export const P2 = {
  id: "P2", title: L("Commercial licence application", "طلب الترخيص التجاري"),
  lanes: [
    { id: "app", label: L("Applicant (portal)", "المتقدم (البوابة)") },
    { id: "off", label: L("Licensing officer", "موظف التراخيص") },
    { id: "ins", label: L("Municipality inspection", "التفتيش البلدي") },
    { id: "leg", label: L("Legal review", "المراجعة القانونية") },
  ],
  nodes: [
    S("s", "app", "Application submitted", "تقديم الطلب"),
    T("t1", "off", "Check documents for completeness", "التحقق من اكتمال المستندات"),
    G("g1", "off", "Complete?", "مكتمل؟"),
    T("t2", "app", "Upload missing documents", "رفع المستندات الناقصة"),
    T("t3", "off", "Classify activity and risk level", "تصنيف النشاط ومستوى المخاطر"),
    G("g2", "off", "Inspection required?", "هل يلزم التفتيش؟"),
    T("t4", "ins", "Schedule site inspection", "جدولة زيارة التفتيش الميداني"),
    T("t5", "ins", "Inspect premises and record findings", "تفتيش المنشأة وتسجيل الملاحظات"),
    T("t6", "leg", "Review legal and zoning compliance", "مراجعة الامتثال القانوني واستخدامات الأراضي"),
    G("g3", "leg", "Compliant?", "ممتثل؟"),
    T("t7", "off", "Issue licence and notify applicant", "إصدار الترخيص وإشعار المتقدم"),
    T("t8", "off", "Issue rejection with reasons", "إصدار الرفض مع الأسباب"),
    E("e1", "app", "Licence received", "استلام الترخيص"),
    E("e2", "app", "Rejection received", "استلام الرفض"),
  ],
  edges: [e("s", "t1"), e("t1", "g1"), e("g1", "t3", YES), e("g1", "t2", NO), e("t2", "t1"), e("t3", "g2"), e("g2", "t4", YES), e("g2", "t6", NO),
    e("t4", "t5"), e("t5", "t6"), e("t6", "g3"), e("g3", "t7", YES), e("g3", "t8", NO), e("t7", "e1"), e("t8", "e2")],
};

export const P3 = {
  id: "P3", title: L("Insurance claim submission", "تقديم مطالبة التأمين"),
  lanes: [{ id: "rec", label: L("Reception", "الاستقبال") }, { id: "doc", label: L("Physician", "الطبيب") }, { id: "bill", label: L("Billing", "الفوترة") }],
  nodes: [
    S("s", "rec", "Patient arrives", "وصول المريض"),
    T("t1", "rec", "Verify insurance eligibility", "التحقق من أهلية التأمين"),
    G("g1", "rec", "Pre-authorisation needed?", "هل يلزم موافقة مسبقة؟"),
    T("t2", "rec", "Request pre-authorisation", "طلب الموافقة المسبقة"),
    T("t3", "doc", "Consultation and diagnosis", "الكشف والتشخيص"),
    T("t4", "doc", "Record diagnosis codes", "تسجيل رموز التشخيص"),
    T("t5", "bill", "Validate codes and prepare claim", "التحقق من الرموز وإعداد المطالبة"),
    G("g2", "bill", "Errors found?", "توجد أخطاء؟"),
    T("t6", "doc", "Correct coding", "تصحيح الترميز"),
    T("t7", "bill", "Submit claim to insurer", "إرسال المطالبة لشركة التأمين"),
    E("end", "bill", "Claim submitted", "تم إرسال المطالبة"),
  ],
  edges: [e("s", "t1"), e("t1", "g1"), e("g1", "t2", YES), e("g1", "t3", NO), e("t2", "t3"), e("t3", "t4"), e("t4", "t5"), e("t5", "g2"), e("g2", "t6", YES), e("g2", "t7", NO), e("t6", "t5"), e("t7", "end")],
};

export const P4 = {
  id: "P4", title: L("Order fulfilment", "تنفيذ الطلبات"),
  lanes: [{ id: "sales", label: L("Sales", "المبيعات") }, { id: "wh", label: L("Warehouse", "المستودع") }, { id: "qc", label: L("Quality control", "ضبط الجودة") }, { id: "dsp", label: L("Dispatch", "الشحن") }],
  nodes: [
    S("s", "sales", "Order received", "استلام الطلب"),
    T("t1", "sales", "Confirm stock and delivery date", "تأكيد المخزون وموعد التسليم"),
    T("t2", "sales", "Release order to warehouse", "إحالة الطلب إلى المستودع"),
    T("t3", "wh", "Generate pick list", "إنشاء قائمة الالتقاط"),
    T("t4", "wh", "Pick items", "التقاط الأصناف"),
    T("t5", "qc", "Inspect picked items", "فحص الأصناف الملتقطة"),
    G("g1", "qc", "Pass?", "مقبول؟"),
    T("t6", "wh", "Replace defective items", "استبدال الأصناف المعيبة"),
    T("t7", "wh", "Pack and label", "التغليف ووضع الملصقات"),
    T("t8", "dsp", "Book carrier", "حجز شركة النقل"),
    T("t9", "dsp", "Load and dispatch", "التحميل والشحن"),
    T("t10", "sales", "Send shipping notification to customer", "إرسال إشعار الشحن للعميل"),
    E("end", "dsp", "Order dispatched", "تم شحن الطلب"),
  ],
  edges: [e("s", "t1"), e("t1", "t2"), e("t2", "t3"), e("t3", "t4"), e("t4", "t5"), e("t5", "g1"), e("g1", "t7", YES), e("g1", "t6", NO), e("t6", "t5"),
    e("t7", "t8"), e("t8", "t9"), e("t9", "t10"), e("t10", "end")],
};

// Generated larger processes (synthetic labels of realistic length) for scale/perf.
function generated(id, nTasks, nLanes, nGateways, seed) {
  let x = seed; const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const verbsEn = ["Review", "Prepare", "Validate", "Approve", "Record", "Notify", "Assess", "Update", "Consolidate", "Submit"];
  const objsEn = ["the request details", "supporting documents", "budget allocation", "vendor quotation", "compliance checklist", "the case file", "service level report", "contract amendment"];
  const verbsAr = ["مراجعة", "إعداد", "التحقق من", "اعتماد", "تسجيل", "إشعار", "تقييم", "تحديث", "تجميع", "رفع"];
  const objsAr = ["تفاصيل الطلب", "المستندات الداعمة", "تخصيص الميزانية", "عرض سعر المورد", "قائمة التحقق من الامتثال", "ملف الحالة", "تقرير مستوى الخدمة", "تعديل العقد"];
  const lanes = Array.from({ length: nLanes }, (_, i) => ({ id: `l${i}`, label: L(`Unit ${i + 1}`, `الوحدة ${i + 1}`) }));
  const nodes = [S("s", "l0", "Start", "البداية")]; const edges = [];
  let prev = "s"; let gw = 0;
  for (let i = 1; i <= nTasks; i++) {
    const lane = `l${Math.floor(rnd() * nLanes)}`;
    const vi = Math.floor(rnd() * verbsEn.length), oi = Math.floor(rnd() * objsEn.length);
    nodes.push(T(`t${i}`, lane, `${verbsEn[vi]} ${objsEn[oi]}`, `${verbsAr[vi]} ${objsAr[oi]}`));
    edges.push(e(prev, `t${i}`)); prev = `t${i}`;
    if (gw < nGateways && i % Math.ceil(nTasks / (nGateways + 1)) === 0 && i < nTasks - 1) {
      gw++; const g = `g${gw}`; nodes.push(G(g, lane, `Decision ${gw}?`, `القرار ${gw}؟`)); edges.push(e(prev, g, null));
      const back = `t${Math.max(1, i - 2)}`; edges.push(e(g, back, NO)); prev = g; edges[edges.length - 1].label = NO;
      // forward YES edge added by next loop iteration (label patched below)
      edges.push({ id: `${g}-next`, from: g, to: null, label: YES });
    }
  }
  nodes.push(E("end", `l${nLanes - 1}`, "End", "النهاية")); edges.push(e(prev, "end"));
  // patch YES edges' targets: the task right after the gateway
  for (const ed of edges.filter(x => x.to === null)) {
    const gIdx = nodes.findIndex(n => n.id === ed.from); ed.to = nodes[gIdx + 1].id; ed.id = `${ed.from}-${ed.to}`;
  }
  // remove the duplicate plain edge g->next created by the chain (prev=g then e(prev, next))
  const seen = new Set(); const dedup = [];
  for (const ed of edges) { const k = `${ed.from}>${ed.to}`; if (seen.has(k)) { const ex = dedup.find(d => `${d.from}>${d.to}` === k); if (ed.label) ex.label = ed.label; continue; } seen.add(k); dedup.push(ed); }
  return { id, title: L(`Generated process ${id}`, `عملية مولدة ${id}`), lanes, nodes, edges: dedup };
}
export const P5 = generated("P5", 30, 5, 4, 11);
export const P6 = generated("P6", 60, 6, 8, 23);
export const ALL = [P1, P2, P3, P4, P5, P6];
