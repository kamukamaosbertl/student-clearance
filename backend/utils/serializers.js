// Shapes database rows into the JSON the frontend receives. Keeping this in
// one place guarantees password hashes and storage paths never leak out.

export function serializeOffice(office) {
  if (!office) return null;
  return {
    id: office.id,
    name: office.name,
    code: office.code,
    slug: office.slug,
    sequence: office.sequence,
    requiresDocuments: office.requiresDocuments,
    isRequired: office.isRequired,
    isActive: office.isActive,
    description: office.description,
  };
}

export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    studentId: user.studentId,
    fullName: user.fullName,
    email: user.email,
    programme: user.programme,
    faculty: user.faculty,
    department: user.department,
    role: user.role,
    officeId: user.officeId ?? null,
    office: user.office ? { id: user.office.id, name: user.office.name, slug: user.office.slug, code: user.office.code } : null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  };
}

export function serializeDocument(doc) {
  return {
    id: doc.id,
    stageId: doc.stageId,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    documentType: doc.documentType,
    status: doc.status,
    uploadedAt: doc.uploadedAt,
  };
}

export function serializeEvent(event) {
  return {
    id: event.id,
    action: event.action,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    comment: event.comment,
    createdAt: event.createdAt,
    actor: event.actor ? { id: event.actor.id, fullName: event.actor.fullName, role: event.actor.role } : null,
  };
}

export function serializeStage(stage) {
  return {
    id: stage.id,
    applicationId: stage.applicationId,
    sequence: stage.sequence,
    status: stage.status,
    comment: stage.comment,
    queuedAt: stage.queuedAt,
    decidedAt: stage.decidedAt,
    clearedAt: stage.clearedAt,
    updatedAt: stage.updatedAt,
    office: serializeOffice(stage.office),
    decidedBy: stage.decider ? { id: stage.decider.id, fullName: stage.decider.fullName } : null,
    documents: (stage.documents || []).map(serializeDocument),
    events: (stage.events || []).map(serializeEvent),
  };
}

export function serializeApplication(application) {
  if (!application) return null;
  const stages = [...(application.stages || [])].sort((a, b) => a.sequence - b.sequence);
  return {
    id: application.id,
    academicYear: application.academicYear,
    status: application.status,
    contactEmail: application.contactEmail,
    phone: application.phone,
    yearOfStudy: application.yearOfStudy,
    graduationYear: application.graduationYear,
    reason: application.reason,
    notes: application.notes,
    startedAt: application.startedAt,
    completedAt: application.completedAt,
    updatedAt: application.updatedAt,
    student: application.user ? serializeUser(application.user) : undefined,
    stages: stages.map(serializeStage),
  };
}
