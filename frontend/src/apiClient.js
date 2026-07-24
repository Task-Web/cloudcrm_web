const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || "Request failed";
    throw new Error(message);
  }

  return response.json();
}

const asCrmState = (payload) => ({
  user_id: payload.user_id,
  state: { data: payload.workspace },
});

const CRM_RESOURCE_PATHS = {
  accounts: "accounts",
  activities: "activities",
  cases: "cases",
  chatterPosts: "chatter-posts",
  contacts: "contacts",
  dashboards: "dashboards",
  files: "file-records",
  leads: "leads",
  opportunities: "opportunities",
  users: "users",
};

const CRM_WRITABLE_FIELDS = {
  accounts: ["billingCity", "billingCountry", "billingState", "billingStreet", "billingZip", "description", "employees", "industry", "name", "phone", "revenue", "shippingCity", "shippingCountry", "shippingState", "shippingStreet", "shippingZip", "type", "website"],
  activities: ["assignedToId", "description", "dueDate", "priority", "relatedToId", "relatedToType", "status", "subject", "type"],
  cases: ["accountId", "contactId", "description", "origin", "priority", "status", "subject"],
  contacts: ["accountId", "department", "email", "firstName", "lastName", "mailingCity", "mailingCountry", "mailingState", "mailingStreet", "mailingZip", "mobile", "phone", "title"],
  dashboards: ["chartType", "description", "name"],
  leads: ["city", "company", "country", "description", "email", "employees", "firstName", "industry", "lastName", "mobile", "phone", "rating", "revenue", "source", "state", "status", "street", "title", "website", "zip"],
  opportunities: ["accountId", "amount", "closeDate", "description", "leadSource", "name", "nextStep", "probability", "stage", "type"],
  users: ["avatar", "department", "email", "firstName", "lastName", "locale", "phone", "theme", "timezone", "title"],
};

const writableValues = (resource, values) => {
  if (resource === "files") return { uploadId: values.fileId };
  return Object.fromEntries(
    CRM_WRITABLE_FIELDS[resource]
      .filter((field) => values[field] !== undefined)
      .map((field) => [field, values[field]])
  );
};

export const api = {
  baseUrl: API_BASE,
  baseOrigin: API_ORIGIN,
  resolveUrl: (url) => {
    if (!url) return "";
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (!API_ORIGIN) return url;
    if (url.startsWith("/")) {
      return `${API_ORIGIN}${url}`;
    }
    return `${API_ORIGIN}/${url}`;
  },
  getCrmWorkspace: () => request("/crm/workspace").then(asCrmState),
  createCrmRecord: (resource, values) =>
    request(`/crm/${CRM_RESOURCE_PATHS[resource]}`, {
      method: "POST",
      body: JSON.stringify(writableValues(resource, values)),
    }).then(asCrmState),
  updateCrmRecord: (resource, recordId, values) =>
    request(`/crm/${CRM_RESOURCE_PATHS[resource]}/${encodeURIComponent(recordId)}`, {
      method: "PATCH",
      body: JSON.stringify(writableValues(resource, values)),
    }).then(asCrmState),
  deleteCrmRecord: (resource, recordId) =>
    request(`/crm/${CRM_RESOURCE_PATHS[resource]}/${encodeURIComponent(recordId)}`, {
      method: "DELETE",
    }).then(asCrmState),
  updateCrmProfile: (profileId, values) =>
    request(`/crm/profile/${encodeURIComponent(profileId)}`, {
      method: "PATCH",
      body: JSON.stringify(writableValues("users", values)),
    }).then(asCrmState),
  followCrmProfile: (profileId) =>
    request(`/crm/following/${encodeURIComponent(profileId)}`, {
      method: "POST",
    }).then(asCrmState),
  unfollowCrmProfile: (profileId) =>
    request(`/crm/following/${encodeURIComponent(profileId)}`, {
      method: "DELETE",
    }).then(asCrmState),
  createChatterPost: (content) =>
    request("/crm/chatter-posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    }).then(asCrmState),
  likeChatterPost: (postId) =>
    request(`/crm/chatter-posts/${encodeURIComponent(postId)}/likes/me`, {
      method: "PUT",
    }).then(asCrmState),
  unlikeChatterPost: (postId) =>
    request(`/crm/chatter-posts/${encodeURIComponent(postId)}/likes/me`, {
      method: "DELETE",
    }).then(asCrmState),
  commentOnChatterPost: (postId, content) =>
    request(`/crm/chatter-posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }).then(asCrmState),
  convertCrmLead: (leadId, conversion) =>
    request(`/crm/leads/${encodeURIComponent(leadId)}/convert`, {
      method: "POST",
      body: JSON.stringify(conversion),
    }).then(asCrmState),
  getInfo: () => request("/info"),
  listFiles: () => request("/files"),
  uploadFiles: (files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request("/files", { method: "POST", body: formData });
  },
};
